import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
    const appointments = rows
      .filter((r) => r.message.includes("VIEWING APPOINTMENT REQUEST"))
      .map((r) => {
        const m = r.message;
        const date = m.match(/Date:\s*(.+)/)?.[1]?.trim() || "";
        const time = m.match(/Time:\s*(.+)/)?.[1]?.trim() || "";
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          propertyId: r.propertyId,
          date,
          time,
          message: m,
          status: r.status,
          createdAt: r.createdAt,
        };
      });
    return NextResponse.json({ appointments });
  } catch {
    return NextResponse.json({ appointments: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, date, time, name, email, phone, message } = body;

    if (!name || !email || !date || !time) {
      return NextResponse.json(
        { error: "Name, email, date and time are required" },
        { status: 400 }
      );
    }

    const inquiry = await db.insert(inquiries).values({
      propertyId: propertyId || null,
      name,
      email,
      phone: phone || null,
      message: `VIEWING APPOINTMENT REQUEST\nDate: ${date}\nTime: ${time}\nMessage: ${message || "None"}`,
      status: "new",
    }).returning();

    return NextResponse.json({ success: true, inquiry: inquiry[0] });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
