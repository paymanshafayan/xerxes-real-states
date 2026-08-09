import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createVisitRequest } from "@/lib/data/listings";
import { visitRequestCreateSchema } from "@/lib/listings/validation";
import { notifyVisitRequestCreated } from "@/lib/listings/notify";

/**
 * POST /api/visit-requests
 *
 * Body: { listingId, requesterName, requesterPhone, requesterEmail?,
 *         preferredDate?, note? }
 *
 * Creates a visit request and notifies the listing's assigned staff.
 * Cannot request a visit to your own listing.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  // Rate limit
  const limited = rateLimit(
    request,
    `user-visit-create:${auth.id}`,
    5,
    24 * 60 * 60 * 1000
  );
  if (limited) return limited;

  try {
    const body = await request.json();
    const input = visitRequestCreateSchema.parse(body);

    const result = await createVisitRequest({
      requesterUserId: auth.id,
      input: {
        listingId: input.listingId,
        requesterName: input.requesterName,
        requesterPhone: input.requesterPhone,
        requesterEmail: input.requesterEmail || undefined,
        preferredDate: input.preferredDate,
        note: input.note,
      },
    });

    // Notify assigned staff
    await notifyVisitRequestCreated({
      staffId: result.assignedStaffId,
      visitRequestId: result.visitRequest.id,
      listingId: input.listingId,
      requesterName: input.requesterName,
    });

    return NextResponse.json(
      {
        success: true,
        visitRequest: result.visitRequest,
        message:
          "درخواست شما ثبت شد. کارشناس مربوطه به زودی با شما تماس خواهد گرفت.",
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
    console.error("POST /api/visit-requests error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create visit request" },
      { status: 400 }
    );
  }
}
