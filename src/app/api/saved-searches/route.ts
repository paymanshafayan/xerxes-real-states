import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifyUserToken } from "@/lib/auth/jwt";

// Helper to get user ID from a signed token
async function getUserIdFromToken(token: string): Promise<number | null> {
  const payload = await verifyUserToken(token);
  return payload ? payload.id : null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserIdFromToken(authHeader.split(" ")[1]);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.createdAt));

    return NextResponse.json({ searches });
  } catch (error) {
    console.error("Failed to fetch saved searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved searches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserIdFromToken(authHeader.split(" ")[1]);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, filters, emailNotify } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const search = await db
      .insert(savedSearches)
      .values({
        userId,
        name,
        filters: filters || {},
        emailNotify: emailNotify ?? true,
      })
      .returning();

    return NextResponse.json({ success: true, search: search[0] });
  } catch (error) {
    console.error("Failed to save search:", error);
    return NextResponse.json(
      { error: "Failed to save search" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserIdFromToken(authHeader.split(" ")[1]);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db
      .delete(savedSearches)
      .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete saved search:", error);
    return NextResponse.json(
      { error: "Failed to delete saved search" },
      { status: 500 }
    );
  }
}
