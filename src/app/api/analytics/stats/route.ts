import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageViews } from "@/db/schema";
import { sql, desc, gte } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total views
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews);

    // Last 24h views
    const last24hResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(gte(pageViews.createdAt, last24h));

    // Last 7 days views
    const last7dResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(gte(pageViews.createdAt, last7d));

    // Most visited pages
    const topPages = await db
      .select({
        path: pageViews.path,
        views: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(gte(pageViews.createdAt, last30d))
      .groupBy(pageViews.path)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Most viewed properties
    const topProperties = await db
      .select({
        propertyId: pageViews.propertyId,
        views: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(sql`${pageViews.propertyId} IS NOT NULL`)
      .groupBy(pageViews.propertyId)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Unique sessions
    const uniqueSessions = await db
      .select({ count: sql<number>`count(DISTINCT ${pageViews.sessionId})` })
      .from(pageViews)
      .where(gte(pageViews.createdAt, last30d));

    return NextResponse.json({
      totalViews: Number(totalResult[0].count),
      last24h: Number(last24hResult[0].count),
      last7d: Number(last7dResult[0].count),
      uniqueVisitors: Number(uniqueSessions[0].count),
      topPages: topPages.map((p) => ({ path: p.path, views: Number(p.views) })),
      topProperties: topProperties.map((p) => ({
        propertyId: p.propertyId,
        views: Number(p.views),
      })),
    });
  } catch (error) {
    console.error("Failed to get analytics:", error);
    return NextResponse.json({
      totalViews: 0, last24h: 0, last7d: 0, uniqueVisitors: 0,
      topPages: [], topProperties: [],
    });
  }
}
