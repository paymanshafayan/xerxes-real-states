import { db } from "@/db";
import {
  listings,
  listingsStatusHistory,
  userProfiles,
  notifications,
  visitRequests,
  staff,
  properties,
  reassignmentRequests,
  users,
} from "@/db/schema";
import { eq, and, desc, sql, isNull, ne, or, inArray } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { cache, cacheKeys } from "@/lib/cache";
import { assignStaffForListing } from "@/lib/listings/assignment";
import {
  notifyListingApproved,
  notifyListingRejected,
  notifyListingRemoved,
  notifyListingSubmitted,
  notifyUserBlocked,
  notifyUserUnblocked,
  notifyListingReassigned,
} from "@/lib/listings/notify";
import type { ListingCreateInput } from "@/lib/listings/validation";

/**
 * Phase 8: User Listings - Data access layer.
 *
 * All operations are scoped by user/staff and respect RBAC.
 */

// =============================================================================
// Types
// =============================================================================

export type ListingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "removed"
  | "unavailable_reported";

export type ListingKind = "sale" | "rent";

export type Listing = typeof listings.$inferSelect;

export type ListingWithStatusHistory = Listing & {
  history: (typeof listingsStatusHistory.$inferSelect)[];
  assignedStaff?: { id: number; name: string; username: string } | null;
};

// =============================================================================
// Helpers
// =============================================================================

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}

export async function recordStatusChange(params: {
  listingId: number;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId?: number | null;
  changedByStaffId?: number | null;
  note?: string;
}) {
  await db.insert(listingsStatusHistory).values({
    listingId: params.listingId,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    changedByUserId: params.changedByUserId ?? null,
    changedByStaffId: params.changedByStaffId ?? null,
    note: params.note ?? null,
  });
}

// =============================================================================
// Create
// =============================================================================

export interface CreateListingResult {
  listing: Listing;
  assignedStaffId: number | null;
}

/**
 * Create a new user listing and assign a staff member.
 * Throws on error.
 */
export async function createListing(params: {
  userId: number;
  input: ListingCreateInput;
  uploadedImages: string[];
  uploadedVideos: string[];
}): Promise<CreateListingResult> {
  const { userId, input, uploadedImages, uploadedVideos } = params;

  // Snapshot contact info from user + profile
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRows.length === 0) {
    throw new Error("User not found");
  }
  const user = userRows[0];

  // Optional profile - for contact phone
  let contactPhone = user.phone || "";
  let contactName = user.name;
  if (input.profile?.lastName) {
    contactName = `${user.name} ${input.profile.lastName}`.trim();
  }
  if (input.profile?.nationalId) {
    // We don't store contact phone from profile; use user.phone
  }

  // Determine the property type for the eventual public Property row
  // If user selected both sale+rent, the public Property will get a primary type
  // (we use 'sale' as primary since the data is single-type in the existing schema).
  // The listing itself stores both kinds in listingKinds.

  // Generate unique slug
  let slug = generateSlug(input.title);
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.slug, slug))
      .limit(1);
    if (existing.length === 0) break;
    slug = generateSlug(input.title);
    attempts++;
  }

  // Insert listing
  const inserted = await db
    .insert(listings)
    .values({
      slug,
      userId,
      listingKinds: input.listingKinds,
      category: input.category,
      title: input.title,
      description: input.description,
      address: input.address,
      city: input.city,
      district: input.district || null,
      country: input.country || "Turkey",
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      price: input.price ?? null,
      rentDeposit: input.rentDeposit ?? null,
      monthlyRent: input.monthlyRent ?? null,
      currency: input.currency || "GBP",
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area,
      features: input.features,
      images: uploadedImages,
      videos: uploadedVideos,
      contactName,
      contactPhone: contactPhone || "—",
      contactEmail: user.email,
      approvalStatus: "pending",
    })
    .returning();

  const newListing = inserted[0];

  // Assign staff
  const assignedStaffId = await assignStaffForListing({
    city: input.city,
    category: input.category,
    listingKinds: input.listingKinds,
  });

  if (assignedStaffId) {
    await db
      .update(listings)
      .set({ assignedStaffId, updatedAt: new Date() })
      .where(eq(listings.id, newListing.id));
  }

  // Record initial status
  await recordStatusChange({
    listingId: newListing.id,
    fromStatus: null,
    toStatus: "pending",
    changedByUserId: userId,
    note: assignedStaffId
      ? `Assigned to staff #${assignedStaffId}`
      : "No matching staff - awaiting manual assignment",
  });

  // Notify
  await notifyListingSubmitted({
    listingId: newListing.id,
    listingTitle: input.title,
    assignedStaffId,
  });

  // Invalidate cache
  await cache.delPattern("listings:*");

  return {
    listing: { ...newListing, assignedStaffId },
    assignedStaffId,
  };
}

