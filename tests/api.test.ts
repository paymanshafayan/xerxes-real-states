/**
 * Tests for the real sample-data catalogue and the sample-mode property
 * filtering logic (src/lib/data/dataProvider.ts's filterSampleProperties),
 * plus the payment type validation used by /api/payments.
 * These import the actual application modules — not reimplementations —
 * so they catch real regressions in the shipped code.
 */
import { sampleProperties } from "@/lib/data/sampleData";
import { filterSampleProperties } from "@/lib/data/filterProperties";
import { VALID_PAYMENT_TYPES, isValidPaymentType, isValidPaymentAmount } from "@/lib/validation/payments";

describe("Sample Data Integrity (src/lib/data/sampleData.ts)", () => {
  test("has at least one property", () => {
    expect(sampleProperties.length).toBeGreaterThan(0);
  });

  test("all properties have unique slugs", () => {
    const slugs = sampleProperties.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("all properties have unique IDs", () => {
    const ids = sampleProperties.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("only uses the supported property types", () => {
    const types = new Set(sampleProperties.map((p) => p.type));
    for (const t of types) expect(["sale", "rent"]).toContain(t);
  });

  test("only uses the supported categories", () => {
    const categories = new Set(sampleProperties.map((p) => p.category));
    for (const c of categories) {
      expect(["apartment", "villa", "land", "commercial"]).toContain(c);
    }
  });

  test("all prices and areas are positive", () => {
    sampleProperties.forEach((p) => {
      expect(p.price).toBeGreaterThan(0);
      expect(p.area).toBeGreaterThan(0);
    });
  });

  test("every property has all 4 language titles filled in", () => {
    sampleProperties.forEach((p) => {
      expect(p.titleEn.length).toBeGreaterThan(0);
      expect(p.titleTr.length).toBeGreaterThan(0);
      expect(p.titleFa.length).toBeGreaterThan(0);
      expect(p.titleRu.length).toBeGreaterThan(0);
    });
  });
});

describe("filterSampleProperties (src/lib/data/dataProvider.ts) — real sample-mode filter logic", () => {
  test("filter by type matches the real dataset", () => {
    const saleCount = sampleProperties.filter((p) => p.type === "sale").length;
    const rentCount = sampleProperties.filter((p) => p.type === "rent").length;
    expect(filterSampleProperties(sampleProperties, { type: "sale" })).toHaveLength(saleCount);
    expect(filterSampleProperties(sampleProperties, { type: "rent" })).toHaveLength(rentCount);
  });

  test("filter by city", () => {
    const [first] = sampleProperties;
    const expected = sampleProperties.filter((p) => p.city === first.city).length;
    expect(filterSampleProperties(sampleProperties, { city: first.city })).toHaveLength(expected);
  });

  test("filter by price range", () => {
    const result = filterSampleProperties(sampleProperties, { minPrice: 100000, maxPrice: 500000 });
    result.forEach((p) => {
      expect(p.price).toBeGreaterThanOrEqual(100000);
      expect(p.price).toBeLessThanOrEqual(500000);
    });
    // sanity: matches a manual filter over the same real dataset
    const expected = sampleProperties.filter((p) => p.price >= 100000 && p.price <= 500000).length;
    expect(result).toHaveLength(expected);
  });

  test("filter by minimum bedrooms", () => {
    const result = filterSampleProperties(sampleProperties, { minBedrooms: 3 });
    result.forEach((p) => expect(p.bedrooms).toBeGreaterThanOrEqual(3));
  });

  test("text search matches title or city", () => {
    const [first] = sampleProperties;
    const result = filterSampleProperties(sampleProperties, { search: first.city });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.id === first.id)).toBe(true);
  });

  test("combined filters narrow the result further than either alone", () => {
    const typeOnly = filterSampleProperties(sampleProperties, { type: "sale" });
    const combined = filterSampleProperties(sampleProperties, { type: "sale", minPrice: 300000 });
    expect(combined.length).toBeLessThanOrEqual(typeOnly.length);
  });

  test("unmatchable filter returns an empty array", () => {
    const result = filterSampleProperties(sampleProperties, { minPrice: 999_999_999 });
    expect(result).toHaveLength(0);
  });

  test("respects limit and offset for pagination", () => {
    const page1 = filterSampleProperties(sampleProperties, { limit: 2, offset: 0 });
    const page2 = filterSampleProperties(sampleProperties, { limit: 2, offset: 2 });
    expect(page1.length).toBeLessThanOrEqual(2);
    expect(page1.map((p) => p.id)).not.toEqual(page2.map((p) => p.id));
  });
});

describe("Payment validation (src/lib/validation/payments.ts)", () => {
  test("accepts the real supported payment types", () => {
    expect(VALID_PAYMENT_TYPES).toContain("deposit");
    expect(VALID_PAYMENT_TYPES).toContain("booking_fee");
    expect(VALID_PAYMENT_TYPES).toContain("consultation");
  });

  test("isValidPaymentType rejects an unsupported type", () => {
    expect(isValidPaymentType("deposit")).toBe(true);
    expect(isValidPaymentType("refund_bypass")).toBe(false);
  });

  test("isValidPaymentAmount rejects zero, negative, and non-numeric amounts", () => {
    expect(isValidPaymentAmount(1000)).toBe(true);
    expect(isValidPaymentAmount(0)).toBe(false);
    expect(isValidPaymentAmount(-500)).toBe(false);
    expect(isValidPaymentAmount("not-a-number")).toBe(false);
    expect(isValidPaymentAmount(NaN)).toBe(false);
  });
});
