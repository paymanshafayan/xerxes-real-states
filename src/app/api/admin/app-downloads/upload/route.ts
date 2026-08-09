import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { deleteAppApk, uploadAppApk } from "@/lib/appStorage";

const MAX_APK_BYTES = 200 * 1024 * 1024;

/** Store customer/staff APKs in the configured public Cloudflare R2 bucket. */
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
    return NextResponse.json(await uploadAppApk(file, app));
  } catch (error) {
    const message = error instanceof Error ? error.message : "APK upload failed.";
    console.error("APK upload failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { key } = await request.json();
    if (typeof key !== "string") return NextResponse.json({ error: "APK key is required." }, { status: 400 });
    await deleteAppApk(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "APK deletion failed.";
    console.error("APK deletion failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
