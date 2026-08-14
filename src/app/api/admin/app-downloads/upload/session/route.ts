import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { ApkUploadHttpError, cancelApkUpload } from "@/lib/apkUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() || "";
    await cancelApkUpload(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApkUploadHttpError) {
      return NextResponse.json(
        { error: error.message, code: error.code, status: error.status },
        { status: error.status }
      );
    }
    console.error("APK session cancellation failed:", error);
    return NextResponse.json(
      { error: "Failed to cancel APK upload session.", code: "APK_CANCEL_FAILED" },
      { status: 500 }
    );
  }
}
