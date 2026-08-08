import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";

const API_KEYS_SETTING = "api_keys";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, API_KEYS_SETTING))
      .limit(1);

    if (result.length > 0) {
      const keys = JSON.parse(result[0].value);
      // Mask sensitive values for display
      const masked: Record<string, string> = {};
      for (const [k, v] of Object.entries(keys)) {
        const val = v as string;
        if (val && val.length > 6 && !k.startsWith("NEXT_PUBLIC_")) {
          masked[k] = val.substring(0, 4) + "••••" + val.substring(val.length - 4);
        } else {
          masked[k] = val;
        }
      }
      return NextResponse.json({ keys: masked });
    }

    return NextResponse.json({ keys: {} });
  } catch (error) {
    console.error("Failed to get API keys:", error);
    return NextResponse.json({ keys: {} });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { keys } = await request.json();

    // Only save non-empty values
    const cleanKeys: Record<string, string> = {};
    for (const [k, v] of Object.entries(keys)) {
      const val = v as string;
      // Don't overwrite with masked values
      if (val && !val.includes("••••")) {
        cleanKeys[k] = val;
      }
    }

    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, API_KEYS_SETTING))
      .limit(1);

    // Merge with existing keys (don't lose masked ones)
    let mergedKeys = cleanKeys;
    if (existing.length > 0) {
      const existingKeys = JSON.parse(existing[0].value);
      mergedKeys = { ...existingKeys, ...cleanKeys };
    }

    const value = JSON.stringify(mergedKeys);

    if (existing.length > 0) {
      await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, API_KEYS_SETTING));
    } else {
      await db.insert(siteSettings).values({ key: API_KEYS_SETTING, value });
    }

    await logActivity({
      action: "setting_change",
      entity: "setting",
      details: `API keys updated: ${Object.keys(cleanKeys).join(", ")}`,
      userName: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save API keys:", error);
    return NextResponse.json(
      { error: "Failed to save API keys" },
      { status: 500 }
    );
  }
}
