export type StorePlatform = "google_play" | "app_store" | "direct_apk" | "other";

export interface StoreLink {
  id: string;
  label: string;
  url: string;
  platform: StorePlatform;
}

export interface AppDownloadConfig {
  apkUrl?: string;
  apkName?: string;
  /** R2 object key, kept private to the admin UI so an uploaded package can be removed. */
  apkKey?: string;
  stores: StoreLink[];
}

export const EMPTY_APP_DOWNLOAD_CONFIG: AppDownloadConfig = { stores: [] };

export function parseAppDownloadConfig(value: unknown): AppDownloadConfig {
  if (!value || typeof value !== "object") return { ...EMPTY_APP_DOWNLOAD_CONFIG, stores: [] };
  const raw = value as Partial<AppDownloadConfig>;
  return {
    apkUrl: typeof raw.apkUrl === "string" ? raw.apkUrl : undefined,
    apkName: typeof raw.apkName === "string" ? raw.apkName : undefined,
    apkKey: typeof raw.apkKey === "string" ? raw.apkKey : undefined,
    stores: Array.isArray(raw.stores)
      ? raw.stores.filter((item): item is StoreLink =>
          !!item && typeof item.id === "string" && typeof item.label === "string" &&
          typeof item.url === "string" && ["google_play", "app_store", "direct_apk", "other"].includes(item.platform)
        )
      : [],
  };
}
