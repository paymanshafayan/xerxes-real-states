/**
 * Tests for the real In-Memory Cache system and core utility functions.
 * These import the actual application modules (not reimplementations) so
 * they catch real regressions.
 */
import { cache } from "@/lib/cache";
import { formatPrice, getCityName } from "@/lib/utils";
import { isRtl } from "@/lib/i18n/types";
import type { Locale } from "@/lib/i18n/types";

describe("In-Memory Cache (src/lib/cache.ts)", () => {
  beforeEach(async () => {
    await cache.flush();
  });

  test("should store and retrieve values", async () => {
    await cache.set("key1", "value1");
    const result = await cache.get("key1");
    expect(result).toBe("value1");
  });

  test("should return null for missing keys", async () => {
    const result = await cache.get("nonexistent");
    expect(result).toBeNull();
  });

  test("should expire entries after TTL", async () => {
    await cache.set("key2", "value2", 0.001); // 1ms TTL
    await new Promise((resolve) => setTimeout(resolve, 10));
    const result = await cache.get("key2");
    expect(result).toBeNull();
  });

  test("should delete specific keys", async () => {
    await cache.set("key3", "value3");
    await cache.del("key3");
    const result = await cache.get("key3");
    expect(result).toBeNull();
  });

  test("should delete keys by wildcard pattern", async () => {
    await cache.set("properties:sale", "data1");
    await cache.set("properties:rent", "data2");
    await cache.set("agents:all", "data3");

    const deleted = await cache.delPattern("properties:*");
    expect(deleted).toBe(2);

    const result1 = await cache.get("properties:sale");
    expect(result1).toBeNull();

    const result3 = await cache.get("agents:all");
    expect(result3).toBe("data3");
  });

  test("should not treat regex-special characters in keys as wildcards", async () => {
    // Regression test for the delPattern regex-escaping fix: a literal "."
    // in a key must not act as "any character" outside of "*" wildcards.
    await cache.set("property:1.jpg", "a");
    await cache.set("property:1Xjpg", "b");

    const deleted = await cache.delPattern("property:1.jpg");
    expect(deleted).toBe(1); // only the exact literal match, not the "1Xjpg" one

    const stillThere = await cache.get("property:1Xjpg");
    expect(stillThere).toBe("b");
  });

  test("should track hit/miss stats", async () => {
    await cache.set("hit", "data");
    await cache.get("hit"); // hit
    await cache.get("miss"); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe("50.0%");
  });

  test("should flush all entries", async () => {
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.flush();

    const stats = cache.getStats();
    expect(stats.entries).toBe(0);
  });

  test("should support getOrSet pattern (fetcher runs once)", async () => {
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return { data: "expensive" };
    };

    const result1 = await cache.getOrSet("key", fetcher);
    expect(result1).toEqual({ data: "expensive" });
    expect(fetchCount).toBe(1);

    const result2 = await cache.getOrSet("key", fetcher);
    expect(result2).toEqual({ data: "expensive" });
    expect(fetchCount).toBe(1); // fetcher not called again
  });

  test("should handle complex objects", async () => {
    const property = {
      id: 1,
      title: "Villa",
      price: 450000,
      images: ["img1.jpg", "img2.jpg"],
      features: { pool: true, garden: true },
    };

    await cache.set("property:1", property);
    const result = await cache.get("property:1");
    expect(result).toEqual(property);
  });
});

describe("formatPrice (src/lib/utils.ts)", () => {
  test("formats a sale price with the GBP symbol", () => {
    expect(formatPrice(450000, "GBP", "sale", "en")).toBe("£450,000");
  });

  test("appends a per-month suffix for rentals, localized per language", () => {
    expect(formatPrice(1200, "GBP", "rent", "en")).toBe("£1,200/mo");
    expect(formatPrice(1200, "GBP", "rent", "tr")).toBe("£1,200/ay");
    expect(formatPrice(1200, "GBP", "rent", "ru")).toBe("£1,200/мес");
    expect(formatPrice(1200, "GBP", "rent", "fa")).toBe("£1,200/ماهانه");
  });
});

describe("getCityName (src/lib/utils.ts)", () => {
  const city = { nameEn: "Kyrenia", nameTr: "Girne", nameFa: "کرنیا", nameRu: "Кирения" };

  test("returns the name in the requested locale", () => {
    expect(getCityName(city, "en")).toBe("Kyrenia");
    expect(getCityName(city, "tr")).toBe("Girne");
    expect(getCityName(city, "fa")).toBe("کرنیا");
    expect(getCityName(city, "ru")).toBe("Кирения");
  });
});

describe("Locale system (src/lib/i18n/types.ts)", () => {
  const locales: Locale[] = ["en", "tr", "fa", "ru"];

  test("supports all 4 project locales", () => {
    expect(locales).toHaveLength(4);
  });

  test("marks only Persian as RTL", () => {
    expect(isRtl("fa")).toBe(true);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("tr")).toBe(false);
    expect(isRtl("ru")).toBe(false);
  });
});
