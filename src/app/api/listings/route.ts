import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createListing } from "@/lib/data/listings";
import { listingCreateSchema } from "@/lib/listings/validation";
import { parseListingMultipart, uploadFiles } from "@/lib/listings/upload";

/**
 * POST /api/listings
 *
 * Creates a new user-submitted listing. Expects multipart/form-data with:
 *  - field "data": JSON string with the listing details
 *  - field "images[]": one or more image files (min 3, max 20)
 *  - field "videos[]": optional video files (max 5)
 *
 * Pipeline:
 *  1. Verify user (not blocked)
 *  2. Rate limit (10/hour)
 *  3. Parse multipart + validate JSON with zod
 *  4. Upload files to /uploads/{image,video}/
 *  5. Snapshot contact info from user
 *  6. Smart-assign a staff member
 *  7. Save with status=pending
 *  8. Notify assigned staff + managers
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  // Rate limit
  const limited = rateLimit(request, "user-listing-create", 10, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    // Parse multipart (uploads files)
    const { data, files } = await parseListingMultipart(request);

    // Validate with zod
    const input = listingCreateSchema.parse(data);

    // Use uploaded file URLs
    const imageUrls = files.images.map((f) => f.url);
    const videoUrls = files.videos.map((f) => f.url);

    // Validate at least 3 images (already enforced in schema, but double check)
    if (imageUrls.length < 3) {
      return NextResponse.json(
        { error: "حداقل ۳ تصویر الزامی است" },
        { status: 400 }
      );
    }

    // Create listing
    const result = await createListing({
      userId: auth.id,
      input,
      uploadedImages: imageUrls,
      uploadedVideos: videoUrls,
    });

    return NextResponse.json(
      {
        success: true,
        listing: result.listing,
        assignedStaffId: result.assignedStaffId,
        message: "آگهی شما با موفقیت ثبت شد و در لیست بررسی کارشناسان قرار گرفت. پس از تایید، برای بازدید کاربران نمایش داده خواهد شد.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/listings error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create listing" },
      { status: 500 }
    );
  }
}
