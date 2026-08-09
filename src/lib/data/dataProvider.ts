import { db } from "@/db";
import { properties, agents, inquiries, siteSettings } from "@/db/schema";
import { eq, desc, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import {
  sampleProperties,
  sampleAgents,
  type SampleProperty,
  type SampleAgent,
} from "./sampleData";
import { cache, cacheKeys } from "@/lib/cache";
import { filterSampleProperties, type PropertyFilters } from "./filterProperties";

export type { PropertyFilters };

// Check the data source setting
async function getDataSource(): Promise<"sample" | "database"> {
  try {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "data_source"))
      .limit(1);
    if (result.length > 0 && result[0].value === "database") {
      return "database";
    }
  } catch {
    // Table might not exist yet
  }
  return "sample";
}

async function getDbPropertiesCount(): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties);
    return Number(result[0]?.count || 0);
  } catch {
    return 0;
  }
}

// Convert DB row to common format
function dbRowToProperty(row: typeof properties.$inferSelect): SampleProperty {
  return {
    id: row.id,
    slug: row.slug,
    titleTr: row.titleTr,
    titleEn: row.titleEn,
    titleFa: row.titleFa,
    titleRu: row.titleRu,
    descriptionTr: row.descriptionTr,
    descriptionEn: row.descriptionEn,
    descriptionFa: row.descriptionFa,
    descriptionRu: row.descriptionRu,
    type: row.type as "sale" | "rent",
    category: row.category as "villa" | "apartment" | "land" | "commercial",
    price: row.price,
    previousPrice: row.previousPrice || undefined,
    currency: row.currency,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: row.area,
    city: row.city,
    district: row.district || "",
    address: row.address || "",
    lat: row.lat || 0,
    lng: row.lng || 0,
    images: (row.images as string[]) || [],
    features: (row.features as string[]) || [],
    isFeatured: row.isFeatured,
    agentId: row.agentId || 0,
    createdAt: row.createdAt.toISOString(),
    panoramas: (row.panoramas as string[]) || [],
    videos: (row.videos as string[]) || [],
    audioNotes: (row.audioNotes as string[]) || [],
    virtualTourUrl: row.virtualTourUrl || undefined,
  };
}

function dbRowToAgent(row: typeof agents.$inferSelect): SampleAgent {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    photo: row.photo || "",
    bioTr: row.bioTr || "",
    bioEn: row.bioEn || "",
    bioFa: row.bioFa || "",
    bioRu: row.bioRu || "",
  };
}

export async function getProperties(
  filters: PropertyFilters = {}
): Promise<SampleProperty[]> {
  const source = await getDataSource();
  if (source === "sample") {
    return filterSampleProperties(sampleProperties, filters);
  }

  // Try cache first for database mode
  const cacheKey = cacheKeys.properties(JSON.stringify(filters));
  const cached = await cache.get<SampleProperty[]>(cacheKey);
  if (cached) return cached;

  try {
    // Check if database is empty first
    const dbTotalCount = await getDbPropertiesCount();
    if (dbTotalCount === 0) {
      // Empty database -> fallback to sample data for both web and mobile apps
      return filterSampleProperties(sampleProperties, filters);
    }

    // Database query
    const conditions = [];
    if (filters.type) conditions.push(eq(properties.type, filters.type));
    if (filters.category) conditions.push(eq(properties.category, filters.category));
    if (filters.city) conditions.push(eq(properties.city, filters.city));
    if (filters.minPrice) conditions.push(gte(properties.price, filters.minPrice));
    if (filters.maxPrice) conditions.push(lte(properties.price, filters.maxPrice));
    if (filters.minBedrooms) conditions.push(gte(properties.bedrooms, filters.minBedrooms));
    if (filters.featured) conditions.push(eq(properties.isFeatured, true));
    if (filters.agentId) conditions.push(eq(properties.agentId, filters.agentId));
    if (filters.search) {
      conditions.push(
        or(
          ilike(properties.titleEn, `%${filters.search}%`),
          ilike(properties.titleTr, `%${filters.search}%`),
          ilike(properties.city, `%${filters.search}%`)
        )!
      );
    }

    const query = db
      .select()
      .from(properties)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(properties.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    const rows = await query;
    const result = rows.map(dbRowToProperty);

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);
    return result;
  } catch (error) {
    console.error("Database query failed in getProperties, falling back to sample data:", error);
    return filterSampleProperties(sampleProperties, filters);
  }
}

