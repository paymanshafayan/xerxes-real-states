import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmLeads } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const leads = await db
      .select()
      .from(crmLeads)
      .orderBy(desc(crmLeads.createdAt));

    const statusCounts = await db
      .select({
        status: crmLeads.status,
        count: sql<number>`count(*)`,
      })
      .from(crmLeads)
      .groupBy(crmLeads.status);

    return NextResponse.json({
      leads,
      summary: {
        total: leads.length,
        byStatus: Object.fromEntries(
          statusCounts.map((s) => [s.status, Number(s.count)])
        ),
      },
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json({ leads: [], summary: { total: 0, byStatus: {} } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, source, propertyInterest, budget, notes } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const lead = await db
      .insert(crmLeads)
      .values({
        name,
        email,
        phone: phone || null,
        source: source || "website",
        propertyInterest: propertyInterest || null,
        budget: budget || null,
        notes: notes || null,
      })
      .returning();

    await logActivity({
      action: "create",
      entity: "user",
      entityId: lead[0].id,
      details: `New CRM lead: ${name} (${email}) - Source: ${source || "website"}`,
    });

    return NextResponse.json({ success: true, lead: lead[0] });
  } catch (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
