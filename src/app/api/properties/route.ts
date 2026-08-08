import { NextRequest, NextResponse } from "next/server";
import { getProperties, createProperty, deleteProperty } from "@/lib/data/dataProvider";
import { logActivity } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const filters = {
      type: url.searchParams.get("type") || undefined,
      category: url.searchParams.get("category") || undefined,
      city: url.searchParams.get("city") || undefined,
      minPrice: url.searchParams.get("minPrice")
        ? Number(url.searchParams.get("minPrice"))
        : undefined,
      maxPrice: url.searchParams.get("maxPrice")
        ? Number(url.searchParams.get("maxPrice"))
        : undefined,
      minBedrooms: url.searchParams.get("minBedrooms")
        ? Number(url.searchParams.get("minBedrooms"))
        : undefined,
      search: url.searchParams.get("search") || undefined,
      featured: url.searchParams.get("featured") === "true" ? true : undefined,
      limit: url.searchParams.get("limit")
        ? Number(url.searchParams.get("limit"))
        : 50,
    };

    const properties = await getProperties(filters);
    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const property = await createProperty(body);
    await logActivity({
      action: "create",
      entity: "property",
      entityId: property.id,
      details: `Created property: ${body.titleEn || body.slug}`,
      userName: auth.username,
    });
    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("Failed to create property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    await deleteProperty(id);
    await logActivity({
      action: "delete",
      entity: "property",
      entityId: id,
      details: `Deleted property ID: ${id}`,
      userName: auth.username,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
