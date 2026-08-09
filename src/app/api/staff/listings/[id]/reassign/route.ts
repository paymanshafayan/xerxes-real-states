import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { staff, listings } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getListingById, approveReassign, getReassignRequests } from "@/lib/data/listings";

/**
 * POST /api/staff/listings/[id]/reassign
 *
 * Manager-only: directly reassign a listing to another active staff member.
 *
 * Body: { newStaffId: number, note?: string, reassignRequestId?: number }
 *
 * If `reassignRequestId` is provided, also resolves the corresponding
 * reassignment_requests row as approved.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const newStaffId = Number(body?.newStaffId);
    const note = (body?.note || "").toString().trim();
    const reassignRequestId = body?.reassignRequestId
      ? Number(body.reassignRequestId)
      : null;

    if (!newStaffId || newStaffId <= 0) {
      return NextResponse.json(
        { error: "newStaffId is required" },
        { status: 400 }
      );
    }

    // Verify target staff exists and is active
    const target = await db
      .select()
      .from(staff)
      .where(eq(staff.id, newStaffId))
      .limit(1);
    if (target.length === 0) {
      return NextResponse.json({ error: "Target staff not found" }, { status: 404 });
    }
    if (target[0].status !== "active") {
      return NextResponse.json(
        { error: "Target staff is not active" },
        { status: 400 }
      );
    }

    // If this is a response to a reassign request, use approveReassign flow
    if (reassignRequestId) {
      await approveReassign({
        reassignId: reassignRequestId,
        managerId: auth.id,
        newStaffId,
        note,
      });
    } else {
      // Direct reassign: do the swap directly
      const listing = await getListingById(id);
      if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }

      const oldStaffId = listing.assignedStaffId;
      await db
        .update(listings)
        .set({ assignedStaffId: newStaffId, updatedAt: new Date() })
        .where(eq(listings.id, id));

      // Update property agentId
      if (listing.propertyId && target[0].agentId) {
        await db
          .update(/* properties */ (await import("@/db/schema")).properties)
          .set({ agentId: target[0].agentId, updatedAt: new Date() })
          .where(eq((await import("@/db/schema")).properties.id, listing.propertyId));
      }

      // Status history
      const { recordStatusChange } = await import("@/lib/data/listings");
      await recordStatusChange({
        listingId: id,
        fromStatus: listing.approvalStatus,
        toStatus: listing.approvalStatus,
        changedByStaffId: auth.id,
        note: `Directly reassigned from staff #${oldStaffId} to #${newStaffId}. ${note}`,
      });

      // Notify
      const { notifyListingReassigned } = await import("@/lib/listings/notify");
      const { logActivity } = await import("@/lib/activityLog");
      const { cache } = await import("@/lib/cache");
      await notifyListingReassigned({
        oldStaffId,
        newStaffId,
        userId: listing.userId,
        listingId: id,
        listingTitle: listing.title,
      });
      await logActivity({
        action: "reassign",
        entity: "listing",
        entityId: id,
        details: `Reassigned by manager #${auth.id} to #${newStaffId}`,
        userName: `manager:${auth.id}`,
      });
      await cache.delPattern("listings:*");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST reassign error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to reassign" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/staff/listings/[id]/reassign
 *
 * Returns pending reassignment requests for this listing (manager view).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Fetch all pending reassign requests
  const all = await getReassignRequests("pending");
  const filtered = all.filter((r) => r.listing.id === id);

  return NextResponse.json({ reassignRequests: filtered });
}
