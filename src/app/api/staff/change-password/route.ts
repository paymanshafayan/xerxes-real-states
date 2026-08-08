import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStaff } from "@/lib/auth/session";

// POST - change own password (requires current password)
export async function POST(request: NextRequest) {
  const auth = await getStaff(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Current and new password (min 6 chars) are required" },
        { status: 400 }
      );
    }
    const rows = await db
      .select()
      .from(staff)
      .where(eq(staff.id, auth.id))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const valid = await bcrypt.compare(currentPassword, rows[0].passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db
      .update(staff)
      .set({ passwordHash: hash })
      .where(eq(staff.id, auth.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
