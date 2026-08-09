import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getListingsByUser } from "@/lib/data/listings";

/**
 * GET /api/listings/mine
 *
 * Returns all listings owned by the current user.
 * Optional query: ?status=pending|approved|rejected|removed|unavailable_reported
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | "removed"
    | "unavailable_reported"
    | null;

  const listings = await getListingsByUser(auth.id, status || undefined);

  // Compute a small summary too
  const summary = {
    total: listings.length,
    pending: listings.filter((l) => l.approvalStatus === "pending").length,
    approved: listings.filter((l) => l.approvalStatus === "approved").length,
    rejected: listings.filter((l) => l.approvalStatus === "rejected").length,
    removed: listings.filter((l) => l.approvalStatus === "removed").length,
    unavailable_reported: listings.filter(
      (l) => l.approvalStatus === "unavailable_reported"
    ).length,
  };

  return NextResponse.json({ listings, summary });
}
