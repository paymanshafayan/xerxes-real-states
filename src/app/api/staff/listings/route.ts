import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { listings, staff, users } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { getListingPermissions } from "@/lib/listings/permissions";

/**
 * GET /api/staff/listings
 *
 * Manager: see all listings.
 * Consultant: see only listings where assigned_staff_id = me.
 *
 * Query params:
 *  - status: filter by approval status
 *  - limit: default 50
 *  - offset: default 0
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager", "consultant"]);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const offset = Number(url.searchParams.get("offset") || 0);

  // Build conditions
  const conditions = [];
  if (status) {
    conditions.push(eq(listings.approvalStatus, status));
  }

  // RBAC: consultant only sees assigned
  if (auth.role !== "manager") {
    conditions.push(eq(listings.assignedStaffId, auth.id));
  }

  const rows = await db
    .select({
      listing: listings,
      assignedStaff: {
        id: staff.id,
        name: staff.name,
        username: staff.username,
      },
      owner: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(listings)
    .leftJoin(staff, eq(listings.assignedStaffId, staff.id))
    .leftJoin(users, eq(listings.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(listings.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    listings: rows,
    count: rows.length,
    scope: auth.role === "manager" ? "all" : "assigned",
  });
}
