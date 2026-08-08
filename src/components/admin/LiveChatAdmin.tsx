"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, User, Bot, Clock, Mail, Loader2, RefreshCw } from "lucide-react";

interface ChatSession {
  id: number;
  sessionId: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
}

interface ChatMessage {
  id: number;
  sessionId: string;
  sender: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export default function LiveChatAdmin() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    }
    setLoading(false);
  }, []);

  // Fetch messages for selected session
  const fetchMessages = useCallback(async () => {
    if (!selectedSession) return;
    try {
      const res = await fetch(`/api/chat?sessionId=${selectedSession}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages();
    }
  }, [selectedSession, fetchMessages]);

  // Poll every 3 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchSessions();
      if (selectedSession) fetchMessages();
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchSessions, fetchMessages, selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedSession || sending) return;
    setSending(true);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession,
          sender: "agent",
          senderName: "Agent",
          message: reply.trim(),
        }),
      });
      setReply("");
      await fetchMessages();
    } catch (e) {
      console.error("Failed to send reply:", e);
    }

    setSending(false);
  };

  const selectedSessionData = sessions.find(
    (s) => s.sessionId === selectedSession
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Live Chat</h2>
            <p className="text-sm text-gray-500">
              {sessions.filter((s) => s.status === "active").length} active conversations
            </p>
          </div>
        </div>
        <button
          onClick={fetchSessions}
          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex h-[500px]">
        {/* Sessions List */}
        <div className="w-72 border-r border-gray-200 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat sessions yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => setSelectedSession(session.sessionId)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedSession === session.sessionId
                    ? "bg-primary-light border-l-4 border-l-primary"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      session.status === "active"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {session.visitorName || "Anonymous"}
                  </span>
                </div>
                {session.visitorEmail && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3" />
                    {session.visitorEmail}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {session.lastMessage || "No messages"}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(session.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {session.messageCount} msgs
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedSession ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-semibold text-sm text-gray-900">
                      {selectedSessionData?.visitorName || "Visitor"}
                    </span>
                    {selectedSessionData?.visitorEmail && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({selectedSessionData.visitorEmail})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "agent" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[75%]">
                      <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                        {msg.sender === "bot" ? (
                          <Bot className="w-3 h-3" />
                        ) : msg.sender === "agent" ? (
                          <User className="w-3 h-3 text-green-500" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {msg.senderName} ·{" "}
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div
                        className={`rounded-xl px-3 py-2 text-sm ${
                          msg.sender === "agent"
                            ? "bg-primary text-white rounded-br-none"
                            : msg.sender === "bot"
                            ? "bg-amber-50 border border-amber-200 text-gray-700 rounded-bl-none"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="p-3 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Type your reply as agent..."
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-1"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
