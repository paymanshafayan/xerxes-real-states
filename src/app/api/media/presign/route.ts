import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { getPresignedUploadUrl, type MediaType } from "@/lib/storage";

// POST - request a direct-to-storage upload URL (mobile optimised, R2).
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { filename, contentType, type } = await request.json();
    if (!filename || !contentType || !type) {
      return NextResponse.json(
        { error: "filename, contentType and type are required" },
        { status: 400 }
      );
    }
    const result = await getPresignedUploadUrl({
      filename,
      contentType,
      type: type as MediaType,
    });
    if (!result) {
      return NextResponse.json(
        {
          error:
            "Direct upload not configured. Use multipart POST to /api/upload instead.",
        },
        { status: 501 }
      );
    }
    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      key: result.key,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
