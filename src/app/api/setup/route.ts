import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { adminUsers, siteSettings, staff } from "@/db/schema";
import { signStaffToken } from "@/lib/auth/jwt";

const AUTH_SECRET_SETTING = "auth_secret";

/** Public setup state used to show the one-time setup screen on a new site. */
export async function GET() {
  try {
    const existing = await db.select({ id: staff.id }).from(staff).limit(1);
    return NextResponse.json({ required: existing.length === 0 });
  } catch {
    // Database configuration is not available yet; do not expose the setup
    // flow until the application can persist it safely.
    return NextResponse.json({ required: false, databaseReady: false });
  }
}

/** Creates the one and only initial manager. It becomes unavailable afterwards. */
export async function POST(request: NextRequest) {
  try {
    const { username, name, email, password } = await request.json();
    if (!username || !name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_.-]{3,100}$/.test(username)) {
      return NextResponse.json({ error: "Username must be at least 3 characters and contain only letters, numbers, . _ or -." }, { status: 400 });
    }
    if (password.length < 12) {
      return NextResponse.json({ error: "Password must contain at least 12 characters." }, { status: 400 });
    }

    const existing = await db.select({ id: staff.id }).from(staff).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Initial setup has already been completed." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // This secret is generated with 384 bits of entropy and remains private:
    // it is never returned by this endpoint or exposed to the browser.
    const authSecret = randomBytes(48).toString("base64url");
    const created = await db.transaction(async (tx) => {
      // Serialize first-run requests across all application instances.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(73199421)`);
      const managers = await tx.select({ id: staff.id }).from(staff).limit(1);
      if (managers.length > 0) throw new Error("SETUP_COMPLETE");

      await tx.insert(siteSettings).values({ key: AUTH_SECRET_SETTING, value: authSecret });
      const [manager] = await tx
        .insert(staff)
        .values({
          username,
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: "manager",
          status: "active",
          permissions: ["*"],
        })
        .returning();
      // Keep the legacy admin endpoint aligned with the initial manager while
      // existing admin UI clients are migrated to the staff login endpoint.
      await tx.insert(adminUsers).values({ username, passwordHash });
      return manager;
    });

    const token = await signStaffToken({
      id: created.id,
      username: created.username,
      role: "manager",
      name: created.name,
      agentId: created.agentId,
    });
    return NextResponse.json({ success: true, token });
  } catch (error) {
    if (error instanceof Error && error.message === "SETUP_COMPLETE") {
      return NextResponse.json({ error: "Initial setup has already been completed." }, { status: 409 });
    }
    console.error("Initial setup error:", error);
    return NextResponse.json(
      { error: "Setup could not be completed. Check that the database is configured and migrations have run." },
      { status: 500 }
    );
  }
}
