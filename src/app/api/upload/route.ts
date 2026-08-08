import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { logActivity } from "@/lib/activityLog";
import { getStaff, requireStaff } from "@/lib/auth/session";
import {
  saveFileLocally,
  mediaTypeFromMime,
  type MediaType,
} from "@/lib/storage";

const MAX_BYTES: Record<MediaType, number> = {
  image: 10 * 1024 * 1024,
  panorama: 15 * 1024 * 1024,
  video: 250 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  document: 20 * 1024 * 1024,
};

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const staff = await getStaff(request);
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const kind = (formData.get("kind") as MediaType) || "image";
    const propertyId = formData.get("propertyId")
      ? Number(formData.get("propertyId"))
      : null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploaded: {
      url: string;
      filename: string;
      originalName: string;
      size: number;
      type: MediaType;
    }[] = [];

    for (const file of files) {
      const type = mediaTypeFromMime(file.type, kind);
      if (file.size > MAX_BYTES[type]) {
        continue; // skip oversized
      }
      const saved = await saveFileLocally(file, type);
      try {
        await db.insert(media).values({
          filename: saved.filename,
          originalName: saved.originalName,
          mimeType: saved.mimeType,
          size: saved.size,
          url: saved.url,
          type: saved.type,
          propertyId,
          uploadedById: staff?.id || null,
        });
      } catch {
        // media table might not exist yet; ignore
      }
      uploaded.push({
        url: saved.url,
        filename: saved.filename,
        originalName: saved.originalName,
        size: saved.size,
        type: saved.type,
      });
    }

    if (uploaded.length > 0) {
      await logActivity({
        action: "create",
        entity: "property",
        entityId: propertyId || undefined,
        details: `Uploaded ${uploaded.length} media: ${uploaded
          .map((u) => u.originalName)
          .join(", ")}`,
        userName: staff?.username || "anonymous",
      });
    }

    return NextResponse.json({
      success: true,
      files: uploaded,
      urls: uploaded.map((u) => u.url),
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
