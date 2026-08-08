import { NextRequest, NextResponse } from "next/server";
import { getActivityLogs, getActivityLogCount } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = Number(url.searchParams.get("offset")) || 0;

    const [logs, total] = await Promise.all([
      getActivityLogs(limit, offset),
      getActivityLogCount(),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json({ logs: [], total: 0 });
  }
}
