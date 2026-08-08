import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, desc, and, gt, sql } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";
import { publishChatEvent } from "@/lib/realtime";

// GET - fetch messages for a session (consultant: only if assigned)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id: sessionId } = await params;
    const url = new URL(request.url);
    const after = url.searchParams.get("after");

    // ownership check for consultants
    if (auth.role === "consultant" && auth.id) {
      const sess = await db
        .select({ assignedStaffId: chatSessions.assignedStaffId })
        .from(chatSessions)
        .where(eq(chatSessions.sessionId, sessionId))
        .limit(1);
      if (sess.length === 0)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (sess[0].assignedStaffId !== auth.id)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conditions = [eq(chatMessages.sessionId, sessionId)];
    if (after) conditions.push(gt(chatMessages.id, Number(after)));
    const messages = await db
      .select()
      .from(chatMessages)
      .where(and(...conditions))
      .orderBy(chatMessages.createdAt)
      .limit(100);

    // mark as read when any staff member opens the thread
    await db
      .update(chatSessions)
      .set({ unreadCount: 0 })
      .where(eq(chatSessions.sessionId, sessionId));

    // mark visitor messages as read (read receipts)
    await db.execute(
      sql`UPDATE chat_messages SET read_at = now() WHERE session_id = ${sessionId} AND sender <> 'staff' AND read_at IS NULL`
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Staff chat messages GET error:", error);
    return NextResponse.json({ messages: [] });
  }
}

// POST - staff sends a message (text / audio / image)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { message, type, mediaUrl, durationSec } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // ownership check for consultants
    if (auth.role === "consultant" && auth.id) {
      const sess = await db
        .select({ assignedStaffId: chatSessions.assignedStaffId })
        .from(chatSessions)
        .where(eq(chatSessions.sessionId, sessionId))
        .limit(1);
      if (sess.length === 0)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (sess[0].assignedStaffId !== auth.id)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [msg] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        sender: "staff",
        senderId: auth.id,
        senderName: auth.name,
        message: message || "",
        type: type || "text",
        mediaUrl: mediaUrl || null,
        durationSec: durationSec ? Number(durationSec) : null,
      })
      .returning();

    await db
      .update(chatSessions)
      .set({ status: "active", lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chatSessions.sessionId, sessionId));

    // realtime fan-out (no-op if Ably not configured)
    await publishChatEvent({
      type: "message",
      sessionId,
      data: { message: msg },
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error("Staff chat messages POST error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
