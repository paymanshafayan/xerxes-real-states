import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import { getCustomerDownloadConfig, resolveLocalApkReference } from "@/lib/appDownloadServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public metadata endpoint used by mobile/web clients and download pages. */
export async function GET() {
  try {
    const config = await getCustomerDownloadConfig();
    const local = await resolveLocalApkReference(config.apkUrl);
    let size = config.apkSize || 0;
    let uploadedAt = config.apkUploadedAt || "";
    if (local) {
      const info = await stat(/*turbopackIgnore: true*/ local.filePath).catch(() => null);
      size = info?.size || size;
      uploadedAt = uploadedAt || (info?.mtime.toISOString() || "");
    }

    return NextResponse.json({
      apkAvailable: Boolean(config.apkUrl),
      apkFileName: config.apkName || "xerxes-app.apk",
      apkSize: size,
      apkUploadedAt: uploadedAt,
      directDownloadUrl: "/api/mobile-app/download",
      storeLinks: config.stores,
    });
  } catch (error) {
    console.error("Failed to load mobile app config:", error);
    return NextResponse.json({
      apkAvailable: false,
      directDownloadUrl: "/api/mobile-app/download",
      storeLinks: [],
    });
  }
}
