import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { isR2Configured, publicMediaBase } from "./storage";

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";

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
 * otherwise cleanly falls back to local storage (public/uploads/apps/...).
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

  // Fallback to local filesystem when R2 is not configured
  const uploadDir = path.join(process.cwd(), "public", "uploads", "apps", app);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
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
    try {
      const filePath = path.join(process.cwd(), "public", "uploads", key);
      await unlink(filePath);
    } catch {
      // Ignore if file is already missing
    }
  }
}
