import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, staff } from "@/db/schema";
import { desc, sql, eq, and, or, ilike } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";

/**
 * GET /api/admin/users
 *
 * Manager-only: list all users with optional filters.
 *  - ?isBlocked=true|false
 *  - ?search=email_or_name
 *  - ?limit, ?offset
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(request.url);
    const isBlockedFilter = url.searchParams.get("isBlocked");
    const search = url.searchParams.get("search");
    const limit = Math.min(Number(url.searchParams.get("limit") || 100), 500);
    const offset = Number(url.searchParams.get("offset") || 0);

    const conditions = [];
    if (isBlockedFilter === "true") {
      conditions.push(eq(users.isBlocked, true));
    } else if (isBlockedFilter === "false") {
      conditions.push(eq(users.isBlocked, false));
    }
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.name, `%${search}%`)
        )
      );
    }

    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        avatar: users.avatar,
        isBlocked: users.isBlocked,
        blockedAt: users.blockedAt,
        blockedReason: users.blockedReason,
        blockedByStaffId: users.blockedByStaffId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      users: userList,
      total: Number(countResult[0].count),
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ users: [], total: 0 });
  }
}
