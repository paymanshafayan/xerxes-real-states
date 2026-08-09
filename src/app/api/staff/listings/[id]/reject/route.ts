import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { getListingById, rejectListing } from "@/lib/data/listings";
import { getListingPermissions } from "@/lib/listings/permissions";

/**
 * POST /api/staff/listings/[id]/reject
 *
 * Body: { reason: string }
 *
 * Rejects a pending listing. Only the assigned staff or a manager can do this.
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
  if (!permissions.canReject) {
    return NextResponse.json(
      { error: "Forbidden: you must be the assigned staff or a manager" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const reason = (body?.reason || "").toString().trim();
    if (!reason || reason.length < 5) {
      return NextResponse.json(
        { error: "Reason is required (min 5 chars)" },
        { status: 400 }
      );
    }

    await rejectListing({ listingId: id, staffId: auth.id, reason });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST reject error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to reject listing" },
      { status: 400 }
    );
  }
}
