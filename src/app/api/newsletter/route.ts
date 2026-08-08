import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsletters } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { sendEmail, newsletterWelcomeEmail } from "@/lib/email";
import { requireStaff } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      // Re-activate if previously unsubscribed
      if (!existing[0].isActive) {
        await db
          .update(newsletters)
          .set({ isActive: true })
          .where(eq(newsletters.email, email.toLowerCase()));
      }
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    await db.insert(newsletters).values({
      email: email.toLowerCase(),
    });

    // Send welcome email
    await sendEmail({
      to: email,
      subject: "Welcome to Xerxes Newsletter! 🏡",
      html: newsletterWelcomeEmail(),
    });

    await logActivity({
      action: "create",
      entity: "newsletter",
      details: `New subscriber: ${email}`,
    });

    return NextResponse.json({ success: true, message: "Subscribed" });
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const subscribers = await db
      .select()
      .from(newsletters)
      .orderBy(desc(newsletters.createdAt));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletters)
      .where(eq(newsletters.isActive, true));

    return NextResponse.json({
      subscribers,
      total: Number(countResult[0].count),
    });
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json({ subscribers: [], total: 0 });
  }
}
