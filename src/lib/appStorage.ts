import { createReadStream } from "fs";
import { mkdir, rename, rm, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { isR2Configured, publicMediaBase } from "./storage";

export type AppKind = "client" | "staff";

export const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
/** Keep the same limit as the reference implementation. */
export const MAX_APK_BYTES = 160 * 1024 * 1024;
export const APK_CHUNK_MAX_BYTES = 16 * 1024 * 1024;

/**
 * The deployment workflow mounts the persistent volume at public/downloads.
 * Allow an explicit root as well so the same code works in Railway, local
 * development and the desktop/server bundle without changing URL schemes.
 */
const STATIC_ROOT =
  process.env.XERXES_STATIC_ROOT || process.env.BAZINO_STATIC_ROOT || process.cwd();

const LOCAL_APK_ROOT = path.join(
  /*turbopackIgnore: true*/ STATIC_ROOT,
  "public",
  "downloads",
  "apps"
);

/** Location used by the first version of the feature. */
const LEGACY_APK_ROOT = path.join(
  /*turbopackIgnore: true*/ STATIC_ROOT,
  "public",
  "uploads",
  "apps"
);

export function isAppKind(value: unknown): value is AppKind {
  return value === "client" || value === "staff";
}

/**
 * Only generated-style names are used as disk names. User supplied filenames
 * are metadata only and can therefore never become a path component.
 */
export function isValidApkName(filename: string): boolean {
  return (
    typeof filename === "string" &&
    filename.length > 0 &&
    filename.length <= 120 &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.apk$/i.test(filename)
  );
}

/** Remove browser supplied path components before storing the original name. */
export function normalizeApkOriginalName(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const basename = raw.replace(/\\/g, "/").split("/").pop()?.trim() || "";
  return basename.slice(0, 255);
}

export function isApkOriginalName(value: unknown): value is string {
  const name = normalizeApkOriginalName(value);
  return name.length > 0 && name.toLowerCase().endsWith(".apk");
}

export function getLocalApkRoot(): string {
  return LOCAL_APK_ROOT;
}

export function getLocalApkDir(app: AppKind): string {
  return path.join(/*turbopackIgnore: true*/ LOCAL_APK_ROOT, app);
}

export function getLocalApkPath(app: AppKind, filename: string): string {
  return path.join(/*turbopackIgnore: true*/ getLocalApkDir(app), filename);
}

export function getLegacyApkPath(app: AppKind, filename: string): string {
  return path.join(/*turbopackIgnore: true*/ LEGACY_APK_ROOT, app, filename);
}

/**
 * Find a local APK in the volume-backed location first, then in the legacy
 * location. The strict app/name validation makes this safe against traversal.
 */
export async function findLocalApk(
  app: string,
  filename: string
): Promise<string | null> {
  if (!isAppKind(app) || !isValidApkName(filename)) return null;

  for (const candidate of [
    getLocalApkPath(app, filename),
    getLegacyApkPath(app, filename),
  ]) {
    try {
      const info = await stat(/*turbopackIgnore: true*/ candidate);
      if (info.isFile()) return candidate;
    } catch {
      // Try the next storage location.
    }
  }
  return null;
}

function hasPublicR2(): boolean {
  return isR2Configured() && Boolean(process.env.R2_PUBLIC_URL);
}

async function r2Client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function apkKey(app: AppKind, filename: string): string {
  return `apps/${app}/${filename}`;
}

function localResult(
  app: AppKind,
  filename: string,
  originalName: string,
  size: number
) {
  return {
    key: apkKey(app, filename),
    url: `/uploads/apps/${app}/${filename}`,
    name: originalName || filename,
    size,
  };
}

async function putApkInR2(
  app: AppKind,
  filename: string,
  originalName: string,
  source: Buffer | string,
  size: number
) {
  const client = await r2Client();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const body = typeof source === "string"
    ? createReadStream(/*turbopackIgnore: true*/ source)
    : source;
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: apkKey(app, filename),
      Body: body,
      ContentLength: size,
      ContentType: APK_CONTENT_TYPE,
      ContentDisposition: `attachment; filename="${app}-xerxes.apk"`,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    key: apkKey(app, filename),
    url: `${publicMediaBase()}/${apkKey(app, filename)}`,
    name: originalName || filename,
    size,
  };
}

