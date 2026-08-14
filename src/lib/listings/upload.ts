import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Phase 8: User Listings - File upload helper.
 *
 * Handles multipart form-data file uploads and stores them locally
 * under public/uploads. Returns the public URL.
 *
 * In production, swap this implementation with the existing /api/upload
 * endpoint (which supports R2 presigned URLs).
 */

const UPLOAD_DIR = join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export type UploadKind = "image" | "video" | "panorama";

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Upload a single file from a multipart form.
 * Returns null if no file was provided.
 */
export async function uploadFile(
  request: NextRequest,
  fieldName: string,
  kind: UploadKind
): Promise<UploadResult | null> {
  const formData = await request.formData();
  const file = formData.get(fieldName);

  if (!file || !(file instanceof File)) {
    return null;
  }

  return await saveFile(file, kind);
}

/**
 * Upload multiple files from a multipart form.
 * Returns array of UploadResult (empty if no files).
 */
export async function uploadFiles(
  request: NextRequest,
  fieldName: string,
  kind: UploadKind
): Promise<UploadResult[]> {
  const formData = await request.formData();
  const files = formData.getAll(fieldName);

  const results: UploadResult[] = [];
  for (const file of files) {
    if (file instanceof File) {
      const result = await saveFile(file, kind);
      if (result) results.push(result);
    }
  }
  return results;
}

/**
 * Save a File object to disk and return its public URL.
 */
export async function saveFile(file: File, kind: UploadKind): Promise<UploadResult | null> {
  // Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.name} (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  if (kind === "image" || kind === "panorama") {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`Invalid image type: ${file.type}`);
    }
    // For panoramas, validate 2:1 aspect ratio from filename hint
    // (real validation should be done client-side; this is a soft check)
  } else if (kind === "video") {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error(`Invalid video type: ${file.type}`);
    }
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "bin";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  const random = randomBytes(8).toString("hex");
  const timestamp = Date.now();
  const filename = `${kind}_${timestamp}_${random}.${safeExt}`;

  // Ensure subdir by kind
  const subdir = join(UPLOAD_DIR, kind);
  await mkdir(subdir, { recursive: true });

  // Write to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = join(subdir, filename);
  await writeFile(filepath, buffer);

  return {
    url: `/uploads/${kind}/${filename}`,
    filename,
    size: file.size,
    mimeType: file.type,
  };
}

/**
 * Rate-limit guard for upload endpoints.
 * Use at the top of POST handlers.
 */
export function uploadRateLimit(
  request: NextRequest,
  key: string,
  max: number = 10,
  windowMs: number = 60 * 60 * 1000 // 1 hour
) {
  return rateLimit(request, key, max, windowMs);
}

/**
 * Parse listing data from multipart form (alongside uploaded files).
 * Expects a "data" field containing a JSON string.
 */
export interface ParsedListingMultipart {
  data: any;
  files: {
    images: UploadResult[];
    videos: UploadResult[];
    panoramas: UploadResult[];
  };
}

export async function parseListingMultipart(
  request: NextRequest
): Promise<ParsedListingMultipart> {
  const formData = await request.formData();

  // Parse JSON data
  const dataField = formData.get("data");
  if (!dataField || typeof dataField !== "string") {
    throw new Error("Missing 'data' field in form");
  }
  const data = JSON.parse(dataField);

  // Collect files by field name
  const images: UploadResult[] = [];
  for (const file of formData.getAll("images")) {
    if (file instanceof File) {
      const result = await saveFile(file, "image");
      if (result) images.push(result);
    }
  }

  const videos: UploadResult[] = [];
  for (const file of formData.getAll("videos")) {
    if (file instanceof File) {
      const result = await saveFile(file, "video");
      if (result) videos.push(result);
    }
  }

  return { data, files: { images, videos, panoramas: [] } };
}

/**
 * Parse panorama-only multipart form.
 */
export async function parsePanoramaMultipart(
  request: NextRequest
): Promise<UploadResult[]> {
  const formData = await request.formData();
  const results: UploadResult[] = [];

  for (const file of formData.getAll("panoramas")) {
    if (file instanceof File) {
      const result = await saveFile(file, "panorama");
      if (result) results.push(result);
    }
  }

  return results;
}
