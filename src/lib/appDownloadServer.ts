import { AppDownloadConfig, parseAppDownloadConfig } from "./appDownloads";
import { findLocalApk, isAppKind, isValidApkName } from "./appStorage";
import { getStaticContentSection } from "./staticContent";

export type LocalApkReference = {
  app: "client" | "staff";
  filename: string;
  filePath: string;
};

/** Extract the local stable URL format without ever trusting user path input. */
export async function resolveLocalApkReference(
  url: string | undefined
): Promise<LocalApkReference | null> {
  if (!url || typeof url !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(url, "http://xerxes.local");
  } catch {
    return null;
  }
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length !== 4 || segments[0] !== "uploads" || segments[1] !== "apps") {
    return null;
  }
  const app = segments[2];
  const filename = segments[3];
  if (!isAppKind(app) || !isValidApkName(filename)) return null;
  const filePath = await findLocalApk(app, filename);
  return filePath ? { app, filename, filePath } : null;
}

/**
 * Read the customer download config and hide a stale local link. This mirrors
 * the reference repository's `apkAvailable` check: a removed/ephemeral file
 * can never be rendered as a clickable dead link.
 */
export async function getCustomerDownloadConfig(): Promise<AppDownloadConfig> {
  const section = await getStaticContentSection("app_downloads");
  const config = parseAppDownloadConfig(section.client);
  if (!config.apkUrl) return config;

  const isLocalUrl = (() => {
    try {
      const pathname = new URL(config.apkUrl, "http://xerxes.local").pathname;
      return pathname.startsWith("/uploads/apps/");
    } catch {
      return false;
    }
  })();

  if (isLocalUrl && !(await resolveLocalApkReference(config.apkUrl))) {
    return { ...config, apkUrl: undefined, apkName: undefined, apkKey: undefined, apkSize: undefined };
  }
  return config;
}
