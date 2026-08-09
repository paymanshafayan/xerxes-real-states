import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { signStaffToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "admin-login", 10, 60_000);
  if (limited) return limited;
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Initial credentials can only be created through the one-time /setup flow.
    const users = await db.select().from(adminUsers).limit(1);
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Initial setup is required. Open /setup to create the first manager." },
        { status: 403 }
      );
    }

    // Normal login
    const user = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user[0].passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await logActivity({ action: "login", entity: "admin", userName: username, details: "Admin login" });
    const token = await signStaffToken({
      id: user[0].id,
      username: user[0].username,
      role: "manager",
      name: "Administrator",
      agentId: null,
    });
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
