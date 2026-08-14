import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { persistPublishedApkAndCleanup } from "@/lib/appDownloadConfigServer";
import {
  AppKind,
  MAX_APK_BYTES,
  isAppKind,
  isApkOriginalName,
  normalizeApkOriginalName,
  uploadAppApk,
  deleteAppApk,
} from "@/lib/appStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function errorResponse(
  status: number,
  error: string,
  code = "APK_UPLOAD_FAILED",
  details?: unknown
) {
  return NextResponse.json(
    {
      error,
      code,
      status,
      ...(details === undefined ? {} : { details }),
    },
    { status }
  );
}

function queryValue(request: NextRequest, key: string): string {
  return request.nextUrl.searchParams.get(key)?.trim() || "";
}

function validateFileName(fileName: string): string {
  const normalized = normalizeApkOriginalName(fileName);
  if (!normalized || !isApkOriginalName(normalized)) {
    throw new Error("Only .apk files are allowed.");
  }
  return normalized;
}

/**
 * Whole-file compatibility endpoint. New clients use the chunk/finalize
 * endpoints below this route; this endpoint remains compatible with the old
 * multipart uploader and with raw/base64 scripts.
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (/^multipart\/form-data(?:\s*;|$)/i.test(contentType)) {
      const formData = await request.formData();
      const appValue = formData.get("app");
      const file = formData.get("file");
      const entries = [...formData.keys()];
      const appValues = formData.getAll("app");
      const fileValues = formData.getAll("file");
      if (
        appValues.length !== 1 ||
        fileValues.length !== 1 ||
        !isAppKind(appValue) ||
        !(file instanceof File) ||
        entries.some((entry) => entry !== "app" && entry !== "file")
      ) {
        return errorResponse(
          400,
          "Exactly one APK file and its app kind are required.",
          "INVALID_APK_FORM"
        );
      }

      const originalName = normalizeApkOriginalName(file.name);
      if (!isApkOriginalName(originalName)) {
        return errorResponse(
          400,
          "Only .apk files are allowed.",
          "INVALID_APK_FILE"
        );
      }
      if (file.size < 1) {
        return errorResponse(400, "Empty APK file.", "EMPTY_APK_FILE");
      }
      if (file.size > MAX_APK_BYTES) {
        return errorResponse(413, "APK file is too large.", "APK_TOO_LARGE");
      }

      const result = await uploadAppApk(file, appValue);
      const config = await persistPublishedApkAndCleanup(appValue, result);
      return NextResponse.json({ success: true, ...result, config });
    }

    // Backward compatibility for the reference implementation's raw whole
    // file endpoint and older cached clients that send base64 JSON.
    const appFromQuery = queryValue(request, "app");
    const fileNameFromQuery = queryValue(request, "fileName");
    const raw = Buffer.from(await request.arrayBuffer());
    if (raw.length === 0) {
      return errorResponse(400, "APK file data is missing.", "EMPTY_APK_FILE");
    }

    let buffer = raw;
    let app = appFromQuery;
    let originalName = fileNameFromQuery;
    if (contentType.toLowerCase().includes("application/json")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw.toString("utf8"));
      } catch {
        return errorResponse(400, "Invalid APK upload payload.", "APK_BODY_PARSE_ERROR");
      }
      if (!parsed || typeof parsed !== "object") {
        return errorResponse(400, "Invalid APK upload payload.", "APK_BODY_PARSE_ERROR");
      }
      const body = parsed as Record<string, unknown>;
      app = typeof body.app === "string" ? body.app.trim() : app;
      originalName = typeof body.fileName === "string" ? body.fileName.trim() : originalName;
      const encoded = typeof body.dataBase64 === "string" ? body.dataBase64 : "";
      if (!encoded) return errorResponse(400, "Missing APK file data.", "EMPTY_APK_FILE");
      const base64 = encoded.includes(",") ? encoded.split(",").pop() || "" : encoded;
      try {
        buffer = Buffer.from(base64, "base64");
      } catch {
        return errorResponse(400, "Invalid APK base64 data.", "APK_BODY_PARSE_ERROR");
      }
    }

    if (!isAppKind(app)) {
      return errorResponse(400, "A customer or staff app is required.", "INVALID_APK_APP");
    }
    if (buffer.length < 1) {
      return errorResponse(400, "Empty APK file.", "EMPTY_APK_FILE");
    }
    if (buffer.length > MAX_APK_BYTES) {
      return errorResponse(413, "APK file is too large.", "APK_TOO_LARGE");
    }

    let safeName = "app.apk";
    if (originalName) {
      try {
        safeName = validateFileName(originalName);
      } catch {
        return errorResponse(400, "Only .apk files are allowed.", "INVALID_APK_FILE");
      }
    }

    const file = new File([buffer], safeName, { type: "application/vnd.android.package-archive" });
    const result = await uploadAppApk(file, app as AppKind);
    const config = await persistPublishedApkAndCleanup(app, result);
    return NextResponse.json({ success: true, ...result, config });
  } catch (error: any) {
    const status = Number(error?.status || error?.statusCode || error?.httpCode) === 413 ? 413 : 500;
    const message = status === 413 ? "APK file is too large." : "Failed to store APK.";
    console.error("APK upload failed:", error);
    return errorResponse(
      status,
      message,
      status === 413 ? "APK_TOO_LARGE" : "APK_UPLOAD_FAILED",
      process.env.NODE_ENV === "production" ? undefined : error instanceof Error ? error.message : String(error)
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    if (!body || typeof body.key !== "string") {
      return errorResponse(400, "APK key is required.", "INVALID_APK_KEY");
    }
    await deleteAppApk(body.key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("APK deletion failed:", error);
    return errorResponse(
      400,
      error instanceof Error ? error.message : "APK deletion failed.",
      "APK_DELETE_FAILED"
    );
  }
}
