import { NextRequest, NextResponse } from "next/server";
import { requireStaff, getUser } from "@/lib/auth/session";
import { db } from "@/db";
import { listings, staff, users, properties } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getListingWithHistory } from "@/lib/data/listings";
import { getListingPermissions } from "@/lib/listings/permissions";

/**
 * GET /api/staff/listings/[id]
 *
 * Returns a single listing with full details, history, and the property owner's
 * info. Any staff member can VIEW (read-only), but only the assigned staff or
 * a manager can perform actions on it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request, ["manager", "consultant"]);
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const listing = await getListingWithHistory(id);
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get the property owner
  const ownerRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isBlocked: users.isBlocked,
    })
    .from(users)
    .where(eq(users.id, listing.userId))
    .limit(1);

  // Get the linked property
  let linkedProperty = null;
  if (listing.propertyId) {
    const propRows = await db
      .select()
      .from(properties)
      .where(eq(properties.id, listing.propertyId))
      .limit(1);
    if (propRows.length > 0) {
      linkedProperty = propRows[0];
    }
  }

  // Compute permissions for the current actor
  const user = await getUser(request);
  const permissions = getListingPermissions(
    listing,
    user, // not relevant for staff endpoints but typed correctly
    auth
  );

  // If consultant, restrict to assigned only for editable actions
  // (they can still view any listing for awareness)
  // Note: getListingAccess already returns 'readonly' for non-assigned consultant

  return NextResponse.json({
    listing,
    owner: ownerRows[0] || null,
    property: linkedProperty,
    permissions,
  });
}
