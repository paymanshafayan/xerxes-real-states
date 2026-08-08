import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  const stats = cache.getStats();
  return NextResponse.json(stats);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  const url = new URL(request.url);
  const pattern = url.searchParams.get("pattern");

  if (pattern) {
    const count = await cache.delPattern(pattern);
    return NextResponse.json({ success: true, deleted: count });
  }

  await cache.flush();
  return NextResponse.json({ success: true, message: "Cache flushed" });
}
