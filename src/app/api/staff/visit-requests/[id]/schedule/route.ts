import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { visitRequests, listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getListingPermissions } from "@/lib/listings/permissions";
import { notifyVisitRequestStatus } from "@/lib/listings/notify";

/**
 * POST /api/staff/visit-requests/[id]/schedule
 *
 * Sets the appointment date and notes for an approved visit request.
 * Status -> completed (visit scheduled and confirmed).
 *
 * Body: { appointmentDate: ISO date string, appointmentNotes?: string }
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
    const appointmentDateStr = body?.appointmentDate;
    const appointmentNotes = (body?.appointmentNotes || "").toString().trim();

    if (!appointmentDateStr) {
      return NextResponse.json(
        { error: "appointmentDate is required (ISO date string)" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(appointmentDateStr);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid appointmentDate" },
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
    if (!permissions.canScheduleVisit) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (vr.status !== "approved" && vr.status !== "owner_contacted") {
      return NextResponse.json(
        { error: `Cannot schedule a visit with status '${vr.status}'` },
        { status: 400 }
      );
    }

    // Update
    await db
      .update(visitRequests)
      .set({
        status: "completed",
        appointmentDate,
        appointmentNotes: appointmentNotes || null,
        requesterNotifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(visitRequests.id, id));

    // Notify requester
    const formattedDate = appointmentDate.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    await notifyVisitRequestStatus({
      userId: vr.requesterUserId,
      visitRequestId: id,
      listingId: listing.id,
      status: "completed",
      message: `زمان بازدید شما برای ${formattedDate} تنظیم شد.${appointmentNotes ? ` یادداشت: ${appointmentNotes}` : ""}`,
    });

    return NextResponse.json({
      success: true,
      message: "زمان بازدید با موفقیت تنظیم شد و به متقاضی اطلاع داده شد.",
    });
  } catch (err: any) {
    console.error("POST schedule error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to schedule" },
      { status: 400 }
    );
  }
}
