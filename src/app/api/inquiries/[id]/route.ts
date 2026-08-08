import { NextRequest, NextResponse } from "next/server";
import { updateInquiryStatus } from "@/lib/data/dataProvider";
import { requireStaff } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const { status } = await request.json();
    await updateInquiryStatus(Number(id), status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update inquiry:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
