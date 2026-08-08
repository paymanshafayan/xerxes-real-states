import { NextRequest, NextResponse } from "next/server";
import {
  getPropertyCount,
  getInquiryCount,
  getNewInquiryCount,
  getAgents,
  getCurrentDataSource,
} from "@/lib/data/dataProvider";
import { requireStaff } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const [propertyCount, inquiryCount, newInquiryCount, agentsList, dataSource] =
      await Promise.all([
        getPropertyCount(),
        getInquiryCount(),
        getNewInquiryCount(),
        getAgents(),
        getCurrentDataSource(),
      ]);

    return NextResponse.json({
      properties: propertyCount,
      inquiries: inquiryCount,
      newInquiries: newInquiryCount,
      agents: agentsList.length,
      dataSource,
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
