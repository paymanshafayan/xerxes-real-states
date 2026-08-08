import { db } from "@/db";
import { staticContent } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Reads all key/value pairs saved for a Content Manager section (e.g.
 * "contact_info", "seo", "footer") and returns them as a plain object.
 * Values are JSON-parsed when possible (falls back to the raw string).
 * Safe to call from server components; returns {} on any failure so a
 * missing/broken row never breaks page rendering.
 */
export async function getStaticContentSection(
  section: string
): Promise<Record<string, unknown>> {
  try {
    const rows = await db
      .select()
      .from(staticContent)
      .where(eq(staticContent.section, section));

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return result;
  } catch {
    return {};
  }
}
