import { db } from "@/db";
import { staticContent } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { AppDownloadConfig, parseAppDownloadConfig } from "./appDownloads";
import { AppKind, deleteAppApk, isAppKind } from "./appStorage";

export type PublishedApk = {
  key: string;
  url: string;
  name: string;
  size: number;
};

/**
 * Persist the APK metadata as part of the server-side publish request. Keeping
 * this next to finalization avoids the fragile sequence "upload succeeds,
 * browser loses connection, config never gets saved".
 */
export async function persistPublishedApk(
  app: string,
  published: PublishedApk
): Promise<{ config: AppDownloadConfig; previousKey?: string }> {
  if (!isAppKind(app)) throw new Error("Invalid app kind.");
  const rows = await db
    .select()
    .from(staticContent)
    .where(and(eq(staticContent.section, "app_downloads"), eq(staticContent.key, app)))
    .limit(1);
  const current = parseAppDownloadConfig(rows[0]?.value ? parseStoredValue(rows[0].value) : null);
  const config: AppDownloadConfig = {
    ...current,
    apkUrl: published.url,
    apkName: published.name,
    apkKey: published.key,
    apkSize: published.size,
    apkUploadedAt: new Date().toISOString(),
  };
  const value = JSON.stringify(config);

  if (rows.length > 0) {
    await db
      .update(staticContent)
      .set({ value, updatedAt: new Date() })
      .where(and(eq(staticContent.section, "app_downloads"), eq(staticContent.key, app)));
  } else {
    await db.insert(staticContent).values({ section: "app_downloads", key: app, value });
  }

  return { config, previousKey: current.apkKey };
}

export async function persistPublishedApkAndCleanup(
  app: string,
  published: PublishedApk
): Promise<AppDownloadConfig> {
  const { config, previousKey } = await persistPublishedApk(app, published);
  if (previousKey && previousKey !== published.key) {
    try {
      await deleteAppApk(previousKey);
    } catch (error) {
      // A stale/legacy key must not turn a successful new publish into a
      // failed upload. The new config is already active; cleanup is best effort.
      console.warn("Previous APK cleanup failed:", error);
    }
  }
  return config;
}

function parseStoredValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Type guard kept local so this server helper cannot accidentally publish an arbitrary key. */
export function isPublishedApkForApp(
  app: AppKind,
  published: PublishedApk
): boolean {
  return published.key.startsWith(`apps/${app}/`) && published.url.length > 0;
}
