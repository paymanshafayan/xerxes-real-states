import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { findLocalApk, isValidApkName } from "@/lib/appStorage";

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
