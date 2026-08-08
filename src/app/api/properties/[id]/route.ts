import { NextRequest, NextResponse } from "next/server";
import { updateProperty, getPropertyById } from "@/lib/data/dataProvider";
import { requireStaff } from "@/lib/auth/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Map form fields to database fields
    const data = {
      slug: body.slug,
      titleTr: body.titleTr,
      titleEn: body.titleEn,
      titleFa: body.titleFa,
      titleRu: body.titleRu,
      descriptionTr: body.descriptionTr,
      descriptionEn: body.descriptionEn,
      descriptionFa: body.descriptionFa,
      descriptionRu: body.descriptionRu,
      type: body.type,
      category: body.category,
      price: body.price,
      currency: body.currency || "GBP",
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      area: body.area,
      city: body.city,
      district: body.district,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      images: body.images,
      features: body.features,
      virtualTourUrl: body.virtualTourUrl,
      isFeatured: body.isFeatured,
      agentId: body.agentId,
    };
    
    const property = await updateProperty(Number(id), data);
    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("Failed to update property:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await getPropertyById(Number(id));

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error("Failed to fetch property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}
