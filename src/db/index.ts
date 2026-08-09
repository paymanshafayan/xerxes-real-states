import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

/**
 * `next build` evaluates route modules and pre-renders pages before deployment
 * settings are available. Do not make that evaluation require DATABASE_URL.
 *
 * The placeholder is deliberately unreachable and is used only when a database
 * operation is attempted without configuration. Application data helpers
 * already fall back to sample content in that case, while database-backed API
 * requests correctly fail rather than silently connecting to an unknown DB.
 */
const connectionString =
  databaseUrl || "postgresql://postgres:postgres@127.0.0.1:1/xerxes";

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
