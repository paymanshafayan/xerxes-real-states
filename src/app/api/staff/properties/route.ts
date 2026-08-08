import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";
import {
  getProperties,
  createProperty,
} from "@/lib/data/dataProvider";
import { logActivity } from "@/lib/activityLog";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// GET - list properties, scoped by role (consultant sees only their own)
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const filters: Record<string, unknown> = {
      limit: Number(url.searchParams.get("limit") || 50),
      offset: Number(url.searchParams.get("offset") || 0),
    };
    if (url.searchParams.get("type"))
      filters.type = url.searchParams.get("type");
    if (url.searchParams.get("category"))
      filters.category = url.searchParams.get("category");
    if (url.searchParams.get("city")) filters.city = url.searchParams.get("city");
    if (url.searchParams.get("search"))
      filters.search = url.searchParams.get("search");
    // Consultant: only their own listings
    if (auth.role === "consultant" && auth.agentId) {
      filters.agentId = auth.agentId;
    }
    const result = await getProperties(filters as any);
    return NextResponse.json({ properties: result });
  } catch (error) {
    console.error("Staff list properties error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - create property (with media + 360 + video + audio)
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const baseSlug = slugify(body.slug || body.titleEn || body.titleFa || "property");
    // ensure unique slug
    let slug = baseSlug || `property-${Date.now()}`;
    const existing = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.slug, slug))
      .limit(1);
    if (existing.length > 0) slug = `${baseSlug}-${Date.now()}`;

    const agentId =
      auth.role === "consultant"
        ? auth.agentId || null
        : body.agentId || null;

    const data = {
      slug,
      titleTr: body.titleTr || "",
      titleEn: body.titleEn || "",
      titleFa: body.titleFa || "",
      titleRu: body.titleRu || "",
      descriptionTr: body.descriptionTr || "",
      descriptionEn: body.descriptionEn || "",
      descriptionFa: body.descriptionFa || "",
      descriptionRu: body.descriptionRu || "",
      type: body.type || "sale",
      category: body.category || "apartment",
      price: Number(body.price) || 0,
      currency: body.currency || "GBP",
      bedrooms: Number(body.bedrooms) || 0,
      bathrooms: Number(body.bathrooms) || 0,
      area: Number(body.area) || 0,
      city: body.city || "",
      district: body.district || null,
      address: body.address || null,
      lat: body.lat ? Number(body.lat) : null,
      lng: body.lng ? Number(body.lng) : null,
      images: body.images || [],
      features: body.features || [],
      isFeatured: Boolean(body.isFeatured),
      agentId: agentId ? Number(agentId) : null,
      panoramas: body.panoramas || [],
      videos: body.videos || [],
      audioNotes: body.audioNotes || [],
      virtualTourUrl: body.virtualTourUrl || null,
    };

    const created = await createProperty(data);
    await logActivity({
      action: "create",
      entity: "property",
      entityId: created.id,
      userName: auth.username,
      details: `Created property: ${body.titleEn || body.titleFa || slug}`,
    });
    return NextResponse.json({ success: true, property: created });
  } catch (error) {
    console.error("Staff create property error:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
