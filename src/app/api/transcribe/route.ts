import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/transcribe";
import { getStaff } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";

// POST multipart/form-data with field "audio" (the recorded voice note)
export async function POST(request: NextRequest) {
  const auth = await getStaff(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = rateLimit(request, "transcribe", 20, 60_000);
  if (limited) return limited;
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file) {
      return NextResponse.json({ error: "audio required" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await transcribeAudio(buffer, file.type, file.name);
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({ error: "Transcribe failed" }, { status: 500 });
  }
}
