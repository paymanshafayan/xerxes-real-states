import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { appendApkChunk, ApkUploadHttpError } from "@/lib/apkUpload";
import { APK_CHUNK_MAX_BYTES } from "@/lib/appStorage";

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
  console.error("APK chunk upload failed:", error);
  return NextResponse.json(
    {
      error: "Failed to store APK chunk.",
      code: "APK_CHUNK_WRITE_FAILED",
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
    const params = request.nextUrl.searchParams;
    const sessionId = params.get("sessionId")?.trim() || "";
    const app = params.get("app")?.trim() || "";
    const fileName = params.get("fileName")?.trim() || "";
    const index = Number(params.get("index") || "");
    const totalSize = Number(params.get("totalSize") || "");

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > APK_CHUNK_MAX_BYTES) {
      return NextResponse.json(
        {
          error: "APK chunk is too large.",
          code: "APK_CHUNK_TOO_LARGE",
          status: 413,
        },
        { status: 413 }
      );
    }

    const chunk = Buffer.from(await request.arrayBuffer());
    const result = await appendApkChunk({
      sessionId,
      app,
      fileName,
      index,
      totalSize,
      chunk,
    });
    return NextResponse.json(result);
  } catch (error) {
    return responseForError(error);
  }
}