// =============================================================================
// Read
// =============================================================================

export async function getListingById(id: number): Promise<Listing | null> {
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function getListingsByUser(
  userId: number,
  status?: ListingStatus
): Promise<Listing[]> {
  const conditions = status
    ? and(eq(listings.userId, userId), eq(listings.approvalStatus, status))
    : eq(listings.userId, userId);

  return await db
    .select()
    .from(listings)
    .where(conditions)
    .orderBy(desc(listings.createdAt));
}

export async function getListingWithHistory(
  id: number
): Promise<ListingWithStatusHistory | null> {
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (rows.length === 0) return null;

  const history = await db
    .select()
    .from(listingsStatusHistory)
    .where(eq(listingsStatusHistory.listingId, id))
    .orderBy(desc(listingsStatusHistory.createdAt));

  let assignedStaffData: { id: number; name: string; username: string } | null = null;
  if (rows[0].assignedStaffId) {
    const staffRows = await db
      .select({
        id: staff.id,
        name: staff.name,
        username: staff.username,
      })
      .from(staff)
      .where(eq(staff.id, rows[0].assignedStaffId))
      .limit(1);
    if (staffRows.length > 0) {
      assignedStaffData = staffRows[0];
    }
  }

  return { ...rows[0], history, assignedStaff: assignedStaffData };
}

// =============================================================================
// Update - User actions
// =============================================================================

/**
 * Soft-delete a listing by its owner.
 * Sets status to 'removed' and hides the linked property from public list.
 */
export async function softDeleteListingByUser(params: {
  listingId: number;
  userId: number;
}): Promise<void> {
  const { listingId, userId } = params;

  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Listing not found or you don't have permission");
  }
  const listing = rows[0];

  if (listing.approvalStatus === "removed") {
    throw new Error("Listing already removed");
  }

  // Update listing
  await db
    .update(listings)
    .set({
      approvalStatus: "removed",
      removedByUser: true,
      removedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  // Hide linked property
  if (listing.propertyId) {
    await db
      .update(properties)
      .set({ isListed: false, updatedAt: new Date() })
      .where(eq(properties.id, listing.propertyId));
  }

  // Record status
  await recordStatusChange({
    listingId,
    fromStatus: listing.approvalStatus,
    toStatus: "removed",
    changedByUserId: userId,
    note: "Removed by user",
  });

  // Notify
  await notifyListingRemoved({
    assignedStaffId: listing.assignedStaffId,
    listingId,
    listingTitle: listing.title,
    userId,
  });

  // Invalidate cache
  await cache.delPattern("listings:*");
  await cache.delPattern("properties:*");
  await cache.delPattern("property:*");
}

/**
 * Add panoramas to an approved listing.
 */
export async function addPanoramasToListing(params: {
  listingId: number;
  userId: number;
  panoramaUrls: string[];
}): Promise<{ panoramas: string[]; total: number }> {
  const { listingId, userId, panoramaUrls } = params;

  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Listing not found or you don't have permission");
  }

  const listing = rows[0];

  if (listing.approvalStatus !== "approved") {
    throw new Error("Panoramas can only be added to approved listings");
  }

  const currentPanoramas = (listing.panoramas as string[]) || [];
  const newPanoramas = [...currentPanoramas, ...panoramaUrls];

  await db
    .update(listings)
    .set({ panoramas: newPanoramas, updatedAt: new Date() })
    .where(eq(listings.id, listingId));

  // Sync to linked property
  if (listing.propertyId) {
    const propRows = await db
      .select({ panoramas: properties.panoramas })
      .from(properties)
      .where(eq(properties.id, listing.propertyId))
      .limit(1);
    if (propRows.length > 0) {
      const propPanoramas = (propRows[0].panoramas as string[]) || [];
      await db
        .update(properties)
        .set({
          panoramas: [...propPanoramas, ...panoramaUrls],
          updatedAt: new Date(),
        })
        .where(eq(properties.id, listing.propertyId));
    }
  }

  // Invalidate cache
  await cache.delPattern("listings:*");
  await cache.delPattern("properties:*");
  await cache.delPattern("property:*");

  return { panoramas: newPanoramas, total: newPanoramas.length };
}

/**
 * Remove a single panorama from a listing.
 */
export async function removePanoramaFromListing(params: {
  listingId: number;
  userId: number;
  panoramaUrl: string;
}): Promise<{ panoramas: string[]; total: number }> {
  const { listingId, userId, panoramaUrl } = params;

  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Listing not found or you don't have permission");
  }

  const listing = rows[0];
  const currentPanoramas = (listing.panoramas as string[]) || [];
  const newPanoramas = currentPanoramas.filter((p) => p !== panoramaUrl);

  await db
    .update(listings)
    .set({ panoramas: newPanoramas, updatedAt: new Date() })
    .where(eq(listings.id, listingId));

  if (listing.propertyId) {
    const propRows = await db
      .select({ panoramas: properties.panoramas })
      .from(properties)
      .where(eq(properties.id, listing.propertyId))
      .limit(1);
    if (propRows.length > 0) {
      const propPanoramas = (propRows[0].panoramas as string[]) || [];
      const newPropPanoramas = propPanoramas.filter((p) => p !== panoramaUrl);
      await db
        .update(properties)
        .set({ panoramas: newPropPanoramas, updatedAt: new Date() })
        .where(eq(properties.id, listing.propertyId));
    }
  }

  await cache.delPattern("listings:*");
  await cache.delPattern("properties:*");

  return { panoramas: newPanoramas, total: newPanoramas.length };
}

