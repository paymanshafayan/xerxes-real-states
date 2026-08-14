import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { findLocalApk, isValidApkName } from "@/lib/appStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";

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
  _request: NextRequest,
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
    const fileStat = await stat(/*turbopackIgnore: true*/ filePath);
    // Convert the Node stream to a web ReadableStream (the correct Response
    // body type) — returning a raw Node Readable can trip dev servers.
    const stream = Readable.toWeb(createReadStream(/*turbopackIgnore: true*/ filePath)) as unknown as BodyInit;
    return new Response(stream, {
      headers: {
        "Content-Type": APK_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${app}-xerxes.apk"`,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
