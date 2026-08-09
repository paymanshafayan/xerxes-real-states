import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { getReassignRequests, rejectReassign } from "@/lib/data/listings";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/staff/reassign-requests
 *
 * Manager-only: list all pending reassignment requests.
 * Optional: ?status=pending|approved|rejected
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | null;

  const requests = await getReassignRequests(status || undefined);

  // Enrich with requester info
  const requesterIds = Array.from(
    new Set(requests.map((r) => r.request.requestedByStaffId))
  );
  const requesters = requesterIds.length
    ? await db
        .select({
          id: staff.id,
          name: staff.name,
          username: staff.username,
          email: staff.email,
        })
        .from(staff)
        .where(
          requesterIds.length === 1
            ? eq(staff.id, requesterIds[0])
            : (await import("drizzle-orm")).inArray(staff.id, requesterIds)
        )
    : [];
  const requesterMap = new Map(requesters.map((r) => [r.id, r]));

  const enriched = requests.map((r) => ({
    ...r,
    requester: requesterMap.get(r.request.requestedByStaffId) || null,
  }));

  return NextResponse.json({ reassignRequests: enriched });
}
