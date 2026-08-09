import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { visitRequests, listings, users } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * GET /api/staff/visit-requests
 *
 * Manager: see all visit requests.
 * Consultant: see only visit requests for listings where they're assigned.
 *
 * Query params:
 *  - status: pending|staff_reviewing|owner_contacted|approved|rejected|completed|cancelled
 *  - listingId: filter by listing
 *  - limit, offset
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager", "consultant"]);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const listingId = url.searchParams.get("listingId")
    ? Number(url.searchParams.get("listingId"))
    : null;
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const offset = Number(url.searchParams.get("offset") || 0);

  // First, find the listing IDs this staff is allowed to see
  let allowedListingIds: number[] | null = null;
  if (auth.role !== "manager") {
    const assigned = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.assignedStaffId, auth.id));
    allowedListingIds = assigned.map((r) => r.id);
    if (allowedListingIds.length === 0) {
      return NextResponse.json({ visitRequests: [], count: 0 });
    }
  }

  // Build conditions
  const conditions = [];
  if (status) {
    conditions.push(eq(visitRequests.status, status));
  }
  if (listingId) {
    conditions.push(eq(visitRequests.listingId, listingId));
  }
  if (allowedListingIds) {
    conditions.push(inArray(visitRequests.listingId, allowedListingIds));
  }

  const rows = await db
    .select({
      visitRequest: visitRequests,
      listing: {
        id: listings.id,
        title: listings.title,
        city: listings.city,
        category: listings.category,
        images: listings.images,
        slug: listings.slug,
      },
      requester: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
    })
    .from(visitRequests)
    .innerJoin(listings, eq(visitRequests.listingId, listings.id))
    .innerJoin(users, eq(visitRequests.requesterUserId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(visitRequests.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    visitRequests: rows,
    count: rows.length,
    scope: auth.role === "manager" ? "all" : "assigned",
  });
}
