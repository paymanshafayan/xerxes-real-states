import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/db";
import { staffSpecialties } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/staff/specialties
 *
 * Returns the current staff member's specialties. Manager can pass
 * `?staffId=N` to view another staff's specialties.
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager", "consultant"]);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const targetStaffId =
    auth.role === "manager" && url.searchParams.get("staffId")
      ? Number(url.searchParams.get("staffId"))
      : auth.id;

  const rows = await db
    .select()
    .from(staffSpecialties)
    .where(eq(staffSpecialties.staffId, targetStaffId));

  return NextResponse.json({ specialties: rows });
}

/**
 * PUT /api/staff/specialties
 *
 * Replace the current staff member's specialties with the provided list.
 * Manager can target another staff via `?staffId=N`.
 *
 * Body: { specialties: [{ city?, category?, listingType? }] }
 */
export async function PUT(request: NextRequest) {
  const auth = await requireStaff(request, ["manager", "consultant"]);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const targetStaffId =
    auth.role === "manager" && url.searchParams.get("staffId")
      ? Number(url.searchParams.get("staffId"))
      : auth.id;

  // Only manager can edit others' specialties
  if (targetStaffId !== auth.id && auth.role !== "manager") {
    return NextResponse.json(
      { error: "Forbidden: only manager can edit other staff's specialties" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const specialties = Array.isArray(body?.specialties) ? body.specialties : [];

    // Validate each
    for (const sp of specialties) {
      if (sp.city != null && typeof sp.city !== "string") {
        return NextResponse.json({ error: "Invalid city" }, { status: 400 });
      }
      if (sp.category != null && !["villa", "apartment", "land", "commercial"].includes(sp.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      if (sp.listingType != null && !["sale", "rent"].includes(sp.listingType)) {
        return NextResponse.json({ error: "Invalid listingType" }, { status: 400 });
      }
    }

    // Delete existing
    await db
      .delete(staffSpecialties)
      .where(eq(staffSpecialties.staffId, targetStaffId));

    // Insert new
    if (specialties.length > 0) {
      await db.insert(staffSpecialties).values(
        specialties.map((sp: any) => ({
          staffId: targetStaffId,
          city: sp.city || null,
          category: sp.category || null,
          listingType: sp.listingType || null,
          isActive: true,
        }))
      );
    }

    return NextResponse.json({ success: true, count: specialties.length });
  } catch (err: any) {
    console.error("PUT /api/staff/specialties error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update specialties" },
      { status: 400 }
    );
  }
}
