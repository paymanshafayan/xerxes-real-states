import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";
import { publishChatEvent } from "@/lib/realtime";

// GET - list chat sessions (manager: all, consultant: assigned to them)
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const conditions =
      auth.role === "consultant" && auth.id
        ? eq(chatSessions.assignedStaffId, auth.id)
        : undefined;
    const sessions = await db
      .select({
        id: chatSessions.id,
        sessionId: chatSessions.sessionId,
        visitorName: chatSessions.visitorName,
        visitorEmail: chatSessions.visitorEmail,
        status: chatSessions.status,
        assignedAgentId: chatSessions.assignedAgentId,
        assignedStaffId: chatSessions.assignedStaffId,
        unreadCount: chatSessions.unreadCount,
        lastMessageAt: chatSessions.lastMessageAt,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        messageCount: sql<number>`(SELECT count(*) FROM chat_messages WHERE chat_messages.session_id = ${chatSessions.sessionId})`,
        lastMessage: sql<string>`(SELECT message FROM chat_messages WHERE chat_messages.session_id = ${chatSessions.sessionId} ORDER BY created_at DESC LIMIT 1)`,
      })
      .from(chatSessions)
      .where(conditions)
      .orderBy(desc(chatSessions.updatedAt));
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Staff chat sessions error:", error);
    return NextResponse.json({ sessions: [] });
  }
}

// POST - assign / close a session (manager can assign; both can close)
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { sessionId, action, assignedStaffId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    if (action === "close") {
      await db
        .update(chatSessions)
        .set({ status: "closed", updatedAt: new Date() })
        .where(eq(chatSessions.sessionId, sessionId));
    } else if (action === "assign") {
      if (auth.role !== "manager")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      await db
        .update(chatSessions)
        .set({
          assignedStaffId: assignedStaffId ? Number(assignedStaffId) : null,
          updatedAt: new Date(),
        })
        .where(eq(chatSessions.sessionId, sessionId));
    } else if (action === "open") {
      await db
        .update(chatSessions)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(chatSessions.sessionId, sessionId));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff chat action error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
