import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/data/listings";

/**
 * POST /api/user/notifications/[id]/read
 *
 * Marks a single notification as read.
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

  const ok = await markNotificationRead({ notificationId: id, userId: auth.id });
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
