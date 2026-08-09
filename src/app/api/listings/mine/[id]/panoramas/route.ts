import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import {
  addPanoramasToListing,
  getListingById,
} from "@/lib/data/listings";
import { parsePanoramaMultipart } from "@/lib/listings/upload";
import { notifyPanoramaAdded } from "@/lib/listings/notify";

/**
 * POST /api/listings/mine/[id]/panoramas
 *
 * Adds 360° panorama images to an APPROVED listing. Multipart form-data
 * with `panoramas` field containing one or more image files (equirectangular,
 * 2:1 aspect ratio). Max 10 per request, max 10MB each.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Rate limit
  const limited = rateLimit(
    request,
    `user-panorama-add:${auth.id}`,
    10,
    60 * 60 * 1000
  );
  if (limited) return limited;

  try {
    // Verify ownership first
    const listing = await getListingById(id);
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (listing.userId !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse + upload panoramas
    const files = await parsePanoramaMultipart(request);
    if (files.length === 0) {
      return NextResponse.json(
        { error: "هیچ فایلی ارسال نشد" },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "حداکثر ۱۰ تصویر در هر بار" },
        { status: 400 }
      );
    }

    const urls = files.map((f) => f.url);
    const result = await addPanoramasToListing({
      listingId: id,
      userId: auth.id,
      panoramaUrls: urls,
    });

    // Notify assigned staff
    await notifyPanoramaAdded({
      assignedStaffId: listing.assignedStaffId,
      listingId: id,
      listingTitle: listing.title,
      userId: auth.id,
      count: urls.length,
    });

    return NextResponse.json({
      success: true,
      panoramas: result.panoramas,
      total: result.total,
    });
  } catch (err: any) {
    console.error("POST /api/listings/mine/[id]/panoramas error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to add panoramas" },
      { status: 400 }
    );
  }
}
