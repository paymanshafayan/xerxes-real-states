import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentDataSource,
  setDataSource,
  seedDatabaseFromSample,
} from "@/lib/data/dataProvider";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const dataSource = await getCurrentDataSource();
    return NextResponse.json({ dataSource });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json({ dataSource: "sample" });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const { dataSource, seedData } = body;

    if (dataSource) {
      await setDataSource(dataSource);
    }

    if (seedData) {
      await seedDatabaseFromSample();
    }

    const current = await getCurrentDataSource();
    return NextResponse.json({ success: true, dataSource: current });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
