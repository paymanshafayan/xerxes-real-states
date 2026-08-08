import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageViews } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer, propertyId, sessionId } = body;

    if (!path) {
      return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || null;

    await db.insert(pageViews).values({
      path,
      referrer: referrer || null,
      userAgent,
      propertyId: propertyId || null,
      sessionId: sessionId || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track page view:", error);
    return NextResponse.json({ success: true }); // Don't fail silently
  }
}