async function writeLocalApkAtomically(
  app: AppKind,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const directory = getLocalApkDir(app);
  await mkdir(directory, { recursive: true });
  const temporaryPath = path.join(
    /*turbopackIgnore: true*/ directory,
    `.${filename}.${randomUUID()}.tmp`
  );
  try {
    await writeFile(/*turbopackIgnore: true*/ temporaryPath, buffer);
    await rename(
      /*turbopackIgnore: true*/ temporaryPath,
      /*turbopackIgnore: true*/ getLocalApkPath(app, filename)
    );
    return getLocalApkPath(app, filename);
  } catch (error) {
    await rm(/*turbopackIgnore: true*/ temporaryPath, { force: true }).catch(
      () => undefined
    );
    throw error;
  }
}

/**
 * Publish an already complete local file. Chunked uploads use this helper so
 * the final rename happens before the file becomes downloadable. If R2 is
 * configured, a streaming PutObject is attempted; a temporary R2 outage
 * falls back to the persistent local file instead of producing a dead link.
 */
export async function publishLocalApkFile(params: {
  app: AppKind;
  filename: string;
  originalName: string;
  filePath: string;
  size?: number;
}) {
  const { app, filename, originalName, filePath } = params;
  if (!isValidApkName(filename)) throw new Error("Invalid generated APK filename.");

  const fileInfo = await stat(/*turbopackIgnore: true*/ filePath);
  const size = params.size ?? fileInfo.size;
  if (size < 1 || size > MAX_APK_BYTES) {
    throw new Error("APK file size is outside the allowed range.");
  }

  if (hasPublicR2()) {
    try {
      const result = await putApkInR2(app, filename, originalName, filePath, size);
      // The R2 object is now the public copy. Do not leave a second large copy
      // on the volume, but best-effort cleanup must never turn success into an
      // error.
      await rm(/*turbopackIgnore: true*/ filePath, { force: true }).catch(
        () => undefined
      );
      return result;
    } catch (error) {
      console.warn("R2 APK publish failed; keeping the local APK fallback:", error);
    }
  }

  return localResult(app, filename, originalName, size);
}

/**
 * Store a whole-file/multipart upload. The browser normally uses the chunked
 * endpoints below, but this remains intentionally compatible with older
 * clients and scripts that POST one multipart or raw request.
 */
export async function uploadAppApk(file: File, app: AppKind) {
  const originalName = normalizeApkOriginalName(file.name) || "app.apk";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.apk`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 1) throw new Error("Empty APK file.");
  if (buffer.length > MAX_APK_BYTES) throw new Error("APK file is too large.");

  if (hasPublicR2()) {
    try {
      return await putApkInR2(app, filename, originalName, buffer, buffer.length);
    } catch (error) {
      console.warn("R2 APK upload failed; falling back to local storage:", error);
    }
  }

  const filePath = await writeLocalApkAtomically(app, filename, buffer);
  return localResult(app, filename, originalName, (await stat(filePath)).size);
}

/** Removes an APK uploaded by the app-downloads manager (best effort on disk/R2). */
export async function deleteAppApk(key: string) {
  const match = /^apps\/(client|staff)\/([a-zA-Z0-9][a-zA-Z0-9._-]*\.apk)$/i.exec(
    key
  );
  if (!match || !isValidApkName(match[2])) {
    throw new Error("Invalid app package key.");
  }
  const app = match[1] as AppKind;
  const filename = match[2];

  if (hasPublicR2()) {
    try {
      const client = await r2Client();
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await client.send(
        new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key })
      );
    } catch (error) {
      console.warn("Failed to delete APK from R2:", error);
    }
  }

  // Always clean local copies too. This matters when an R2 publish temporarily
  // failed and the returned URL is the local fallback.
  for (const candidate of [
    getLocalApkPath(app, filename),
    getLegacyApkPath(app, filename),
  ]) {
    await unlink(/*turbopackIgnore: true*/ candidate).catch(() => undefined);
  }
}
