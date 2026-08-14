import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink, stat } from "fs/promises";
import path from "path";
import { isR2Configured, publicMediaBase } from "./storage";

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";

/**
 * Local (non-R2) APK storage.
 *
 * Production deploys mount a persistent volume at `public/downloads`
 * (Railway: `/app/public/downloads` — see `.github/workflows/deploy.yml`), so
 * packages uploaded here SURVIVE redeploys. Writing to `public/uploads/...`
 * instead used to put files on the container's ephemeral disk, which is wiped
 * on every deploy — the cause of dead download links after an upload.
 *
 * The published URL keeps the stable `/uploads/apps/<app>/<file>` scheme; the
 * download route (`src/app/uploads/apps/[...path]/route.ts`) resolves it to
 * this directory, falling back to the legacy `public/uploads/apps` location.
 */
const LOCAL_APK_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "downloads", "apps");

/** Legacy location used before the volume-backed layout existed. */
const LEGACY_APK_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads", "apps");

/**
 * Only accept plain, generated-style APK filenames — never path separators,
 * traversal sequences, or hidden files.
 */
export function isValidApkName(filename: string): boolean {
  return (
    typeof filename === "string" &&
    filename.length > 0 &&
    filename.length <= 120 &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.apk$/i.test(filename)
  );
}

/**
 * Absolute path of a locally stored APK (volume-backed location first, then
 * the legacy location), or `null` when the file does not exist anywhere.
 */
export async function findLocalApk(
  app: string,
  filename: string
): Promise<string | null> {
  if ((app !== "client" && app !== "staff") || !isValidApkName(filename)) {
    return null;
  }
  for (const base of [LOCAL_APK_DIR, LEGACY_APK_DIR]) {
    const candidate = path.join(/*turbopackIgnore: true*/ base, app, filename);
    try {
      const info = await stat(/*turbopackIgnore: true*/ candidate);
      if (info.isFile()) return candidate;
    } catch {
      // not present in this location — try the next one
    }
  }
  return null;
}

async function r2Client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  });
}

/**
 * Store a public, signed Android package. Uses Cloudflare R2 if configured,
 * otherwise falls back to the persistent local volume (`public/downloads`)
 * so the file survives redeploys.
 */
export async function uploadAppApk(file: File, app: "client" | "staff") {
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.apk`;
  const key = `apps/${app}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isR2Configured() && process.env.R2_PUBLIC_URL) {
    const client = await r2Client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: APK_CONTENT_TYPE,
      ContentDisposition: `attachment; filename="${app}-xerxes.apk"`,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return { key, url: `${publicMediaBase()}/${key}`, name: file.name };
  }

  // Fallback: write to the volume-backed downloads directory. The URL keeps
  // the legacy /uploads/apps/... scheme — the download route serves the file
  // from public/downloads/apps/<app>/ so published links stay stable.
  const uploadDir = path.join(/*turbopackIgnore: true*/ LOCAL_APK_DIR, app);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, filename);
  await writeFile(filePath, buffer);
  return { key, url: `/uploads/apps/${app}/${filename}`, name: file.name };
}

/** Removes an APK uploaded by the app-downloads manager. */
export async function deleteAppApk(key: string) {
  if (!key.startsWith("apps/client/") && !key.startsWith("apps/staff/")) {
    throw new Error("Invalid app package key.");
  }
  if (isR2Configured() && process.env.R2_PUBLIC_URL) {
    try {
      const client = await r2Client();
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
    } catch (err) {
      console.warn("Failed to delete APK from R2:", err);
    }
  } else {
    // Remove from both the volume-backed and legacy locations (best effort).
    const relative = key.replace(/^apps\//, "");
    for (const base of [LOCAL_APK_DIR, LEGACY_APK_DIR]) {
      try {
        const filePath = path.join(/*turbopackIgnore: true*/ base, relative);
        await unlink(filePath);
      } catch {
        // Ignore if file is already missing
      }
    }
  }
}
