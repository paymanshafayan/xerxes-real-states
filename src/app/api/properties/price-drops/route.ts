import { NextRequest, NextResponse } from "next/server";
import { getPriceDrops } from "@/lib/data/dataProvider";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit")) || 20;
    const drops = await getPriceDrops(Math.min(limit, 50));
    return NextResponse.json({ properties: drops });
  } catch (error) {
    console.error("Failed to fetch price drops:", error);
    return NextResponse.json({ properties: [] });
  }
}