// =============================================================================
// Notifications
// =============================================================================

export async function getUserNotifications(
  userId: number,
  limit: number = 50
) {
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(
  userId: number
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      )
    );
  return Number(result[0]?.count || 0);
}

export async function markNotificationRead(params: {
  notificationId: number;
  userId: number;
}): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, params.notificationId),
        eq(notifications.userId, params.userId)
      )
    )
    .returning();
  return result.length > 0;
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      )
    );
}

// =============================================================================
// User Profile
// =============================================================================

export async function getUserProfile(userId: number) {
  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return rows[0] || null;
}

export async function upsertUserProfile(params: {
  userId: number;
  data: Partial<typeof userProfiles.$inferInsert>;
}) {
  const { userId, data } = params;
  const existing = await getUserProfile(userId);

  if (existing) {
    const result = await db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result[0];
  } else {
    const result = await db
      .insert(userProfiles)
      .values({ ...data, userId })
      .returning();
    return result[0];
  }
}

// =============================================================================
// Visit Requests (user side)
// =============================================================================

export async function createVisitRequest(params: {
  requesterUserId: number;
  input: {
    listingId: number;
    requesterName: string;
    requesterPhone: string;
    requesterEmail?: string;
    preferredDate?: Date | null;
    note?: string;
  };
}) {
  const { requesterUserId, input } = params;

  // Verify listing exists and is approved
  const listingRows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, input.listingId))
    .limit(1);
  if (listingRows.length === 0) {
    throw new Error("Listing not found");
  }
  const listing = listingRows[0];
  if (listing.approvalStatus !== "approved") {
    throw new Error("Can only request visits for approved listings");
  }

  // Cannot request visit on own listing
  if (listing.userId === requesterUserId) {
    throw new Error("You cannot request a visit to your own listing");
  }

  // Inherit staff from listing
  const staffId = listing.assignedStaffId;

  const result = await db
    .insert(visitRequests)
    .values({
      listingId: input.listingId,
      propertyId: listing.propertyId,
      requesterUserId,
      requesterName: input.requesterName,
      requesterPhone: input.requesterPhone,
      requesterEmail: input.requesterEmail || null,
      preferredDate: input.preferredDate || null,
      note: input.note || null,
      status: "pending",
      staffId,
    })
    .returning();

  return { visitRequest: result[0], assignedStaffId: staffId };
}

