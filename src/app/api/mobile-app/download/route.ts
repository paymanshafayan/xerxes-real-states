import { NextRequest, NextResponse } from "next/server";
import { getCustomerDownloadConfig, resolveLocalApkReference } from "@/lib/appDownloadServer";
import { streamApkFile } from "@/lib/apkDownload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stable customer download endpoint. It resolves the current config on every
 * request, streams local volume files safely, and redirects to a configured
 * public R2/CDN URL when object storage is in use.
 */
export async function GET(request: NextRequest) {
  try {
    const config = await getCustomerDownloadConfig();
    if (!config.apkUrl) {
      return NextResponse.json(
        { error: "The APK has not been uploaded yet." },
        { status: 404 }
      );
    }

    const local = await resolveLocalApkReference(config.apkUrl);
    if (local) {
      return streamApkFile(request, local.filePath, "xerxes-app.apk");
    }

    // External URLs are deliberately redirected rather than fetched through
    // the app server, preserving the CDN's range/streaming behaviour.
    const target = new URL(config.apkUrl, request.url);
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid APK download URL." }, { status: 404 });
    }
    return NextResponse.redirect(target, 302);
  } catch (error) {
    console.error("APK download failed:", error);
    return NextResponse.json(
      { error: "The APK file could not be downloaded." },
      { status: 404 }
    );
  }
}
