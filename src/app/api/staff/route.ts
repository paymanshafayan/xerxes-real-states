import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";
import { logActivity } from "@/lib/activityLog";

// GET - list all staff (manager only)
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const rows = await db
      .select({
        id: staff.id,
        username: staff.username,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        status: staff.status,
        agentId: staff.agentId,
        avatar: staff.avatar,
        lastLoginAt: staff.lastLoginAt,
        createdAt: staff.createdAt,
      })
      .from(staff)
      .orderBy(desc(staff.createdAt));
    return NextResponse.json({ staff: rows });
  } catch (error) {
    console.error("List staff error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - create staff (manager only)
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const { username, email, password, name, role, agentId, phone, permissions } =
      body;
    if (!username || !password || !name || !email) {
      return NextResponse.json(
        { error: "username, email, password and name are required" },
        { status: 400 }
      );
    }
    const hash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(staff)
      .values({
        username,
        email,
        passwordHash: hash,
        name,
        role: role === "manager" ? "manager" : "consultant",
        agentId: agentId || null,
        phone: phone || null,
        permissions: permissions || (role === "manager" ? ["*"] : []),
        status: "active",
      })
      .returning({ id: staff.id });
    await logActivity({
      action: "create",
      entity: "agent",
      entityId: created.id,
      userName: auth.username,
      details: `Created staff: ${username} (${role})`,
    });
    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PUT - update staff (manager only)
export async function PUT(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const body = await request.json();
    const values: Record<string, unknown> = {};
    if (body.name) values.name = body.name;
    if (body.email) values.email = body.email;
    if (body.phone !== undefined) values.phone = body.phone;
    if (body.role) values.role = body.role;
    if (body.agentId !== undefined) values.agentId = body.agentId || null;
    if (body.status) values.status = body.status;
    if (body.avatar !== undefined) values.avatar = body.avatar;
    if (body.permissions) values.permissions = body.permissions;
    if (body.password) values.passwordHash = await bcrypt.hash(body.password, 10);
    await db.update(staff).set(values).where(eq(staff.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE - delete staff (manager only, not self)
export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (id === auth.id)
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    await db.delete(staff).where(eq(staff.id, id));
    await logActivity({
      action: "delete",
      entity: "agent",
      entityId: id,
      userName: auth.username,
      details: "Deleted staff",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