export async function getVisitRequestsByUser(userId: number) {
  return await db
    .select({
      visitRequest: visitRequests,
      listing: {
        id: listings.id,
        title: listings.title,
        city: listings.city,
        images: listings.images,
        slug: listings.slug,
      },
    })
    .from(visitRequests)
    .innerJoin(listings, eq(visitRequests.listingId, listings.id))
    .where(eq(visitRequests.requesterUserId, userId))
    .orderBy(desc(visitRequests.createdAt));
}

// =============================================================================
// Block / Unblock
// =============================================================================

/**
 * Block a user account (called by staff via unavailability report).
 */
export async function blockUser(params: {
  userId: number;
  staffId: number;
  reason: string;
}): Promise<void> {
  const { userId, staffId, reason } = params;

  await db
    .update(users)
    .set({
      isBlocked: true,
      blockedAt: new Date(),
      blockedReason: reason,
      blockedByStaffId: staffId,
    })
    .where(eq(users.id, userId));

  // Hide all user's properties from public
  const userListings = await db
    .select({ id: listings.id, propertyId: listings.propertyId })
    .from(listings)
    .where(eq(listings.userId, userId));

  const propertyIds = userListings
    .map((l) => l.propertyId)
    .filter((id): id is number => id != null);

  if (propertyIds.length > 0) {
    await db
      .update(properties)
      .set({ isListed: false, updatedAt: new Date() })
      .where(inArray(properties.id, propertyIds));
  }

  // Mark all listings as unavailable_reported
  for (const listing of userListings) {
    if (listing.propertyId) {
      await db
        .update(listings)
        .set({
          approvalStatus: "unavailable_reported",
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listing.id));
    }
  }

  // Notify user
  await notifyUserBlocked({ userId, reason });

  // Activity log
  await logActivity({
    action: "block",
    entity: "user",
    entityId: userId,
    details: `User blocked: ${reason}`,
    userName: `staff:${staffId}`,
  });

  // Invalidate caches
  await cache.delPattern("properties:*");
  await cache.delPattern("listings:*");
}

/**
 * Unblock a user account (manager only).
 */
export async function unblockUser(params: {
  userId: number;
  managerId: number;
  reason: string;
}): Promise<void> {
  const { userId, managerId, reason } = params;

  await db
    .update(users)
    .set({
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      blockedByStaffId: null,
    })
    .where(eq(users.id, userId));

  // Note: previously-hidden listings are NOT auto-restored.
  // The user must re-submit, or manager can manually re-approve.

  await notifyUserUnblocked({ userId, reason });

  await logActivity({
    action: "unblock",
    entity: "user",
    entityId: userId,
    details: `User unblocked: ${reason}`,
    userName: `manager:${managerId}`,
  });
}

// =============================================================================
// Staff assignments and reassign
// =============================================================================

