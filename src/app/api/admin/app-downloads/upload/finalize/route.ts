import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { persistPublishedApkAndCleanup } from "@/lib/appDownloadConfigServer";
import { ApkUploadHttpError, finalizeApkUpload } from "@/lib/apkUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function responseForError(error: unknown) {
  if (error instanceof ApkUploadHttpError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        status: error.status,
        ...(error.details || {}),
      },
      { status: error.status }
    );
  }
  console.error("APK finalize failed:", error);
  return NextResponse.json(
    {
      error: "Failed to finalize APK upload.",
      code: "APK_FINALIZE_FAILED",
      status: 500,
      ...(process.env.NODE_ENV === "production"
        ? {}
        : { details: error instanceof Error ? error.message : String(error) }),
    },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const app = typeof body?.app === "string" ? body.app.trim() : "";
    const result = await finalizeApkUpload({
      sessionId: typeof body?.sessionId === "string" ? body.sessionId.trim() : "",
      app,
      fileName: typeof body?.fileName === "string" ? body.fileName.trim() : undefined,
    });
    const config = await persistPublishedApkAndCleanup(app, result);
    return NextResponse.json({ ...result, config });
  } catch (error) {
    return responseForError(error);
  }
}
