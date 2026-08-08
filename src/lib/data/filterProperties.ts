import type { SampleProperty } from "./sampleData";

export interface PropertyFilters {
  type?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  search?: string;
  featured?: boolean;
  agentId?: number;
  limit?: number;
  offset?: number;
}

// Filter sample properties (pure, in-memory — used when the site is in
// "sample" data-source mode, and independently unit-tested against the
// real sample dataset).
export function filterSampleProperties(
  props: SampleProperty[],
  filters: PropertyFilters
): SampleProperty[] {
  let result = [...props];
  if (filters.type) result = result.filter((p) => p.type === filters.type);
  if (filters.category) result = result.filter((p) => p.category === filters.category);
  if (filters.city) result = result.filter((p) => p.city === filters.city);
  if (filters.minPrice) result = result.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice) result = result.filter((p) => p.price <= filters.maxPrice!);
  if (filters.minBedrooms) result = result.filter((p) => p.bedrooms >= filters.minBedrooms!);
  if (filters.featured) result = result.filter((p) => p.isFeatured);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.titleEn.toLowerCase().includes(q) ||
        p.titleTr.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.district && p.district.toLowerCase().includes(q))
    );
  }
  // sort by createdAt desc
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  return result.slice(offset, offset + limit);
}
