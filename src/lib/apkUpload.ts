import { randomUUID } from "crypto";
import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import path from "path";
import {
  APK_CHUNK_MAX_BYTES,
  AppKind,
  MAX_APK_BYTES,
  getLocalApkDir,
  getLocalApkPath,
  getLocalApkRoot,
  isAppKind,
  isApkOriginalName,
  normalizeApkOriginalName,
  publishLocalApkFile,
} from "./appStorage";

const APK_SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const SESSION_PREFIX = ".xerxes-apk-session-";

type ApkUploadSession = {
  sessionId: string;
  app: AppKind;
  fileName: string;
  internalFileName: string;
  totalSize: number;
  received: number;
  expectedIndex: number;
  lastActivity: number;
};

type SessionPaths = {
  metaPath: string;
  partPath: string;
  donePath: string;
};

type CompletedApkUpload = {
  sessionId: string;
  app: AppKind;
  fileName: string;
  completedAt: number;
  result: {
    success: true;
    key: string;
    url: string;
    name: string;
    size: number;
  };
};

/**
 * Route handlers can be bundled separately by Next. Keeping the lock on
 * globalThis makes the sequential/idempotent guarantee apply to all route
 * modules in the same Node process, not just one imported module instance.
 */
type ApkUploadGlobals = typeof globalThis & {
  __xerxesApkUploadLocks?: Map<string, Promise<void>>;
};
const globals = globalThis as ApkUploadGlobals;
const locks = globals.__xerxesApkUploadLocks ?? new Map<string, Promise<void>>();
globals.__xerxesApkUploadLocks = locks;

export type ApkChunkResult = {
  success: true;
  received: number;
  expectedIndex: number;
  totalSize: number;
};

export class ApkUploadHttpError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApkUploadHttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isValidApkSessionId(sessionId: string): boolean {
  return /^[A-Za-z0-9._-]{8,128}$/.test(sessionId);
}

function getSessionRoot(): string {
  return path.join(
    /*turbopackIgnore: true*/ getLocalApkRoot(),
    ".sessions"
  );
}

function getSessionPaths(sessionId: string): SessionPaths {
  // Callers validate the id first. Keeping it in a filename is safe after this
  // check and prevents any `../` path traversal.
  const base = path.join(
    /*turbopackIgnore: true*/ getSessionRoot(),
    `${SESSION_PREFIX}${sessionId}`
  );
  return {
    metaPath: `${base}.json`,
    partPath: `${base}.part`,
    donePath: `${base}.done.json`,
  };
}

