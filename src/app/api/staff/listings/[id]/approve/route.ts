import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { getListingById, approveListing } from "@/lib/data/listings";
import { getListingPermissions } from "@/lib/listings/permissions";

/**
 * POST /api/staff/listings/[id]/approve
 *
 * Approves a pending listing. Only the assigned staff or a manager can do this.
 * Creates a public property record and links it back to the listing.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager", "consultant"]);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const listing = await getListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Permission check
  const permissions = getListingPermissions(listing, null, auth);
  if (!permissions.canApprove) {
    return NextResponse.json(
      {
        error:
          "Forbidden: you must be the assigned staff or a manager to approve this listing",
      },
      { status: 403 }
    );
  }

  try {
    const result = await approveListing({ listingId: id, staffId: auth.id });
    return NextResponse.json({
      success: true,
      propertyId: result.propertyId,
      message: "آگهی تایید و در لیست عمومی منتشر شد.",
    });
  } catch (err: any) {
    console.error("POST approve error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to approve listing" },
      { status: 400 }
    );
  }
}
