import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const { status } = await request.json();
    await db
      .update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    await db.delete(inquiries).where(eq(inquiries.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
