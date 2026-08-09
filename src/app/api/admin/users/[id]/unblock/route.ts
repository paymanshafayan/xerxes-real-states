import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { unblockUser } from "@/lib/data/listings";
import { unblockUserSchema } from "@/lib/listings/validation";

/**
 * POST /api/admin/users/[id]/unblock
 *
 * Manager-only: unblock a previously-blocked user account.
 * Listings that were hidden during the block are NOT auto-restored.
 *
 * Body: { reason: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const input = unblockUserSchema.parse(body);

    await unblockUser({
      userId: id,
      managerId: auth.id,
      reason: input.reason,
    });

    return NextResponse.json({
      success: true,
      message: "حساب کاربر رفع بلاک شد.",
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("POST unblock error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to unblock user" },
      { status: 400 }
    );
  }
}
