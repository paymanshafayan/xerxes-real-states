import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStaff } from "@/lib/auth/session";
import { logActivity } from "@/lib/activityLog";

export async function GET(request: NextRequest) {
  const auth = await getStaff(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await db
      .select()
      .from(staff)
      .where(eq(staff.id, auth.id))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const u = rows[0];
    return NextResponse.json({
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
        status: u.status,
      },
    });
  } catch (error) {
    console.error("Staff me error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT - update own profile (name, email, phone, avatar)
export async function PUT(request: NextRequest) {
  const auth = await getStaff(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const values: Record<string, unknown> = {};
    if (body.name) values.name = body.name;
    if (body.email) values.email = body.email;
    if (body.phone !== undefined) values.phone = body.phone;
    if (body.avatar !== undefined) values.avatar = body.avatar;
    const [u] = await db
      .update(staff)
      .set(values)
      .where(eq(staff.id, auth.id))
      .returning({
        id: staff.id,
        username: staff.username,
        name: staff.name,
        role: staff.role,
        email: staff.email,
        phone: staff.phone,
        avatar: staff.avatar,
        agentId: staff.agentId,
        permissions: staff.permissions,
        status: staff.status,
      });
    await logActivity({
      action: "update",
      entity: "agent",
      entityId: auth.id,
      userName: auth.username,
      details: "Updated own profile",
    });
    return NextResponse.json({ success: true, staff: u });
  } catch (error) {
    console.error("Staff me update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
