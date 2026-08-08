import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staticContent } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";

// GET all content or by section
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const section = url.searchParams.get("section");

    let rows;
    if (section) {
      rows = await db
        .select()
        .from(staticContent)
        .where(eq(staticContent.section, section));
    } else {
      rows = await db.select().from(staticContent);
    }

    // Convert to key-value map grouped by section
    const content: Record<string, Record<string, unknown>> = {};
    for (const row of rows) {
      if (!content[row.section]) content[row.section] = {};
      try {
        content[row.section][row.key] = JSON.parse(row.value);
      } catch {
        content[row.section][row.key] = row.value;
      }
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to fetch content:", error);
    return NextResponse.json({ content: {} });
  }
}

// POST - Save content
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const { section, key, value } = body;

    if (!section || !key) {
      return NextResponse.json(
        { error: "Section and key are required" },
        { status: 400 }
      );
    }

    const valueStr = typeof value === "string" ? value : JSON.stringify(value);

    // Upsert
    const existing = await db
      .select()
      .from(staticContent)
      .where(and(eq(staticContent.section, section), eq(staticContent.key, key)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(staticContent)
        .set({ value: valueStr, updatedAt: new Date() })
        .where(and(eq(staticContent.section, section), eq(staticContent.key, key)));
    } else {
      await db.insert(staticContent).values({ section, key, value: valueStr });
    }

    await logActivity({
      action: "update",
      entity: "setting",
      details: `Content updated: ${section}/${key}`,
      userName: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save content:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const section = url.searchParams.get("section");
    const key = url.searchParams.get("key");

    if (!section || !key) {
      return NextResponse.json({ error: "Section and key required" }, { status: 400 });
    }

    await db
      .delete(staticContent)
      .where(and(eq(staticContent.section, section), eq(staticContent.key, key)));

    await logActivity({
      action: "delete",
      entity: "setting",
      details: `Content deleted: ${section}/${key}`,
      userName: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete content:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
