import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signStaffToken } from "@/lib/auth/jwt";
import { logActivity } from "@/lib/activityLog";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "staff-login", 10, 60_000);
  if (limited) return limited;
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // First-run bootstrap: create a default manager when table is empty.
    const existing = await db.select().from(staff).limit(1);
    if (existing.length === 0) {
      const defUser = process.env.DEFAULT_MANAGER_USER || "manager";
      const defPass = process.env.DEFAULT_MANAGER_PASS || "manager123";
      if (username === defUser && password === defPass) {
        const hash = await bcrypt.hash(defPass, 10);
        const [created] = await db
          .insert(staff)
          .values({
            username: defUser,
            email: process.env.DEFAULT_MANAGER_EMAIL || "manager@xerxes.com",
            passwordHash: hash,
            name: "Site Manager",
            role: "manager",
            status: "active",
            permissions: ["*"],
          })
          .returning();
        await logActivity({
          action: "login",
          entity: "admin",
          userName: defUser,
          details: "First-time manager login (auto-created)",
        });
        return await issueToken(created);
      }
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(staff)
      .where(eq(staff.username, username))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const u = user[0];
    if (u.status !== "active") {
      return NextResponse.json(
        { error: "Account disabled" },
        { status: 403 }
      );
    }
    const valid = await bcrypt.compare(password, u.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await db
      .update(staff)
      .set({ lastLoginAt: new Date() })
      .where(eq(staff.id, u.id));
    await logActivity({
      action: "login",
      entity: "admin",
      userName: u.username,
      details: "Staff login",
    });

    return await issueToken(u);
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

async function issueToken(u: typeof staff.$inferSelect) {
  const token = await signStaffToken({
    id: u.id,
    username: u.username,
    role: u.role as "manager" | "consultant",
    name: u.name,
    agentId: u.agentId,
  });
  return NextResponse.json({
    success: true,
    token,
    staff: {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      agentId: u.agentId,
      permissions: u.permissions,
    },
  });
}