export async function requestReassign(params: {
  listingId: number;
  staffId: number;
  reason: string;
  preferredStaffId?: number | null;
}) {
  const { listingId, staffId, reason, preferredStaffId } = params;

  // Verify the staff is currently assigned
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (rows.length === 0) throw new Error("Listing not found");
  if (rows[0].assignedStaffId !== staffId) {
    throw new Error("Only the currently assigned staff can request reassignment");
  }

  const result = await db
    .insert(reassignmentRequests)
    .values({
      listingId,
      requestedByStaffId: staffId,
      reason,
      preferredStaffId: preferredStaffId || null,
      status: "pending",
    })
    .returning();

  return result[0];
}

export async function approveReassign(params: {
  reassignId: number;
  managerId: number;
  newStaffId: number;
  note?: string;
}): Promise<void> {
  const { reassignId, managerId, newStaffId, note } = params;

  const rows = await db
    .select()
    .from(reassignmentRequests)
    .where(eq(reassignmentRequests.id, reassignId))
    .limit(1);
  if (rows.length === 0) throw new Error("Reassignment request not found");
  const req = rows[0];
  if (req.status !== "pending") {
    throw new Error("Reassignment request is not pending");
  }

  // Verify new staff exists and is active
  const newStaffRows = await db
    .select()
    .from(staff)
    .where(eq(staff.id, newStaffId))
    .limit(1);
  if (newStaffRows.length === 0) throw new Error("Target staff not found");
  if (newStaffRows[0].status !== "active") {
    throw new Error("Target staff is not active");
  }

  // Apply reassignment
  const oldStaffId = req.requestedByStaffId;
  await db
    .update(listings)
    .set({ assignedStaffId: newStaffId, updatedAt: new Date() })
    .where(eq(listings.id, req.listingId));

  // Update linked property's agentId
  const listingRows = await db
    .select({ propertyId: listings.propertyId, userId: listings.userId, title: listings.title })
    .from(listings)
    .where(eq(listings.id, req.listingId))
    .limit(1);
  if (listingRows[0]?.propertyId && newStaffRows[0].agentId) {
    await db
      .update(properties)
      .set({ agentId: newStaffRows[0].agentId, updatedAt: new Date() })
      .where(eq(properties.id, listingRows[0].propertyId));
  }

  // Record status
  await recordStatusChange({
    listingId: req.listingId,
    fromStatus: "pending", // not strictly a status change
    toStatus: "pending",
    changedByStaffId: managerId,
    note: `Reassigned from staff #${oldStaffId} to staff #${newStaffId}. ${note || ""}`,
  });

  // Resolve the request
  await db
    .update(reassignmentRequests)
    .set({
      status: "approved",
      resolvedByStaffId: managerId,
      resolvedAt: new Date(),
      resolutionNote: note || null,
    })
    .where(eq(reassignmentRequests.id, reassignId));

  // Notify
  if (listingRows[0]) {
    await notifyListingReassigned({
      oldStaffId,
      newStaffId,
      userId: listingRows[0].userId,
      listingId: req.listingId,
      listingTitle: listingRows[0].title,
    });
  }

  await logActivity({
    action: "reassign",
    entity: "listing",
    entityId: req.listingId,
    details: `Reassigned by manager #${managerId} to staff #${newStaffId}`,
    userName: `manager:${managerId}`,
  });

  await cache.delPattern("listings:*");
}

export async function rejectReassign(params: {
  reassignId: number;
  managerId: number;
  note?: string;
}): Promise<void> {
  const { reassignId, managerId, note } = params;

  await db
    .update(reassignmentRequests)
    .set({
      status: "rejected",
      resolvedByStaffId: managerId,
      resolvedAt: new Date(),
      resolutionNote: note || null,
    })
    .where(eq(reassignmentRequests.id, reassignId));

  await logActivity({
    action: "reassign_reject",
    entity: "reassignment_request",
    entityId: reassignId,
    details: `Reassign request rejected by manager #${managerId}`,
    userName: `manager:${managerId}`,
  });
}

