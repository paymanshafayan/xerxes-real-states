import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { visitRequests, listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getListingPermissions } from "@/lib/listings/permissions";
import { reportListingUnavailable } from "@/lib/listings/blocking";
import { notifyVisitRequestStatus } from "@/lib/listings/notify";

/**
 * POST /api/staff/visit-requests/[id]/report-unavailable
 *
 * Direct route to mark a property as unavailable and trigger a user block.
 * This is an alternative path to /contact-owner with ownerResponse=unavailable,
 * used when a visit already happened or the staff has independent evidence.
 *
 * Body: { note?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager", "consultant"]);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const note = (body?.note || "").toString().trim();
    if (!note || note.length < 5) {
      return NextResponse.json(
        { error: "A note is required (min 5 chars)" },
        { status: 400 }
      );
    }

    // Fetch
    const rows = await db
      .select({ vr: visitRequests, listing: listings })
      .from(visitRequests)
      .innerJoin(listings, eq(visitRequests.listingId, listings.id))
      .where(eq(visitRequests.id, id))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { vr, listing } = rows[0];

    // Permission
    const permissions = getListingPermissions(listing, null, auth);
    if (!permissions.canReportUnavailable) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Trigger block
    const blockResult = await reportListingUnavailable({
      listingId: listing.id,
      visitRequestId: id,
      staffId: auth.id,
      notes: note,
    });

    // Notify the requester about their cancelled visit
    await notifyVisitRequestStatus({
      userId: vr.requesterUserId,
      visitRequestId: id,
      listingId: listing.id,
      status: "rejected",
      message:
        "متأسفانه ملک مورد نظر شما دیگر در دسترس نیست. درخواست بازدید لغو شد.",
    });

    return NextResponse.json({
      success: true,
      block: blockResult,
      message: "گزارش ثبت و حساب کاربر بلاک شد.",
    });
  } catch (err: any) {
    console.error("POST report-unavailable error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to report" },
      { status: 400 }
    );
  }
}
