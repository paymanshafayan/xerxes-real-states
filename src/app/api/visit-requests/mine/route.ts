import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getVisitRequestsByUser } from "@/lib/data/listings";

/**
 * GET /api/visit-requests/mine
 *
 * Returns the current user's visit requests, with the related listing
 * (title, city, slug, cover image).
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const requests = await getVisitRequestsByUser(auth.id);
  return NextResponse.json({ visitRequests: requests });
}