async function withSessionLock<T>(
  sessionId: string,
  operation: () => Promise<T>
): Promise<T> {
  const previous = locks.get(sessionId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const current = previous.then(() => gate);
  locks.set(sessionId, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (locks.get(sessionId) === current) locks.delete(sessionId);
  }
}

async function readSession(sessionId: string): Promise<ApkUploadSession | null> {
  const { metaPath } = getSessionPaths(sessionId);
  try {
    const parsed = JSON.parse(
      await readFile(/*turbopackIgnore: true*/ metaPath, "utf8")
    ) as Partial<ApkUploadSession>;
    if (
      parsed.sessionId !== sessionId ||
      !isAppKind(parsed.app) ||
      typeof parsed.fileName !== "string" ||
      typeof parsed.internalFileName !== "string" ||
      typeof parsed.totalSize !== "number" ||
      typeof parsed.received !== "number" ||
      typeof parsed.expectedIndex !== "number"
    ) {
      return null;
    }
    return parsed as ApkUploadSession;
  } catch {
    return null;
  }
}

async function readCompleted(sessionId: string): Promise<CompletedApkUpload | null> {
  const { donePath } = getSessionPaths(sessionId);
  try {
    const parsed = JSON.parse(
      await readFile(/*turbopackIgnore: true*/ donePath, "utf8")
    ) as Partial<CompletedApkUpload>;
    if (
      parsed.sessionId !== sessionId ||
      !isAppKind(parsed.app) ||
      typeof parsed.fileName !== "string" ||
      typeof parsed.completedAt !== "number" ||
      !parsed.result ||
      parsed.result.success !== true ||
      typeof parsed.result.key !== "string" ||
      typeof parsed.result.url !== "string" ||
      typeof parsed.result.name !== "string" ||
      typeof parsed.result.size !== "number"
    ) {
      return null;
    }
    return parsed as CompletedApkUpload;
  } catch {
    return null;
  }
}

async function writeCompleted(completed: CompletedApkUpload): Promise<void> {
  const { donePath } = getSessionPaths(completed.sessionId);
  await mkdir(/*turbopackIgnore: true*/ getSessionRoot(), { recursive: true });
  const temporaryPath = `${donePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(
      /*turbopackIgnore: true*/ temporaryPath,
      JSON.stringify(completed),
      "utf8"
    );
    await rename(
      /*turbopackIgnore: true*/ temporaryPath,
      /*turbopackIgnore: true*/ donePath
    );
  } catch (error) {
    await rm(/*turbopackIgnore: true*/ temporaryPath, { force: true }).catch(
      () => undefined
    );
    throw error;
  }
}

async function writeSession(session: ApkUploadSession): Promise<void> {
  const { metaPath } = getSessionPaths(session.sessionId);
  await mkdir(/*turbopackIgnore: true*/ getSessionRoot(), { recursive: true });
  const temporaryPath = `${metaPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(
      /*turbopackIgnore: true*/ temporaryPath,
      JSON.stringify(session),
      "utf8"
    );
    await rename(
      /*turbopackIgnore: true*/ temporaryPath,
      /*turbopackIgnore: true*/ metaPath
    );
  } catch (error) {
    await rm(/*turbopackIgnore: true*/ temporaryPath, { force: true }).catch(
      () => undefined
    );
    throw error;
  }
}

async function removeSession(sessionId: string): Promise<void> {
  const { metaPath, partPath } = getSessionPaths(sessionId);
  await Promise.all([
    rm(/*turbopackIgnore: true*/ metaPath, { force: true }),
    rm(/*turbopackIgnore: true*/ partPath, { force: true }),
  ]);
}

/** Remove sessions left behind by a closed browser or a failed request. */
export async function sweepStaleApkSessions(): Promise<void> {
  let names: string[];
  try {
    names = await readdir(/*turbopackIgnore: true*/ getSessionRoot());
  } catch {
    return;
  }

  const now = Date.now();
  const metaNames = names.filter(
    (name) => name.startsWith(SESSION_PREFIX) && name.endsWith(".json") && !name.endsWith(".done.json")
  );
  await Promise.all(
    metaNames.map(async (name) => {
      const sessionId = name.slice(SESSION_PREFIX.length, -".json".length);
      if (!isValidApkSessionId(sessionId) || locks.has(sessionId)) return;
      const session = await readSession(sessionId);
      if (!session || now - session.lastActivity > APK_SESSION_TTL_MS) {
        await removeSession(sessionId);
      }
    })
  );

  // A completion receipt makes a lost finalize response retryable. It is not
  // public and is kept only long enough for a browser retry to recover.
  const doneNames = names.filter(
    (name) => name.startsWith(SESSION_PREFIX) && name.endsWith(".done.json")
  );
  await Promise.all(
    doneNames.map(async (name) => {
      const sessionId = name.slice(SESSION_PREFIX.length, -".done.json".length);
      if (!isValidApkSessionId(sessionId) || locks.has(sessionId)) return;
      const completed = await readCompleted(sessionId);
      if (!completed || now - completed.completedAt > APK_SESSION_TTL_MS) {
        await rm(
          /*turbopackIgnore: true*/ getSessionPaths(sessionId).donePath,
          { force: true }
        );
      }
    })
  );
}

function validateCommonChunkParams(input: {
  sessionId: string;
  app: string;
  fileName: string;
  index: number;
  totalSize: number;
  chunkLength: number;
}) {
  if (!isValidApkSessionId(input.sessionId)) {
    throw new ApkUploadHttpError(
      400,
      "INVALID_APK_SESSION",
      "Invalid APK upload session id."
    );
  }
  if (!isAppKind(input.app)) {
    throw new ApkUploadHttpError(
      400,
      "INVALID_APK_APP",
      "A customer or staff app is required."
    );
  }
  if (
    !Number.isInteger(input.index) ||
    input.index < 0 ||
    !Number.isInteger(input.totalSize) ||
    input.totalSize <= 0 ||
    input.totalSize > MAX_APK_BYTES
  ) {
    throw new ApkUploadHttpError(
      400,
      "INVALID_APK_CHUNK_PARAMS",
      "Invalid APK chunk parameters."
    );
  }
  if (input.chunkLength < 1) {
    throw new ApkUploadHttpError(
      400,
      "EMPTY_APK_CHUNK",
      "APK chunk body is empty."
    );
  }
  if (input.chunkLength > APK_CHUNK_MAX_BYTES) {
    throw new ApkUploadHttpError(
      413,
      "APK_CHUNK_TOO_LARGE",
      "APK chunk is too large."
    );
  }
  if (input.fileName && !isApkOriginalName(input.fileName)) {
    throw new ApkUploadHttpError(
      400,
      "INVALID_APK_FILE",
      "Only .apk files are allowed."
    );
  }
}

/**
 * Append one raw chunk. Chunks are strictly ordered, and a repeated index is
 * an idempotent no-op, which is exactly what a browser needs after a lost
 * response or a transient gateway/network failure.
 */
export async function appendApkChunk(input: {
  sessionId: string;
  app: string;
  fileName: string;
  index: number;
  totalSize: number;
  chunk: Buffer;
}): Promise<ApkChunkResult> {
  validateCommonChunkParams({
    sessionId: input.sessionId,
    app: input.app,
    fileName: input.fileName,
    index: input.index,
    totalSize: input.totalSize,
    chunkLength: input.chunk.length,
  });
  await sweepStaleApkSessions();

  return withSessionLock(input.sessionId, async () => {
    let session = await readSession(input.sessionId);
    if (!session) {
      const originalName = normalizeApkOriginalName(input.fileName);
      session = {
        sessionId: input.sessionId,
        app: input.app as AppKind,
        fileName: originalName || "app.apk",
        internalFileName: `${Date.now()}-${randomUUID().slice(0, 8)}.apk`,
        totalSize: input.totalSize,
        received: 0,
        expectedIndex: 0,
        lastActivity: Date.now(),
      };
      await mkdir(/*turbopackIgnore: true*/ getLocalApkDir(session.app), {
        recursive: true,
      });
      await writeSession(session);
    }

    if (session.app !== input.app || session.totalSize !== input.totalSize) {
      throw new ApkUploadHttpError(
        409,
        "APK_SESSION_CONFLICT",
        "APK upload session does not match this file.",
        { expectedApp: session.app, expectedSize: session.totalSize }
      );
    }

    if (input.index < session.expectedIndex) {
      // The bytes for this index are already persisted. Never append them a
      // second time during a retry.
      return {
        success: true,
        received: session.received,
        expectedIndex: session.expectedIndex,
        totalSize: session.totalSize,
      };
    }
    if (input.index > session.expectedIndex) {
      throw new ApkUploadHttpError(
        409,
        "APK_CHUNK_OUT_OF_ORDER",
        "APK chunks must be uploaded in order.",
        { expectedIndex: session.expectedIndex }
      );
    }

    const paths = getSessionPaths(input.sessionId);
    const onDisk = await stat(/*turbopackIgnore: true*/ paths.partPath)
      .then((info) => info.size)
      .catch(() => 0);
    if (onDisk !== session.received) {
      throw new ApkUploadHttpError(
        409,
        "APK_SESSION_CORRUPT",
        "The partial APK upload is inconsistent; please restart it.",
        { received: session.received, onDisk }
      );
    }
    if (session.received + input.chunk.length > session.totalSize) {
      await removeSession(input.sessionId);
      throw new ApkUploadHttpError(
        400,
        "APK_CHUNK_OVERFLOW",
        "APK chunks exceed the declared file size."
      );
    }

    try {
      await appendFile(/*turbopackIgnore: true*/ paths.partPath, input.chunk);
      session.received += input.chunk.length;
      session.expectedIndex += 1;
      session.lastActivity = Date.now();
      await writeSession(session);
    } catch (error) {
      throw new ApkUploadHttpError(
        500,
        "APK_CHUNK_WRITE_FAILED",
        "Failed to store APK chunk.",
        { details: error instanceof Error ? error.message : String(error) }
      );
    }

    return {
      success: true,
      received: session.received,
      expectedIndex: session.expectedIndex,
      totalSize: session.totalSize,
    };
  });
}

export async function finalizeApkUpload(input: {
  sessionId: string;
  app: string;
  fileName?: string;
}) {
  if (!isValidApkSessionId(input.sessionId)) {
    throw new ApkUploadHttpError(
      400,
      "INVALID_APK_SESSION",
      "Invalid APK upload session id."
    );
  }
  if (!isAppKind(input.app)) {
    throw new ApkUploadHttpError(
      400,
      "INVALID_APK_APP",
      "A customer or staff app is required."
    );
  }

  return withSessionLock(input.sessionId, async () => {
    const completed = await readCompleted(input.sessionId);
    if (completed && Date.now() - completed.completedAt <= APK_SESSION_TTL_MS) {
      if (completed.app !== input.app) {
        throw new ApkUploadHttpError(
          409,
          "APK_SESSION_CONFLICT",
          "APK upload session does not match this app."
        );
      }
      if (input.fileName && normalizeApkOriginalName(input.fileName) !== completed.fileName) {
        throw new ApkUploadHttpError(
          409,
          "APK_SESSION_CONFLICT",
          "APK upload session does not match this filename."
        );
      }
      return completed.result;
    }

    const session = await readSession(input.sessionId);
    if (!session) {
      throw new ApkUploadHttpError(
        404,
        "APK_SESSION_NOT_FOUND",
        "APK upload session not found or expired; please re-upload the file."
      );
    }
    if (session.app !== input.app) {
      throw new ApkUploadHttpError(
        409,
        "APK_SESSION_CONFLICT",
        "APK upload session does not match this app."
      );
    }
    if (input.fileName && normalizeApkOriginalName(input.fileName) !== session.fileName) {
      throw new ApkUploadHttpError(
        409,
        "APK_SESSION_CONFLICT",
        "APK upload session does not match this filename."
      );
    }

    const paths = getSessionPaths(input.sessionId);
    const onDisk = await stat(/*turbopackIgnore: true*/ paths.partPath)
      .then((info) => info.size)
      .catch(() => 0);
    if (onDisk !== session.totalSize || onDisk === 0 || session.received !== session.totalSize) {
      throw new ApkUploadHttpError(
        409,
        "APK_INCOMPLETE",
        "APK upload is incomplete; upload the remaining chunks.",
        { received: onDisk, totalSize: session.totalSize }
      );
    }

    const finalPath = getLocalApkPath(session.app, session.internalFileName);
    try {
      // The part file and final file are on the same persistent volume. The
      // rename is atomic, so a download can only see the previous complete APK
      // or the new complete APK — never a partial file.
      await rename(
        /*turbopackIgnore: true*/ paths.partPath,
        /*turbopackIgnore: true*/ finalPath
      );
      const result = {
        ...(await publishLocalApkFile({
          app: session.app,
          filename: session.internalFileName,
          originalName: session.fileName,
          filePath: finalPath,
          size: onDisk,
        })),
        success: true as const,
      };
      await writeCompleted({
        sessionId: session.sessionId,
        app: session.app,
        fileName: session.fileName,
        completedAt: Date.now(),
        result,
      });
      await Promise.all([
        rm(/*turbopackIgnore: true*/ paths.metaPath, { force: true }),
        rm(/*turbopackIgnore: true*/ paths.partPath, { force: true }),
      ]);
      return result;
    } catch (error) {
      // Leave a complete local file in place if publishing fails. The caller
      // does not save its URL until this method succeeds, so it cannot corrupt
      // the currently active download.
      if (error instanceof ApkUploadHttpError) throw error;
      throw new ApkUploadHttpError(
        500,
        "APK_FINALIZE_FAILED",
        "Failed to finalize APK upload.",
        { details: error instanceof Error ? error.message : String(error) }
      );
    }
  });
}

export async function cancelApkUpload(sessionId: string): Promise<void> {
  if (!isValidApkSessionId(sessionId)) {
    throw new ApkUploadHttpError(
      400,
      "INVALID_APK_SESSION",
      "Invalid APK upload session id."
    );
  }
  await withSessionLock(sessionId, async () => {
    await removeSession(sessionId);
  });
}
