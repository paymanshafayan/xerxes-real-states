import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { visitRequests, listings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getListingPermissions } from "@/lib/listings/permissions";
import { reportListingUnavailable } from "@/lib/listings/blocking";
import { notifyVisitRequestStatus } from "@/lib/listings/notify";

/**
 * POST /api/staff/visit-requests/[id]/contact-owner
 *
 * Records the result of the staff's phone call to the listing's owner.
 *
 * Body: {
 *   ownerResponse: "available" | "unavailable" | "no_response",
 *   note?: string
 * }
 *
 * Side effects by ownerResponse:
 *  - available: status -> owner_contacted, notify requester to wait for schedule
 *  - unavailable: BLOCK the user, hide all their listings, notify requester
 *  - no_response: status -> owner_contacted, no notification
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
    const ownerResponse = body?.ownerResponse;
    const note = (body?.note || "").toString().trim();

    if (!["available", "unavailable", "no_response"].includes(ownerResponse)) {
      return NextResponse.json(
        { error: "ownerResponse must be one of: available, unavailable, no_response" },
        { status: 400 }
      );
    }

    // Fetch visit request with listing
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
    if (!permissions.canContactOwner) {
      return NextResponse.json(
        { error: "Forbidden: only assigned staff or manager can contact owner" },
        { status: 403 }
      );
    }

    // Update visit request
    const newStatus =
      ownerResponse === "available" ? "approved" : "owner_contacted";
    await db
      .update(visitRequests)
      .set({
        ownerResponse,
        ownerResponseNote: note || null,
        contactedAt: new Date(),
        status: newStatus,
        staffId: auth.id,
        updatedAt: new Date(),
      })
      .where(eq(visitRequests.id, id));

    if (ownerResponse === "unavailable") {
      // TRIGGER BLOCK
      const blockResult = await reportListingUnavailable({
        listingId: listing.id,
        visitRequestId: id,
        staffId: auth.id,
        notes: note || "Owner reported property unavailable during visit scheduling",
      });

      // Notify the requester
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
        action: "blocked",
        block: blockResult,
        message: "گزارش عدم موجودیت ثبت و حساب کاربر بلاک شد.",
      });
    }

    if (ownerResponse === "available") {
      // Notify requester
      await notifyVisitRequestStatus({
        userId: vr.requesterUserId,
        visitRequestId: id,
        listingId: listing.id,
        status: "approved",
        message:
          "کارشناس با صاحب ملک تماس گرفت و ملک در دسترس است. لطفاً برای هماهنگی زمان بازدید منتظر بمانید.",
      });
    }

    return NextResponse.json({
      success: true,
      action: ownerResponse,
      message:
        ownerResponse === "available"
          ? "صاحب ملک در دسترس است. لطفاً زمان بازدید را تنظیم کنید."
          : "نتیجه تماس ثبت شد.",
    });
  } catch (err: any) {
    console.error("POST contact-owner error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to record contact" },
      { status: 400 }
    );
  }
}
