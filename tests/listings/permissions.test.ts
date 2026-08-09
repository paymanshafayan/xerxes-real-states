import { getListingAccess, getListingPermissions } from "@/lib/listings/permissions";

describe("Phase 8: Listing Permissions (RBAC)", () => {
  const mockListing = {
    userId: 100,
    assignedStaffId: 5,
  };

  describe("getListingAccess", () => {
    it("manager gets 'manager' access regardless of assignment", () => {
      const a = getListingAccess(mockListing, null, {
        id: 1,
        username: "m",
        role: "manager",
        name: "Manager",
      });
      expect(a).toBe("manager");
    });

    it("staff assigned to listing gets 'assigned' access", () => {
      const a = getListingAccess(mockListing, null, {
        id: 5,
        username: "c",
        role: "consultant",
        name: "Carol",
      });
      expect(a).toBe("assigned");
    });

    it("other staff get 'readonly' access", () => {
      const a = getListingAccess(mockListing, null, {
        id: 7,
        username: "c2",
        role: "consultant",
        name: "Other",
      });
      expect(a).toBe("readonly");
    });

    it("user who owns listing gets 'owner' access", () => {
      const a = getListingAccess(mockListing, { id: 100, email: "u@x.com" }, null);
      expect(a).toBe("owner");
    });

    it("unrelated user gets 'none' access", () => {
      const a = getListingAccess(mockListing, { id: 999, email: "x@x.com" }, null);
      expect(a).toBe("none");
    });

    it("no user/staff gets 'none' access", () => {
      expect(getListingAccess(mockListing, null, null)).toBe("none");
    });

    it("manager takes priority over ownership", () => {
      // If a manager is also somehow the user — but manager should win
      const a = getListingAccess(
        mockListing,
        { id: 100, email: "u@x.com" },
        { id: 1, username: "m", role: "manager", name: "M" }
      );
      expect(a).toBe("manager");
    });
  });

  describe("getListingPermissions", () => {
    it("manager can do everything", () => {
      const p = getListingPermissions(
        mockListing,
        null,
        { id: 1, username: "m", role: "manager", name: "M" }
      );
      expect(p.canView).toBe(true);
      expect(p.canEdit).toBe(true);
      expect(p.canDelete).toBe(true);
      expect(p.canApprove).toBe(true);
      expect(p.canReject).toBe(true);
      expect(p.canReassign).toBe(true);
      expect(p.canReassignRequest).toBe(true);
    });

    it("assigned staff can edit but not delete", () => {
      const p = getListingPermissions(
        mockListing,
        null,
        { id: 5, username: "c", role: "consultant", name: "C" }
      );
      expect(p.canView).toBe(true);
      expect(p.canEdit).toBe(true);
      expect(p.canDelete).toBe(false);
      expect(p.canApprove).toBe(true);
      expect(p.canReject).toBe(true);
      expect(p.canReassign).toBe(false);
      expect(p.canReassignRequest).toBe(true);
    });

    it("other staff can only view", () => {
      const p = getListingPermissions(
        mockListing,
        null,
        { id: 7, username: "c2", role: "consultant", name: "C2" }
      );
      expect(p.canView).toBe(true);
      expect(p.canEdit).toBe(false);
      expect(p.canDelete).toBe(false);
      expect(p.canApprove).toBe(false);
      expect(p.canReject).toBe(false);
    });

    it("owner can only view own listing", () => {
      const p = getListingPermissions(
        mockListing,
        { id: 100, email: "u@x.com" },
        null
      );
      expect(p.canView).toBe(true);
      expect(p.canEdit).toBe(false);
      expect(p.canDelete).toBe(false);
    });

    it("non-owner user has no access", () => {
      const p = getListingPermissions(
        mockListing,
        { id: 999, email: "x@x.com" },
        null
      );
      expect(p.canView).toBe(false);
    });
  });
});
