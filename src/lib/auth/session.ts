import { NextRequest, NextResponse } from "next/server";
import { verifyStaffToken, verifyUserToken, type StaffJwtPayload, type UserJwtPayload } from "./jwt";

/**
 * Extract and verify the staff JWT from the Authorization header.
 * Returns null when missing/invalid.
 */
export async function getStaff(
  request: NextRequest
): Promise<StaffJwtPayload | null> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];
  if (!token) return null;
  return verifyStaffToken(token);
}

export type Role = "manager" | "consultant";

/**
 * Require an authenticated staff member with one of the allowed roles.
 * Returns the payload, or a NextResponse error to short-circuit.
 */
export async function requireStaff(
  request: NextRequest,
  roles: Role[] = ["manager", "consultant"]
): Promise<StaffJwtPayload | NextResponse> {
  const staff = await getStaff(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!roles.includes(staff.role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 }
    );
  }
  return staff;
}

/** True when the request comes from a manager (full access). */
export function isManager(staff: StaffJwtPayload | null): boolean {
  return staff?.role === "manager";
}

// =============================================================================
// Regular user auth (Phase 8: User Listings)
// =============================================================================

/**
 * Extract and verify the regular user JWT from the Authorization header.
 * Returns null when missing/invalid.
 */
export async function getUser(
  request: NextRequest
): Promise<UserJwtPayload | null> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];
  if (!token) return null;
  return verifyUserToken(token);
}

/**
 * Require an authenticated regular user.
 * Returns the payload, or a NextResponse error to short-circuit.
 *
 * Also checks that the user is not blocked.
 */
export async function requireUser(
  request: NextRequest
): Promise<UserJwtPayload | NextResponse> {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is blocked (Phase 8: block system)
  try {
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select({ isBlocked: users.isBlocked, blockedReason: users.blockedReason })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (rows.length > 0 && rows[0].isBlocked) {
      return NextResponse.json(
        {
          error: "Account blocked",
          reason: rows[0].blockedReason || "Your account has been blocked",
          code: "ACCOUNT_BLOCKED",
        },
        { status: 403 }
      );
    }
  } catch (err) {
    // If check fails, continue - login flow already has the check
    console.error("requireUser block-check failed:", err);
  }

  return user;
}
