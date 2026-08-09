import type { Listing } from "@/lib/data/listings";
import type { StaffJwtPayload } from "@/lib/auth/jwt";
import type { UserJwtPayload } from "@/lib/auth/jwt";

/**
 * Phase 8: RBAC for listings.
 *
 * Every staff/user action on a listing must be authorized via this enum.
 */

export type ListingAccess =
  | "owner" // user owns this listing
  | "assigned" // staff member is currently assigned
  | "manager" // staff is a manager (full access)
  | "readonly" // staff member, not assigned (read-only)
  | "none"; // no access

export interface AccessCheckResult {
  access: ListingAccess;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canReassign: boolean;
  canReassignRequest: boolean;
  canContactOwner: boolean;
  canScheduleVisit: boolean;
  canReportUnavailable: boolean;
}

export function getListingAccess(
  listing: Pick<Listing, "userId" | "assignedStaffId">,
  currentUser: UserJwtPayload | null,
  currentStaff: StaffJwtPayload | null
): ListingAccess {
  // 1. Manager: full access
  if (currentStaff?.role === "manager") {
    return "manager";
  }

  // 2. Staff assigned to this listing
  if (
    currentStaff &&
    listing.assignedStaffId != null &&
    currentStaff.id === listing.assignedStaffId
  ) {
    return "assigned";
  }

  // 3. Other staff: read-only
  if (currentStaff) {
    return "readonly";
  }

  // 4. User who owns this listing
  if (currentUser && listing.userId === currentUser.id) {
    return "owner";
  }

  // 5. No access
  return "none";
}

/**
 * Returns the full permission set for the current actor.
 */
export function getListingPermissions(
  listing: Pick<Listing, "userId" | "assignedStaffId">,
  currentUser: UserJwtPayload | null,
  currentStaff: StaffJwtPayload | null
): AccessCheckResult {
  const access = getListingAccess(listing, currentUser, currentStaff);

  return {
    access,
    canView: access !== "none",
    canEdit: access === "manager" || access === "assigned",
    canDelete: access === "manager",
    canApprove: access === "manager" || access === "assigned",
    canReject: access === "manager" || access === "assigned",
    canReassign: access === "manager",
    canReassignRequest: access === "manager" || access === "assigned",
    canContactOwner: access === "manager" || access === "assigned",
    canScheduleVisit: access === "manager" || access === "assigned",
    canReportUnavailable: access === "manager" || access === "assigned",
  };
}