export async function getPropertyBySlug(
  slug: string
): Promise<SampleProperty | null> {
  const source = await getDataSource();
  if (source === "sample") {
    return sampleProperties.find((p) => p.slug === slug) || null;
  }

  // Try cache
  const ck = cacheKeys.propertyDetail(slug);
  const cached = await cache.get<SampleProperty>(ck);
  if (cached) return cached;

  try {
    const rows = await db
      .select()
      .from(properties)
      .where(eq(properties.slug, slug))
      .limit(1);
    if (rows.length > 0) {
      const result = dbRowToProperty(rows[0]);
      await cache.set(ck, result, 300);
      return result;
    }
    // If not found in DB, fallback to sample
    const sample = sampleProperties.find((p) => p.slug === slug) || null;
    return sample;
  } catch (error) {
    console.error("Database query failed in getPropertyBySlug, falling back to sample data:", error);
    return sampleProperties.find((p) => p.slug === slug) || null;
  }
}

export async function getPriceDrops(limit = 20): Promise<SampleProperty[]> {
  const source = await getDataSource();
  if (source === "sample") {
    return sampleProperties
      .filter((p) => p.previousPrice && p.previousPrice > p.price)
      .sort((a, b) => (b.previousPrice! - b.price) - (a.previousPrice! - a.price))
      .slice(0, limit);
  }

  const ck = `properties:price-drops:${limit}`;
  const cached = await cache.get<SampleProperty[]>(ck);
  if (cached) return cached;

  try {
    const dbTotalCount = await getDbPropertiesCount();
    if (dbTotalCount === 0) {
      return sampleProperties
        .filter((p) => p.previousPrice && p.previousPrice > p.price)
        .sort((a, b) => (b.previousPrice! - b.price) - (a.previousPrice! - a.price))
        .slice(0, limit);
    }

    const rows = await db
      .select()
      .from(properties)
      .where(sql`${properties.previousPrice} IS NOT NULL AND ${properties.previousPrice} > ${properties.price}`)
      .orderBy(desc(sql`${properties.previousPrice} - ${properties.price}`))
      .limit(limit);
    const result = rows.map(dbRowToProperty);
    await cache.set(ck, result, 120);
    return result;
  } catch (error) {
    console.error("Database query failed in getPriceDrops, falling back to sample data:", error);
    return sampleProperties
      .filter((p) => p.previousPrice && p.previousPrice > p.price)
      .sort((a, b) => (b.previousPrice! - b.price) - (a.previousPrice! - a.price))
      .slice(0, limit);
  }
}

export async function getPropertyById(
  id: number
): Promise<SampleProperty | null> {
  const source = await getDataSource();
  if (source === "sample") {
    return sampleProperties.find((p) => p.id === id) || null;
  }

  const ck = `property:id:${id}`;
  const cached = await cache.get<SampleProperty>(ck);
  if (cached) return cached;

  try {
    const rows = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    if (rows.length > 0) {
      const result = dbRowToProperty(rows[0]);
      await cache.set(ck, result, 300);
      return result;
    }
    // Fallback to sample data
    return sampleProperties.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Database query failed in getPropertyById, falling back to sample data:", error);
    return sampleProperties.find((p) => p.id === id) || null;
  }
}

export async function getAgents(): Promise<SampleAgent[]> {
  const source = await getDataSource();
  if (source === "sample") {
    return sampleAgents;
  }
  try {
    const rows = await db.select().from(agents);
    if (rows.length > 0) {
      return rows.map(dbRowToAgent);
    }
    return sampleAgents;
  } catch (error) {
    console.error("Database query failed in getAgents, falling back to sample agents:", error);
    return sampleAgents;
  }
}

export async function getAgentById(
  id: number
): Promise<SampleAgent | null> {
  const source = await getDataSource();
  if (source === "sample") {
    return sampleAgents.find((a) => a.id === id) || null;
  }
  try {
    const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
    if (rows.length > 0) {
      return dbRowToAgent(rows[0]);
    }
    return sampleAgents.find((a) => a.id === id) || null;
  } catch (error) {
    console.error("Database query failed in getAgentById, falling back to sample agent:", error);
    return sampleAgents.find((a) => a.id === id) || null;
  }
}

export async function getPropertyCount(): Promise<number> {
  const source = await getDataSource();
  if (source === "sample") return sampleProperties.length;
  try {
    const count = await getDbPropertiesCount();
    return count === 0 ? sampleProperties.length : count;
  } catch {
    return sampleProperties.length;
  }
}

