import { mkdir, rename, writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";

const CONFIG_DIR = process.env.APP_CONFIG_DIR || "/app/data";
const CONFIG_FILE = path.join(CONFIG_DIR, "xerxes-bootstrap.json");

type BootstrapConfig = { databaseUrl?: string };

function readConfig(): BootstrapConfig {
  try {
    if (!existsSync(CONFIG_FILE)) return {};
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as BootstrapConfig;
  } catch {
    return {};
  }
}

/** Environment configuration takes precedence for managed deployments. */
export function getBootstrapDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || readConfig().databaseUrl;
}

/** Persisted only on a Railway Volume; never commit or expose this file. */
export async function saveBootstrapDatabaseUrl(databaseUrl: string): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const temporary = `${CONFIG_FILE}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify({ databaseUrl }), { mode: 0o600 });
  await rename(temporary, CONFIG_FILE);
}
