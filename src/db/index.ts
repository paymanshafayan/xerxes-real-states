import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getBootstrapDatabaseUrl } from "@/lib/bootstrapConfig";

const globalForDb = globalThis as typeof globalThis & {
  __xerxesPool?: Pool;
};

const FALLBACK_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:1/xerxes";

function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

// A build may evaluate route modules before the initial setup has supplied a
// database. The unreachable placeholder lets build complete without a secret.
export let pool = globalForDb.__xerxesPool ?? createPool(
  getBootstrapDatabaseUrl() || FALLBACK_DATABASE_URL
);
export let db = drizzle(pool);

if (process.env.NODE_ENV !== "production") globalForDb.__xerxesPool = pool;

/** Switch to the database configured by the one-time setup wizard. */
export async function configureDatabase(connectionString: string): Promise<void> {
  const nextPool = createPool(connectionString);
  await nextPool.query("SELECT 1");
  const previousPool = pool;
  pool = nextPool;
  db = drizzle(pool);
  if (process.env.NODE_ENV !== "production") globalForDb.__xerxesPool = pool;
  await previousPool.end().catch(() => undefined);
}
