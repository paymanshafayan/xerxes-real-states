import { NextRequest, NextResponse } from "next/server";
import { findLocalApk, isValidApkName } from "@/lib/appStorage";
import { streamApkFile } from "@/lib/apkDownload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves customer/staff APK files published via Admin → App Downloads.
 *
 * When R2 is not configured, packages are written to the persistent volume
 * (`public/downloads/apps/<app>/<file>` — mounted at `/app/public/downloads`
 * in production) so they survive redeploys. This route keeps the stable
 * `/uploads/apps/<app>/<file>` URL scheme so previously saved download links
 * keep working, and falls back to the legacy `public/uploads/apps` location
 * for any older files still on disk.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path ?? [];
  const [app, filename, ...extra] = segments;

  if (
    (app !== "client" && app !== "staff") ||
    !filename ||
    extra.length > 0 ||
    !isValidApkName(filename)
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const filePath = await findLocalApk(app, filename);
  if (!filePath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    return await streamApkFile(request, filePath, `${app}-xerxes.apk`);
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
