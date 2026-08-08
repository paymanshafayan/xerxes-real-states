import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";
import { updateProperty, deleteProperty } from "@/lib/data/dataProvider";
import { logActivity } from "@/lib/activityLog";

// GET single property (staff scoped)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(properties)
      .where(eq(properties.id, Number(id)))
      .limit(1);
    if (rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = rows[0];
    if (auth.role === "consultant" && auth.agentId && row.agentId !== auth.agentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ property: row });
  } catch (error) {
    console.error("Staff get property error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT update property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const pid = Number(id);
    // ownership check for consultants
    if (auth.role === "consultant" && auth.agentId) {
      const rows = await db
        .select({ agentId: properties.agentId })
        .from(properties)
        .where(eq(properties.id, pid))
        .limit(1);
      if (rows.length === 0)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (rows[0].agentId !== auth.agentId)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    const map: Record<string, keyof typeof body> = {
      titleTr: "titleTr",
      titleEn: "titleEn",
      titleFa: "titleFa",
      titleRu: "titleRu",
      descriptionTr: "descriptionTr",
      descriptionEn: "descriptionEn",
      descriptionFa: "descriptionFa",
      descriptionRu: "descriptionRu",
      type: "type",
      category: "category",
      price: "price",
      currency: "currency",
      bedrooms: "bedrooms",
      bathrooms: "bathrooms",
      area: "area",
      city: "city",
      district: "district",
      address: "address",
      lat: "lat",
      lng: "lng",
      images: "images",
      features: "features",
      isFeatured: "isFeatured",
      panoramas: "panoramas",
      videos: "videos",
      audioNotes: "audioNotes",
      virtualTourUrl: "virtualTourUrl",
    };
    for (const [k, src] of Object.entries(map)) {
      if (body[src] !== undefined) {
        if (["price", "bedrooms", "bathrooms", "area", "lat", "lng"].includes(k))
          data[k] = Number(body[src]);
        else if (k === "isFeatured") data[k] = Boolean(body[src]);
        else data[k] = body[src];
      }
    }
    // consultants cannot reassign ownership
    if (auth.role === "manager" && body.agentId !== undefined) {
      data.agentId = body.agentId ? Number(body.agentId) : null;
    }

    const updated = await updateProperty(pid, data);
    await logActivity({
      action: "update",
      entity: "property",
      entityId: pid,
      userName: auth.username,
      details: `Updated property #${pid}`,
    });
    return NextResponse.json({ success: true, property: updated });
  } catch (error) {
    console.error("Staff update property error:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const pid = Number(id);
    if (auth.role === "consultant" && auth.agentId) {
      const rows = await db
        .select({ agentId: properties.agentId })
        .from(properties)
        .where(eq(properties.id, pid))
        .limit(1);
      if (rows.length === 0)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (rows[0].agentId !== auth.agentId)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await deleteProperty(pid);
    await logActivity({
      action: "delete",
      entity: "property",
      entityId: pid,
      userName: auth.username,
      details: `Deleted property #${pid}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff delete property error:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
