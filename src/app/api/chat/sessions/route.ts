import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// GET - List all active chat sessions (for admin)
export async function GET() {
  try {
    const sessions = await db
      .select({
        id: chatSessions.id,
        sessionId: chatSessions.sessionId,
        visitorName: chatSessions.visitorName,
        visitorEmail: chatSessions.visitorEmail,
        status: chatSessions.status,
        assignedAgentId: chatSessions.assignedAgentId,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        messageCount: sql<number>`(SELECT count(*) FROM chat_messages WHERE chat_messages.session_id = ${chatSessions.sessionId})`,
        lastMessage: sql<string>`(SELECT message FROM chat_messages WHERE chat_messages.session_id = ${chatSessions.sessionId} ORDER BY created_at DESC LIMIT 1)`,
      })
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to fetch chat sessions:", error);
    return NextResponse.json({ sessions: [] });
  }
}
