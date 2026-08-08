import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";

// POST - register this device's Expo push token for the logged-in staff member
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { pushToken } = await request.json();
    if (!pushToken) {
      return NextResponse.json({ error: "pushToken required" }, { status: 400 });
    }
    await db
      .update(staff)
      .set({ pushToken })
      .where(eq(staff.id, auth.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push register error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
