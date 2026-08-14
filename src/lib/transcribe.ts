import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Transcribe an audio file to text (speech-to-text).
 * Uses OpenAI Whisper when OPENAI_API_KEY is set; otherwise returns "".
 *
 * Accepts a Buffer + mime type. Saves to a temp file and POSTs to the
 * audio transcriptions endpoint (multipart/form-data).
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  originalName = "audio.webm"
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (!apiKey) return ""; // dev fallback: no transcription

  const ext = originalName.includes(".")
    ? originalName.split(".").pop()
    : mimeType.includes("mp4")
    ? "mp4"
    : "webm";
  const tmpDir = path.join(/*turbopackIgnore: true*/ process.cwd(), ".tmp");
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `${randomUUID()}.${ext}`);
  await writeFile(tmpPath, buffer);

  try {
    const FormData = (await import("form-data")).default;
    const fs = await import("fs");
    const fd = new FormData();
    fd.append("file", fs.createReadStream(tmpPath));
    fd.append("model", process.env.OPENAI_STT_MODEL || "whisper-1");
    fd.append("response_format", "json");

    const res = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, ...fd.getHeaders() },
      body: fd as unknown as BodyInit,
    });
    const data = await res.json();
    return data?.text?.trim() || "";
  } catch (err) {
    console.error("Transcribe failed:", err);
    return "";
  } finally {
    try {
      const fs = await import("fs");
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}