export async function getReassignRequests(status?: "pending" | "approved" | "rejected") {
  const conditions = status
    ? eq(reassignmentRequests.status, status)
    : undefined;

  return await db
    .select({
      request: reassignmentRequests,
      listing: {
        id: listings.id,
        title: listings.title,
        city: listings.city,
      },
    })
    .from(reassignmentRequests)
    .innerJoin(listings, eq(reassignmentRequests.listingId, listings.id))
    .where(conditions)
    .orderBy(desc(reassignmentRequests.createdAt));
}

// =============================================================================
// Approve / Reject (called by staff API in phase 3, but logic lives here)
// =============================================================================

export async function approveListing(params: {
  listingId: number;
  staffId: number;
}): Promise<{ propertyId: number }> {
  const { listingId, staffId } = params;

  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (rows.length === 0) throw new Error("Listing not found");
  const listing = rows[0];
  if (listing.approvalStatus !== "pending") {
    throw new Error("Listing is not pending");
  }

  // Determine the property type. If listing has both kinds, default to 'sale'.
  const hasSale = (listing.listingKinds as string[]).includes("sale");
  const primaryType: "sale" | "rent" = hasSale ? "sale" : "rent";

  // Generate a property slug
  const propSlug = `usr-${listing.slug}-${Date.now().toString(36)}`;

  // Get agent id from staff (if linked)
  const staffRows = await db
    .select({ agentId: staff.agentId })
    .from(staff)
    .where(eq(staff.id, staffId))
    .limit(1);
  const agentId = staffRows[0]?.agentId || null;

  // Create the public Property row
  const propInsert = await db
    .insert(properties)
    .values({
      slug: propSlug,
      // Mirror title/description into all 4 languages (for now, same content)
      titleTr: listing.title,
      titleEn: listing.title,
      titleFa: listing.title,
      titleRu: listing.title,
      descriptionTr: listing.description,
      descriptionEn: listing.description,
      descriptionFa: listing.description,
      descriptionRu: listing.description,
      type: primaryType,
      category: listing.category as any,
      price: listing.price ?? listing.rentDeposit ?? 0,
      currency: listing.currency,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area: listing.area,
      city: listing.city,
      district: listing.district,
      address: listing.address,
      lat: listing.lat,
      lng: listing.lng,
      images: listing.images as string[],
      features: listing.features as string[],
      isFeatured: false,
      agentId,
      panoramas: (listing.panoramas as string[]) || [],
      videos: (listing.videos as string[]) || [],
      isListed: true,
      source: "user_listing",
      listingId: listing.id,
    })
    .returning();

  const propertyId = propInsert[0].id;

  // Update listing
  await db
    .update(listings)
    .set({
      propertyId,
      approvalStatus: "approved",
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  // Status history
  await recordStatusChange({
    listingId,
    fromStatus: "pending",
    toStatus: "approved",
    changedByStaffId: staffId,
    note: `Created property #${propertyId}`,
  });

  // Notify user
  await notifyListingApproved({
    userId: listing.userId,
    listingId,
    listingTitle: listing.title,
    propertyId,
  });

  // Invalidate caches
  await cache.delPattern("listings:*");
  await cache.delPattern("properties:*");
  await cache.delPattern("property:*");

  return { propertyId };
}

export async function rejectListing(params: {
  listingId: number;
  staffId: number;
  reason: string;
}): Promise<void> {
  const { listingId, staffId, reason } = params;

  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (rows.length === 0) throw new Error("Listing not found");
  const listing = rows[0];

  await db
    .update(listings)
    .set({
      approvalStatus: "rejected",
      rejectionReason: reason,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  await recordStatusChange({
    listingId,
    fromStatus: listing.approvalStatus,
    toStatus: "rejected",
    changedByStaffId: staffId,
    note: reason,
  });

  await notifyListingRejected({
    userId: listing.userId,
    listingId,
    listingTitle: listing.title,
    reason,
  });

  await cache.delPattern("listings:*");
}
