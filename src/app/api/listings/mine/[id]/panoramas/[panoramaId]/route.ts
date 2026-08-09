import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { removePanoramaFromListing } from "@/lib/data/listings";

/**
 * DELETE /api/listings/mine/[id]/panoramas/[panoramaId]
 *
 * Removes a panorama by its URL (URL-encoded as panoramaId).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; panoramaId: string }> }
) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr, panoramaId } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // panoramaId is the URL-encoded panorama URL
  const panoramaUrl = decodeURIComponent(panoramaId);

  try {
    const result = await removePanoramaFromListing({
      listingId: id,
      userId: auth.id,
      panoramaUrl,
    });
    return NextResponse.json({
      success: true,
      panoramas: result.panoramas,
      total: result.total,
    });
  } catch (err: any) {
    console.error("DELETE panorama error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to remove panorama" },
      { status: 400 }
    );
  }
}
