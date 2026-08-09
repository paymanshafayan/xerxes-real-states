import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { getListingById, requestReassign } from "@/lib/data/listings";
import { getListingPermissions } from "@/lib/listings/permissions";
import { reassignRequestSchema } from "@/lib/listings/validation";
import { notifyAllManagers } from "@/lib/listings/notify";

/**
 * POST /api/staff/listings/[id]/reassign-request
 *
 * The currently-assigned staff (or a manager) can request to be relieved
 * of a listing. The request goes to all managers for approval.
 *
 * Body: { reason: string, preferredStaffId?: number }
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

  // Permission check: only assigned or manager
  const permissions = getListingPermissions(listing, null, auth);
  if (!permissions.canReassignRequest) {
    return NextResponse.json(
      { error: "Forbidden: only the assigned staff or a manager can request reassignment" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const input = reassignRequestSchema.parse(body);

    const result = await requestReassign({
      listingId: id,
      staffId: auth.id,
      reason: input.reason,
      preferredStaffId: input.preferredStaffId || null,
    });

    // Notify all managers
    await notifyAllManagers({
      type: "listing_reassigned",
      title: "درخواست واگذاری ملک",
      body: `کارشناس ${auth.name} درخواست واگذاری ملک «${listing.title}» را دارد.`,
      data: { listingId: id, reassignRequestId: result.id },
    });

    return NextResponse.json({
      success: true,
      reassignRequest: result,
      message: "درخواست شما برای مدیر ارسال شد.",
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("POST reassign-request error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create reassign request" },
      { status: 400 }
    );
  }
}
