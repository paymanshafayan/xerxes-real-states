import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";

// POST - issue an Ably client token request for the authenticated staff member.
// The Ably API key stays server-side; the client only gets a scoped token request.
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json(
      { error: "Realtime not configured" },
      { status: 501 }
    );
  }
  try {
    // @ts-ignore - optional dependency, only loaded when Ably is configured
    const { Ably } = await import("ably");
    const rest = new Ably.Rest({ key: process.env.ABLY_API_KEY });
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId: `staff-${auth.id}`,
      capability: {
        "chat:*": ["subscribe", "publish"],
        "staff:*": ["subscribe", "publish"],
      },
    });
    return NextResponse.json({ tokenRequest });
  } catch (error) {
    console.error("Ably token request failed:", error);
    return NextResponse.json(
      { error: "Failed to issue realtime token" },
      { status: 500 }
    );
  }
}
