import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";

/**
 * Stream an APK with the same attachment semantics as Express res.download,
 * including byte ranges so an interrupted large download can resume.
 */
export async function streamApkFile(
  request: Request,
  filePath: string,
  downloadName: string
): Promise<Response> {
  const fileInfo = await stat(/*turbopackIgnore: true*/ filePath);
  const range = request.headers.get("range");
  let start = 0;
  let end = fileInfo.size - 1;
  let status = 200;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    if (!match) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileInfo.size}` },
      });
    }
    if (match[1]) start = Number(match[1]);
    if (match[2]) end = Number(match[2]);
    else if (match[1]) end = fileInfo.size - 1;
    if (!match[1] && match[2]) {
      const suffixLength = Number(match[2]);
      start = Math.max(fileInfo.size - suffixLength, 0);
      end = fileInfo.size - 1;
    }
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      end < start ||
      start >= fileInfo.size
    ) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileInfo.size}` },
      });
    }
    end = Math.min(end, fileInfo.size - 1);
    status = 206;
  }

  const length = end - start + 1;
  const stream = Readable.toWeb(
    createReadStream(/*turbopackIgnore: true*/ filePath, { start, end })
  ) as unknown as BodyInit;
  return new Response(stream, {
    status,
    headers: {
      "Content-Type": APK_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": String(length),
      "Accept-Ranges": "bytes",
      ...(status === 206
        ? { "Content-Range": `bytes ${start}-${end}/${fileInfo.size}` }
        : {}),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
