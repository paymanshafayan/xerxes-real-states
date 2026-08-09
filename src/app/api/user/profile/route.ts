import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getUserProfile, upsertUserProfile } from "@/lib/data/listings";
import { userProfileUpdateSchema } from "@/lib/listings/validation";

/**
 * GET /api/user/profile
 *
 * Returns the current user's extended profile (user_profiles row).
 * If no profile exists yet, returns an empty shape.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const profile = await getUserProfile(auth.id);

  return NextResponse.json({
    profile: profile || {
      userId: auth.id,
      profileCompleted: false,
    },
  });
}

/**
 * PUT /api/user/profile
 *
 * Upserts the current user's profile. Set `profileCompleted: true` once
 * all required fields are filled (lastName, addressLine, city).
 */
export async function PUT(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = userProfileUpdateSchema.parse(body);

    // Auto-set profileCompleted if all required fields are present
    if (
      parsed.lastName &&
      parsed.addressLine &&
      parsed.city
    ) {
      parsed.profileCompleted = true;
    }

    const profile = await upsertUserProfile({
      userId: auth.id,
      data: parsed,
    });

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/user/profile error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
