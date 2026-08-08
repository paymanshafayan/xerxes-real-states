import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, desc, and, gt, sql } from "drizzle-orm";
import { notifySessionAssigned } from "@/lib/push";

// GET - Fetch messages for a session (polling)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    const after = url.searchParams.get("after"); // message ID to get newer messages

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const conditions = [eq(chatMessages.sessionId, sessionId)];
    if (after) {
      conditions.push(gt(chatMessages.id, Number(after)));
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(and(...conditions))
      .orderBy(chatMessages.createdAt)
      .limit(100);

    // mark staff messages as read by the visitor (read receipts for staff)
    await db.execute(
      sql`UPDATE chat_messages SET read_at = now() WHERE session_id = ${sessionId} AND sender = 'staff' AND read_at IS NULL`
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json({ messages: [] });
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, sender, senderName, message, visitorName, visitorEmail } = body;

    if (!sessionId || !sender || !message) {
      return NextResponse.json(
        { error: "sessionId, sender, and message are required" },
        { status: 400 }
      );
    }

    // Create or update session
    const existingSession = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId))
      .limit(1);

    if (existingSession.length === 0) {
      await db.insert(chatSessions).values({
        sessionId,
        visitorName: visitorName || senderName || "Visitor",
        visitorEmail: visitorEmail || null,
        status: "active",
      });
    } else {
      await db
        .update(chatSessions)
        .set({
          updatedAt: new Date(),
          lastMessageAt: new Date(),
          unreadCount: sql`${chatSessions.unreadCount} + 1`,
        })
        .where(eq(chatSessions.sessionId, sessionId));
    }

    // Insert message
    const msg = await db
      .insert(chatMessages)
      .values({
        sessionId,
        sender,
        senderName: senderName || (sender === "agent" ? "Agent" : "Visitor"),
        message,
      })
      .returning();

    // Notify assigned staff (no-op if push not configured / not assigned)
    notifySessionAssigned(sessionId).catch(() => {});

    return NextResponse.json({ success: true, message: msg[0] });
  } catch (error) {
    console.error("Failed to send chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
