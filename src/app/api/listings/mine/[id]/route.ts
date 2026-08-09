import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getListingWithHistory, softDeleteListingByUser } from "@/lib/data/listings";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";

/**
 * GET /api/listings/mine/[id]
 *
 * Returns a single listing owned by the current user, with status history
 * and the assigned staff's basic info.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await getListingWithHistory(id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.userId !== auth.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ listing: result });
}

/**
 * DELETE /api/listings/mine/[id]
 *
 * Soft-deletes a listing owned by the current user. The linked public
 * property is also hidden from the public list.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await softDeleteListingByUser({ listingId: id, userId: auth.id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/listings/mine error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete listing" },
      { status: 400 }
    );
  }
}
