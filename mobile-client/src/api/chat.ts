import { http } from "./client";

export interface ChatMessage {
  id: number;
  sessionId: string;
  sender: "visitor" | "agent" | "bot" | "staff";
  senderName: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

export async function fetchChatMessages(sessionId: string, after?: number): Promise<ChatMessage[]> {
  const res = await http.get<{ messages: ChatMessage[] }>("/api/chat", {
    params: { sessionId, ...(after ? { after: String(after) } : {}) },
  });
  return res.data.messages;
}

export async function sendChatMessage(data: {
  sessionId: string;
  message: string;
  visitorName?: string;
  visitorEmail?: string;
}): Promise<ChatMessage> {
  const res = await http.post<{ success: boolean; message: ChatMessage }>("/api/chat", {
    sessionId: data.sessionId,
    sender: "visitor",
    senderName: data.visitorName || "Visitor",
    message: data.message,
    visitorName: data.visitorName,
    visitorEmail: data.visitorEmail,
  });
  return res.data.message;
}
