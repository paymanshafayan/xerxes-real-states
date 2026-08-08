import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    return NextResponse.json({
      users: userList,
      total: Number(countResult[0].count),
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ users: [], total: 0 });
  }
}
