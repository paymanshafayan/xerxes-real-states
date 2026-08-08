import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type MediaType = "image" | "panorama" | "video" | "audio" | "document";

export interface SavedMedia {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
}

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "avif", "gif",
  "mp4", "mov", "webm",
  "mp3", "wav", "m4a", "ogg",
  "pdf", "doc", "docx",
]);

function extOf(name: string): string {
  const parts = name.split(".");
  const raw = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  // Strip anything that isn't a plain alphanumeric extension (blocks path
  // separators / traversal sequences smuggled in via the filename) and
  // only allow a fixed whitelist of known-safe media/document extensions.
  const safe = raw.replace(/[^a-z0-9]/g, "");
  return ALLOWED_EXTENSIONS.has(safe) ? safe : "bin";
}

function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

/** Base public URL where media is reachable. */
export function publicMediaBase(): string {
  if (isR2Configured() && process.env.R2_PUBLIC_URL) {
    return process.env.R2_PUBLIC_URL.replace(/\/$/, "");
  }
  // Local dev: served statically from /uploads
  const origin = process.env.NEXT_PUBLIC_APP_URL || "";
  return origin ? `${origin.replace(/\/$/, "")}/uploads` : "/uploads";
}

/**
 * Save a file locally (fallback / dev). Returns a public URL.
 */
export async function saveFileLocally(
  file: File,
  type: MediaType
): Promise<SavedMedia> {
  const uploadDir = LOCAL_UPLOAD_DIR;
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${type}_${Date.now()}-${randomUUID().slice(0, 8)}.${extOf(
    file.name
  )}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);
  return {
    url: `/uploads/${filename}`,
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    type,
  };
}

/**
 * Generate a presigned PUT URL for direct-to-storage upload (mobile friendly).
 * Returns null when R2 is not configured (caller should fall back to /api/upload).
 */
export async function getPresignedUploadUrl(params: {
  filename: string;
  contentType: string;
  type: MediaType;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string } | null> {
  if (!isR2Configured()) return null;
  try {
    // @ts-ignore - optional dependency, only needed when R2 is configured
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    // @ts-ignore - optional dependency
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    const key = `${params.type}/${Date.now()}-${randomUUID().slice(0, 8)}_${
      params.filename
    }`;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: params.contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
    const publicUrl = `${publicMediaBase()}/${key}`;
    return { uploadUrl, publicUrl, key };
  } catch (err) {
    console.error("Presign failed:", err);
    return null;
  }
}

/** Map a mime type to our media classification. */
export function mediaTypeFromMime(mime: string, fallback: MediaType): MediaType {
  // Explicit kinds sent by the client always win (camera docs, 360, etc.)
  if (
    fallback === "panorama" ||
    fallback === "video" ||
    fallback === "audio" ||
    fallback === "document"
  ) {
    return fallback;
  }
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("officedocument")
  )
    return "document";
  return "image";
}