export async function getInquiryCount(): Promise<number> {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(inquiries);
    return Number(result[0].count);
  } catch {
    return 0;
  }
}

export async function getNewInquiryCount(): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(inquiries)
      .where(eq(inquiries.status, "new"));
    return Number(result[0].count);
  } catch {
    return 0;
  }
}

export async function createInquiry(data: {
  propertyId?: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const result = await db.insert(inquiries).values(data).returning();
  return result[0];
}

export async function getInquiries() {
  try {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  } catch {
    return [];
  }
}

export async function updateInquiryStatus(id: number, status: string) {
  return await db
    .update(inquiries)
    .set({ status })
    .where(eq(inquiries.id, id));
}

export async function setDataSource(source: "sample" | "database") {
  try {
    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "data_source"))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(siteSettings)
        .set({ value: source, updatedAt: new Date() })
        .where(eq(siteSettings.key, "data_source"));
    } else {
      await db.insert(siteSettings).values({ key: "data_source", value: source });
    }
    // Invalidate caches immediately
    await cache.delPattern("properties:*");
    await cache.delPattern("property:*");
  } catch (error) {
    console.error("Failed to set data source setting:", error);
  }
}

export async function getCurrentDataSource(): Promise<"sample" | "database"> {
  return await getDataSource();
}

// Admin CRUD for properties
export async function createProperty(data: Omit<typeof properties.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const result = await db.insert(properties).values(data).returning();
  await cache.delPattern("properties:*");
  return result[0];
}

export async function updateProperty(id: number, data: Partial<typeof properties.$inferInsert>) {
  let updateData: typeof data = data;
  if (typeof data.price === "number") {
    const current = await db
      .select({ price: properties.price })
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    if (current.length > 0 && data.price < current[0].price) {
      // Genuine reduction — record the real prior price so the mobile
      // client's Price Drop Alerts can show an honest discount amount.
      updateData = { ...data, previousPrice: current[0].price };
    } else if (current.length > 0 && data.price >= current[0].price) {
      // Price went back up (or unchanged) — clear any stale drop marker.
      updateData = { ...data, previousPrice: null };
    }
  }
  const result = await db
    .update(properties)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(properties.id, id))
    .returning();
  await cache.delPattern("properties:*");
  await cache.delPattern("property:*");
  return result[0];
}

export async function deleteProperty(id: number) {
  await db.delete(properties).where(eq(properties.id, id));
  await cache.delPattern("properties:*");
  await cache.delPattern("property:*");
}

// Admin CRUD for agents
export async function createAgent(data: Omit<typeof agents.$inferInsert, "id" | "createdAt">) {
  const result = await db.insert(agents).values(data).returning();
  return result[0];
}

export async function updateAgent(id: number, data: Partial<typeof agents.$inferInsert>) {
  const result = await db
    .update(agents)
    .set(data)
    .where(eq(agents.id, id))
    .returning();
  return result[0];
}

export async function deleteAgent(id: number) {
  await db.delete(agents).where(eq(agents.id, id));
}

// Seed database from sample data
export async function seedDatabaseFromSample() {
  // Insert agents
  for (const agent of sampleAgents) {
    const existing = await db
      .select()
      .from(agents)
      .where(eq(agents.email, agent.email))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(agents).values({
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        photo: agent.photo,
        bioTr: agent.bioTr,
        bioEn: agent.bioEn,
        bioFa: agent.bioFa,
        bioRu: agent.bioRu,
      });
    }
  }
  // Insert properties
  for (const prop of sampleProperties) {
    const existing = await db
      .select()
      .from(properties)
      .where(eq(properties.slug, prop.slug))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(properties).values({
        slug: prop.slug,
        titleTr: prop.titleTr,
        titleEn: prop.titleEn,
        titleFa: prop.titleFa,
        titleRu: prop.titleRu,
        descriptionTr: prop.descriptionTr,
        descriptionEn: prop.descriptionEn,
        descriptionFa: prop.descriptionFa,
        descriptionRu: prop.descriptionRu,
        type: prop.type,
        category: prop.category,
        price: prop.price,
        currency: prop.currency,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        area: prop.area,
        city: prop.city,
        district: prop.district,
        address: prop.address,
        lat: prop.lat,
        lng: prop.lng,
        images: prop.images,
        features: prop.features,
        isFeatured: prop.isFeatured,
        agentId: prop.agentId,
      });
    }
  }
  // Invalidate caches
  await cache.delPattern("properties:*");
  await cache.delPattern("property:*");
}
