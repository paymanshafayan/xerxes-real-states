import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const API_KEYS_SETTING = "api_keys";

let cached: { values: Record<string, string>; expiresAt: number } | null = null;

/**
 * Returns the key/value pairs saved from the Admin > API Keys panel
 * (stored as JSON under site_settings.key = "api_keys"). Cached briefly
 * in-process since this is read on every outgoing email/translation call.
 */
async function getStoredApiKeys(): Promise<Record<string, string>> {
  if (cached && cached.expiresAt > Date.now()) return cached.values;
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, API_KEYS_SETTING))
      .limit(1);
    const values = rows.length > 0 ? JSON.parse(rows[0].value) : {};
    cached = { values, expiresAt: Date.now() + 30_000 };
    return values;
  } catch {
    return {};
  }
}

/**
 * Resolve a config value: DB-stored value (from the admin API Keys panel)
 * takes precedence when set, otherwise falls back to the environment
 * variable of the same name.
 */
export async function getConfigValue(envKey: string): Promise<string | undefined> {
  const stored = await getStoredApiKeys();
  const fromDb = stored[envKey];
  if (fromDb && fromDb.trim()) return fromDb;
  return process.env[envKey];
}
