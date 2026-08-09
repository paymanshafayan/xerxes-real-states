import { listingCreateSchema, userProfileUpdateSchema, reassignRequestSchema } from "@/lib/listings/validation";

describe("Phase 8: Listing Validation", () => {
  describe("userProfileUpdateSchema", () => {
    it("accepts empty object", () => {
      const r = userProfileUpdateSchema.parse({});
      expect(r).toBeDefined();
    });

    it("requires lastName min 1 char when present", () => {
      expect(() => userProfileUpdateSchema.parse({ lastName: "" })).toThrow();
    });

    it("accepts valid profile", () => {
      const r = userProfileUpdateSchema.parse({
        lastName: "Doe",
        addressLine: "123 Main St",
        city: "Antalya",
        country: "Turkey",
        lat: 36.89,
        lng: 30.7,
      });
      expect(r.lastName).toBe("Doe");
    });

    it("rejects invalid lat", () => {
      expect(() =>
        userProfileUpdateSchema.parse({ lat: 91 })
      ).toThrow();
    });

    it("rejects invalid lng", () => {
      expect(() =>
        userProfileUpdateSchema.parse({ lng: -181 })
      ).toThrow();
    });
  });

  describe("listingCreateSchema", () => {
    const baseValid = {
      listingKinds: ["sale"] as const,
      category: "apartment" as const,
      title: "Beautiful 3-bed apartment",
      description: "Spacious and modern apartment with great views and lots of natural light.",
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      features: ["parking", "elevator"],
      address: "123 Main Street, Apt 4B",
      city: "Antalya",
      country: "Turkey",
      price: 250000,
      currency: "GBP",
      images: ["/uploads/a.jpg", "/uploads/b.jpg", "/uploads/c.jpg"],
      commitmentAccepted: true as const,
    };

    it("accepts a valid sale listing", () => {
      const r = listingCreateSchema.parse(baseValid);
      expect(r.title).toBe(baseValid.title);
    });

    it("requires commitmentAccepted to be true", () => {
      expect(() =>
        listingCreateSchema.parse({ ...baseValid, commitmentAccepted: false })
      ).toThrow();
    });

    it("requires title min 5 chars", () => {
      expect(() =>
        listingCreateSchema.parse({ ...baseValid, title: "abc" })
      ).toThrow();
    });

    it("requires description min 20 chars", () => {
      expect(() =>
        listingCreateSchema.parse({ ...baseValid, description: "too short" })
      ).toThrow();
    });

    it("requires min 3 images", () => {
      expect(() =>
        listingCreateSchema.parse({
          ...baseValid,
          images: ["/a.jpg", "/b.jpg"],
        })
      ).toThrow();
    });

    it("requires price for sale listings", () => {
      expect(() =>
        listingCreateSchema.parse({ ...baseValid, price: undefined })
      ).toThrow();
    });

    it("requires rent_deposit and monthly_rent for rent listings", () => {
      expect(() =>
        listingCreateSchema.parse({
          ...baseValid,
          listingKinds: ["rent"],
          price: undefined,
          rentDeposit: undefined,
          monthlyRent: undefined,
        })
      ).toThrow();
    });

    it("accepts a valid rent listing", () => {
      const r = listingCreateSchema.parse({
        ...baseValid,
        listingKinds: ["rent"],
        price: undefined,
        rentDeposit: 5000,
        monthlyRent: 1500,
      });
      expect(r.rentDeposit).toBe(5000);
      expect(r.monthlyRent).toBe(1500);
    });

    it("accepts sale+rent combined", () => {
      const r = listingCreateSchema.parse({
        ...baseValid,
        listingKinds: ["sale", "rent"],
        rentDeposit: 5000,
        monthlyRent: 1500,
      });
      expect(r.listingKinds).toEqual(["sale", "rent"]);
    });

    it("rejects price when not in listingKinds", () => {
      expect(() =>
        listingCreateSchema.parse({
          ...baseValid,
          listingKinds: ["rent"],
          price: 100000,
          rentDeposit: 5000,
          monthlyRent: 1500,
        })
      ).toThrow();
    });

    it("requires listingKinds to have at least 1 item", () => {
      expect(() =>
        listingCreateSchema.parse({ ...baseValid, listingKinds: [] })
      ).toThrow();
    });

    it("rejects invalid category", () => {
      expect(() =>
        listingCreateSchema.parse({ ...baseValid, category: "spaceship" as any })
      ).toThrow();
    });
  });

  describe("reassignRequestSchema", () => {
    it("requires reason min 10 chars", () => {
      expect(() =>
        reassignRequestSchema.parse({ reason: "short" })
      ).toThrow();
    });

    it("accepts valid reassign request", () => {
      const r = reassignRequestSchema.parse({
        reason: "Out of office for the next 2 weeks",
        preferredStaffId: 5,
      });
      expect(r.preferredStaffId).toBe(5);
    });

    it("allows preferredStaffId to be null/missing", () => {
      const r = reassignRequestSchema.parse({ reason: "Cannot continue" });
      expect(r.preferredStaffId).toBeUndefined();
    });
  });
});
