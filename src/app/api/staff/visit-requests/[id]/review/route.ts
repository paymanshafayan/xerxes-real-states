import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { visitRequests, listings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getListingPermissions } from "@/lib/listings/permissions";

/**
 * POST /api/staff/visit-requests/[id]/review
 *
 * Marks a visit request as "in review" by the staff. Status: staff_reviewing.
 * Assigns the visit request to the current staff if not already assigned.
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

  const permissions = getListingPermissions(listing, null, auth);
  if (!permissions.canContactOwner) {
    return NextResponse.json(
      { error: "Forbidden: only assigned staff or manager can review" },
      { status: 403 }
    );
  }

  if (!["pending", "staff_reviewing"].includes(vr.status)) {
    return NextResponse.json(
      { error: `Cannot review a request with status '${vr.status}'` },
      { status: 400 }
    );
  }

  await db
    .update(visitRequests)
    .set({
      status: "staff_reviewing",
      staffId: vr.staffId || auth.id,
      updatedAt: new Date(),
    })
    .where(eq(visitRequests.id, id));

  return NextResponse.json({ success: true });
}
