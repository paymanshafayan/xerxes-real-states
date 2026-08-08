import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmLeads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db
      .update(crmLeads)
      .set({
        ...body,
        updatedAt: new Date(),
        ...(body.status && body.status !== "new" ? { lastContactAt: new Date() } : {}),
      })
      .where(eq(crmLeads.id, Number(id)))
      .returning();

    await logActivity({
      action: "update",
      entity: "user",
      entityId: Number(id),
      details: `Updated CRM lead #${id}: ${JSON.stringify(body)}`,
    });

    return NextResponse.json({ success: true, lead: updated[0] });
  } catch (error) {
    console.error("Failed to update lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
