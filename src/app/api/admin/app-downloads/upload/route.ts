import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireStaff } from "@/lib/auth/session";

const MAX_APK_BYTES = 200 * 1024 * 1024;

/** Upload a signed Android APK for either the customer or staff distribution.
 * Files are stored in the deployment's public uploads directory. For durable
 * production delivery, mount persistent storage or use the configured object store.
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const app = formData.get("app");
    const file = formData.get("file");
    if ((app !== "client" && app !== "staff") || !(file instanceof File)) {
      return NextResponse.json({ error: "A customer or staff APK file is required." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".apk") || file.size === 0 || file.size > MAX_APK_BYTES) {
      return NextResponse.json({ error: "Upload a valid APK no larger than 200 MB." }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "uploads", "apps");
    await mkdir(dir, { recursive: true });
    const filename = `${app}-${Date.now()}-${randomUUID().slice(0, 8)}.apk`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/apps/${filename}`, name: file.name });
  } catch (error) {
    console.error("APK upload failed", error);
    return NextResponse.json({ error: "APK upload failed." }, { status: 500 });
  }
}
