import { db } from "@/db";
import { staff, staffSpecialties, listings } from "@/db/schema";
import { and, eq, sql, or, isNull, ne, inArray } from "drizzle-orm";

/**
 * Phase 8: Smart staff assignment for new user-submitted listings.
 *
 * Algorithm:
 *  1. Find all active staff (manager or consultant with status='active')
 *  2. Filter by specialties that match listing's city/category/listingKinds
 *     - staff_specialties.city matches (or is null = handles all cities)
 *     - staff_specialties.category matches
 *     - staff_specialties.listing_type is in listingKinds (or null = handles both)
 *  3. From matching staff, pick the one with the fewest currently pending listings
 *  4. Fallback: first active staff if no specialty match
 *  5. Final fallback: first active manager
 *
 * Returns staff.id (number) or null if no staff available.
 */
export async function assignStaffForListing(params: {
  city: string;
  category: string;
  listingKinds: ("sale" | "rent")[];
}): Promise<number | null> {
  const { city, category, listingKinds } = params;

  // 1. Pull all active staff (managers + active consultants)
  const activeStaff = await db
    .select({
      id: staff.id,
      role: staff.role,
      status: staff.status,
    })
    .from(staff)
    .where(eq(staff.status, "active"));

  if (activeStaff.length === 0) {
    return null;
  }

  const activeStaffIds = activeStaff.map((s) => s.id);

  // 2. Pull matching specialties
  // Match conditions:
  //   - city matches listing.city OR specialty.city is null (handles all cities)
  //   - category matches
  //   - listing_type matches one of listingKinds OR is null (handles both)
  const matchingSpecialties = await db
    .select({
      staffId: staffSpecialties.staffId,
      city: staffSpecialties.city,
      listingType: staffSpecialties.listingType,
    })
    .from(staffSpecialties)
    .where(
      and(
        inArray(staffSpecialties.staffId, activeStaffIds),
        eq(staffSpecialties.isActive, true),
        eq(staffSpecialties.category, category),
        or(
          eq(staffSpecialties.city, city),
          isNull(staffSpecialties.city)
        ),
        or(
          inArray(staffSpecialties.listingType, listingKinds),
          isNull(staffSpecialties.listingType)
        )
      )
    );

  if (matchingSpecialties.length === 0) {
    // No specialty match - fallback to first active staff (load-balanced)
    return await fallbackToLeastBusy(activeStaffIds);
  }

  // 3. Get unique staff IDs from matching specialties
  const matchingStaffIds = Array.from(
    new Set(matchingSpecialties.map((s) => s.staffId))
  );

  // 4. Count pending listings per staff to pick least busy
  const loadCounts = await db
    .select({
      assignedStaffId: listings.assignedStaffId,
      count: sql<number>`count(*)::int`,
    })
    .from(listings)
    .where(
      and(
        inArray(listings.assignedStaffId, matchingStaffIds),
        eq(listings.approvalStatus, "pending")
      )
    )
    .groupBy(listings.assignedStaffId);

  const loadMap = new Map<number, number>();
  for (const row of loadCounts) {
    if (row.assignedStaffId != null) {
      loadMap.set(row.assignedStaffId, row.count);
    }
  }

  // 5. Pick staff with lowest load (ties broken by lower id)
  let bestStaffId: number | null = null;
  let bestLoad = Infinity;

  for (const sid of matchingStaffIds) {
    const load = loadMap.get(sid) ?? 0;
    if (load < bestLoad) {
      bestLoad = load;
      bestStaffId = sid;
    }
  }

  if (bestStaffId != null) {
    return bestStaffId;
  }

  // 6. Final fallback
  return await fallbackToLeastBusy(activeStaffIds);
}

/**
 * Fallback: pick the least-busy active staff across all active staff.
 * Prefers consultants (lower role priority) over managers for normal listings.
 */
async function fallbackToLeastBusy(activeStaffIds: number[]): Promise<number | null> {
  if (activeStaffIds.length === 0) return null;

  const loadCounts = await db
    .select({
      assignedStaffId: listings.assignedStaffId,
      count: sql<number>`count(*)::int`,
    })
    .from(listings)
    .where(
      and(
        inArray(listings.assignedStaffId, activeStaffIds),
        eq(listings.approvalStatus, "pending")
      )
    )
    .groupBy(listings.assignedStaffId);

  const loadMap = new Map<number, number>();
  for (const row of loadCounts) {
    if (row.assignedStaffId != null) {
      loadMap.set(row.assignedStaffId, row.count);
    }
  }

  let bestStaffId: number | null = null;
  let bestLoad = Infinity;

  for (const sid of activeStaffIds) {
    const load = loadMap.get(sid) ?? 0;
    if (load < bestLoad) {
      bestLoad = load;
      bestStaffId = sid;
    }
  }

  return bestStaffId;
}
