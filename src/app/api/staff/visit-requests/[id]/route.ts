import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { visitRequests, listings, users, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getListingPermissions } from "@/lib/listings/permissions";

/**
 * GET /api/staff/visit-requests/[id]
 *
 * Returns a single visit request with full context.
 */
export async function GET(
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

  const rows = await db
    .select({
      visitRequest: visitRequests,
      listing: listings,
      requester: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
      assignedStaff: {
        id: staff.id,
        name: staff.name,
        username: staff.username,
      },
    })
    .from(visitRequests)
    .innerJoin(listings, eq(visitRequests.listingId, listings.id))
    .innerJoin(users, eq(visitRequests.requesterUserId, users.id))
    .leftJoin(staff, eq(visitRequests.staffId, staff.id))
    .where(eq(visitRequests.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = rows[0];

  // Permission: consultant only sees assigned listings
  const permissions = getListingPermissions(row.listing, null, auth);
  if (permissions.access === "none" || permissions.access === "readonly") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ...row, permissions });
}
