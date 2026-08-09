import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/lib/data/listings";

/**
 * GET /api/user/notifications
 *
 * Returns the current user's in-app notifications, newest first.
 * Optional query: ?limit=20
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

  const [list, unreadCount] = await Promise.all([
    getUserNotifications(auth.id, limit),
    getUnreadNotificationCount(auth.id),
  ]);

  return NextResponse.json({ notifications: list, unreadCount });
}
