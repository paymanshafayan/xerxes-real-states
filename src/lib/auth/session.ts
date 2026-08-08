import { NextRequest, NextResponse } from "next/server";
import { verifyStaffToken, type StaffJwtPayload } from "./jwt";

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
