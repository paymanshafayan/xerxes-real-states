import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { appendApkChunk, finalizeApkUpload } from "@/lib/apkUpload";
import { deleteAppApk, findLocalApk, isValidApkName } from "@/lib/appStorage";

describe("isValidApkName", () => {
  it("accepts generated-style filenames", () => {
    expect(isValidApkName("1786707948344-78bf039d.apk")).toBe(true);
    expect(isValidApkName("app-release-1.2.3.apk")).toBe(true);
    expect(isValidApkName("My.App.1.0.0.apk")).toBe(true);
  });

  it("rejects path traversal and unsafe filenames", () => {
    expect(isValidApkName("../secret.apk")).toBe(false);
    expect(isValidApkName("a/b.apk")).toBe(false);
    expect(isValidApkName("a\\b.apk")).toBe(false);
    expect(isValidApkName(".hidden.apk")).toBe(false);
    expect(isValidApkName("noextension")).toBe(false);
    expect(isValidApkName("")).toBe(false);
    expect(isValidApkName("x.apk/..")).toBe(false);
    expect(isValidApkName("x.apk?download")).toBe(false);
  });
});

describe("findLocalApk", () => {
  const root = process.cwd();
  const volumePath = path.join(
    root, "public", "downloads", "apps", "client", "1786707948344-78bf039d.apk"
  );
  const legacyPath = path.join(
    root, "public", "uploads", "apps", "client", "legacy-0000.apk"
  );

  beforeAll(async () => {
    await mkdir(path.dirname(volumePath), { recursive: true });
    await mkdir(path.dirname(legacyPath), { recursive: true });
    await writeFile(volumePath, "fake-apk-volume");
    await writeFile(legacyPath, "fake-apk-legacy");
  });

  afterAll(async () => {
    // Remove only the test-created files (and the app dirs created above).
    await rm(volumePath, { force: true });
    await rm(legacyPath, { force: true });
    await rm(path.join(root, "public", "downloads", "apps"), { recursive: true, force: true });
    await rm(path.join(root, "public", "uploads", "apps"), { recursive: true, force: true });
  });

  it("finds a file in the volume-backed location first", async () => {
    expect(await findLocalApk("client", "1786707948344-78bf039d.apk")).toBe(volumePath);
  });

  it("falls back to the legacy public/uploads/apps location", async () => {
    expect(await findLocalApk("client", "legacy-0000.apk")).toBe(legacyPath);
  });

  it("returns null for missing files and invalid input", async () => {
    expect(await findLocalApk("client", "missing.apk")).toBeNull();
    expect(await findLocalApk("client", "../evil.apk")).toBeNull();
    expect(await findLocalApk("root", "legacy-0000.apk")).toBeNull();
    expect(await findLocalApk("staff", "legacy-0000.apk")).toBeNull();
  });
});

describe("chunked APK publishing", () => {
  it("is ordered, retry-safe, and publishes only after finalize", async () => {
    const sessionId = "chunk-test-session-123";
    const first = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    const second = Buffer.from("xerxes-apk-payload");
    const totalSize = first.length + second.length;

    const firstResult = await appendApkChunk({
      sessionId,
      app: "client",
      fileName: "app-release.apk",
      index: 0,
      totalSize,
      chunk: first,
    });
    expect(firstResult.received).toBe(first.length);
    expect(firstResult.expectedIndex).toBe(1);

    // A retry of a chunk whose response was lost must not append it twice.
    const duplicate = await appendApkChunk({
      sessionId,
      app: "client",
      fileName: "app-release.apk",
      index: 0,
      totalSize,
      chunk: first,
    });
    expect(duplicate.received).toBe(first.length);

    await expect(
      appendApkChunk({
        sessionId,
        app: "client",
        fileName: "app-release.apk",
        index: 2,
        totalSize,
        chunk: second,
      })
    ).rejects.toMatchObject({ status: 409, code: "APK_CHUNK_OUT_OF_ORDER" });

    await appendApkChunk({
      sessionId,
      app: "client",
      fileName: "app-release.apk",
      index: 1,
      totalSize,
      chunk: second,
    });
    const result = await finalizeApkUpload({
      sessionId,
      app: "client",
      fileName: "app-release.apk",
    });

    expect(result.success).toBe(true);
    const filename = result.key.split("/").pop()!;
    const finalPath = await findLocalApk("client", filename);
    expect(finalPath).not.toBeNull();
    expect(await readFile(finalPath!)).toEqual(Buffer.concat([first, second]));

    // A lost finalize response can be retried after the server has already
    // published the file; the completion receipt returns the same result.
    const repeated = await finalizeApkUpload({
      sessionId,
      app: "client",
      fileName: "app-release.apk",
    });
    expect(repeated.key).toBe(result.key);
    await deleteAppApk(result.key);
  });
});
