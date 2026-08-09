import { randomUUID } from "crypto";
import { isR2Configured, publicMediaBase } from "./storage";

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";

function requireR2PublicDelivery() {
  if (!isR2Configured() || !process.env.R2_PUBLIC_URL) {
    throw new Error("Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL.");
  }
}

async function r2Client() {
  requireR2PublicDelivery();
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  });
}

/** Store a public, signed Android package in R2. Never falls back to the deploy filesystem. */
export async function uploadAppApk(file: File, app: "client" | "staff") {
  const client = await r2Client();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const key = `apps/${app}/${Date.now()}-${randomUUID().slice(0, 8)}.apk`;
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!, Key: key, Body: Buffer.from(await file.arrayBuffer()),
    ContentType: APK_CONTENT_TYPE,
    ContentDisposition: `attachment; filename="${app}-xerxes.apk"`,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { key, url: `${publicMediaBase()}/${key}`, name: file.name };
}

/** Removes an APK uploaded by the app-downloads manager. */
export async function deleteAppApk(key: string) {
  if (!key.startsWith("apps/client/") && !key.startsWith("apps/staff/")) throw new Error("Invalid app package key.");
  const client = await r2Client();
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
}
