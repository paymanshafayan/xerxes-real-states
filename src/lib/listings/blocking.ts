import { db } from "@/db";
import {
  listings,
  visitRequests,
  properties,
  users,
  staff,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { recordStatusChange } from "@/lib/data/listings";
import {
  notifyUserBlocked,
  notifyVisitRequestStatus,
} from "@/lib/listings/notify";
import { logActivity } from "@/lib/activityLog";
import { cache } from "@/lib/cache";

/**
 * Phase 8: Block system - core function.
 *
 * Called when a staff member reports a listing as unavailable (owner says
 * it's no longer for sale/rent). Triggers:
 *  1. Block the user (users.is_blocked = true)
 *  2. Hide all user's properties from public (properties.is_listed = false)
 *  3. Mark all user's listings as unavailable_reported
 *  4. Record status history for each listing
 *  5. Notify the user (in-app + push)
 *  6. Notify the affected visit requester (their visit is invalid)
 *  7. Activity log
 *  8. Invalidate caches
 *
 * Idempotent: if user is already blocked, returns without action.
 */
export async function reportListingUnavailable(params: {
  listingId: number;
  visitRequestId?: number | null;
  staffId: number;
  notes: string;
}): Promise<{
  userId: number;
  affectedListings: number;
  affectedProperties: number;
}> {
  const { listingId, visitRequestId, staffId, notes } = params;

  // 1. Get the listing + user
  const listingRows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (listingRows.length === 0) {
    throw new Error("Listing not found");
  }
  const listing = listingRows[0];
  const userId = listing.userId;

  // Get user to check if already blocked
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRows.length === 0) {
    throw new Error("User not found");
  }
  const user = userRows[0];

  // Idempotent: if already blocked, just record the report and return
  const alreadyBlocked = user.isBlocked;

  // 2. Block the user (if not already)
  if (!alreadyBlocked) {
    await db
      .update(users)
      .set({
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: `ثبت ملک غیرموجود توسط کارشناس: ${notes}`,
        blockedByStaffId: staffId,
      })
      .where(eq(users.id, userId));
  } else {
    // Update the reason/timestamp
    await db
      .update(users)
      .set({
        blockedAt: new Date(),
        blockedReason: `گزارش جدید عدم موجودیت: ${notes}`,
        blockedByStaffId: staffId,
      })
      .where(eq(users.id, userId));
  }

  // 3. Get all user listings
  const userListings = await db
    .select({
      id: listings.id,
      propertyId: listings.propertyId,
      approvalStatus: listings.approvalStatus,
    })
    .from(listings)
    .where(eq(listings.userId, userId));

  // 4. Hide all linked properties from public
  const propertyIds = userListings
    .map((l) => l.propertyId)
    .filter((id): id is number => id != null);

  if (propertyIds.length > 0) {
    await db
      .update(properties)
      .set({ isListed: false, updatedAt: new Date() })
      .where(inArray(properties.id, propertyIds));
  }

  // 5. Mark all listings as unavailable_reported (or update report metadata)
  for (const l of userListings) {
    const fromStatus = l.approvalStatus;
    if (fromStatus !== "unavailable_reported") {
      await db
        .update(listings)
        .set({
          approvalStatus: "unavailable_reported",
          unavailabilityReportedAt: new Date(),
          unavailabilityReportNotes: notes,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, l.id));

      // Record status
      await recordStatusChange({
        listingId: l.id,
        fromStatus,
        toStatus: "unavailable_reported",
        changedByStaffId: staffId,
        note: `Owner reported unavailable. Block triggered. ${notes}`,
      });
    }
  }

  // 6. Update the visit request (if any) to reflect the unavailability
  if (visitRequestId) {
    await db
      .update(visitRequests)
      .set({
        status: "rejected",
        ownerResponse: "unavailable",
        ownerResponseNote: notes,
        unavailabilityReported: true,
        updatedAt: new Date(),
      })
      .where(eq(visitRequests.id, visitRequestId));
  }

  // 7. Find all in-flight visit requests to the user's listings and notify them
  const affectedListings = userListings.map((l) => l.id);
  if (affectedListings.length > 0) {
    const inFlightRequests = await db
      .select()
      .from(visitRequests)
      .where(
        and(
          inArray(visitRequests.listingId, affectedListings),
          inArray(visitRequests.status, [
            "pending",
            "staff_reviewing",
            "owner_contacted",
            "approved",
          ])
        )
      );

    for (const req of inFlightRequests) {
      // Notify requester that the property is unavailable
      await notifyVisitRequestStatus({
        userId: req.requesterUserId,
        visitRequestId: req.id,
        listingId: req.listingId,
        status: "rejected",
        message:
          "متأسفانه ملک مورد نظر شما دیگر در دسترس نیست. درخواست بازدید لغو شد.",
      });
    }
  }

  // 8. Notify the blocked user (in-app)
  await notifyUserBlocked({
    userId,
    reason: `گزارش عدم موجودیت توسط کارشناس: ${notes}`,
  });

  // 9. Activity log
  await logActivity({
    action: "block",
    entity: "user",
    entityId: userId,
    details: `User blocked after unavailability report. Listings: ${userListings.length}, Properties hidden: ${propertyIds.length}. Notes: ${notes}`,
    userName: `staff:${staffId}`,
  });

  // 10. Invalidate caches
  await cache.delPattern("properties:*");
  await cache.delPattern("property:*");
  await cache.delPattern("listings:*");

  return {
    userId,
    affectedListings: userListings.length,
    affectedProperties: propertyIds.length,
  };
}
