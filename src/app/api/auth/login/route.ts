import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signUserToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth-login", 10, 60_000);
  if (limited) return limited;
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user[0].passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signUserToken({
      id: user[0].id,
      email: user[0].email,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        phone: user[0].phone,
        avatar: user[0].avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
