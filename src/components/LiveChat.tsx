"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  id: number;
  sessionId: string;
  sender: string;
  senderName: string;
  message: string;
  createdAt: string;
}

// Bot auto-responses for when no agent is online
const botAutoResponses: Record<string, string> = {
  buy: "Great choice! We have many properties for sale. An agent will join this chat shortly. Meanwhile, you can browse /properties?type=sale",
  rent: "We have rental properties available! An agent will assist you soon. Check /properties?type=rent",
  invest: "Northern Cyprus offers 6-10% rental yields. Read our guide: /blog/northern-cyprus-investment-roi-2025",
  price: "Property prices in Northern Cyprus range from £50,000 to £1,000,000+. An agent will help you find options in your budget.",
  hello: "Hello! 👋 Welcome to Xerxes. How can I help you today? An agent will join shortly.",
  hi: "Hi there! 👋 How can we help you find your dream property in Northern Cyprus?",
};

function getBotReply(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(botAutoResponses)) {
    if (lower.includes(key)) return response;
  }
  return null;
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lastMsgId, setLastMsgId] = useState(0);
  const [started, setStarted] = useState(false);
  const [nameForm, setNameForm] = useState({ name: "", email: "" });
  const [sending, setSending] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate session ID
  useEffect(() => {
    let sid = sessionStorage.getItem("chat_session_id");
    if (!sid) {
      sid = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem("chat_session_id", sid);
    }
    setSessionId(sid);

    // Check if chat was started before
    const wasStarted = sessionStorage.getItem("chat_started");
    if (wasStarted) {
      setStarted(true);
      setNameForm({
        name: sessionStorage.getItem("chat_name") || "",
        email: sessionStorage.getItem("chat_email") || "",
      });
    }
  }, []);

  // Poll for new messages every 3 seconds
  const pollMessages = useCallback(async () => {
    if (!sessionId || !started) return;

    try {
      const res = await fetch(
        `/api/chat?sessionId=${sessionId}&after=${lastMsgId}`
      );
      const data = await res.json();
      const newMsgs: ChatMessage[] = data.messages || [];

      if (newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
        setLastMsgId(newMsgs[newMsgs.length - 1].id);

        // Notify if chat is closed and agent sent message
        if (!isOpen && newMsgs.some((m) => m.sender === "agent")) {
          setHasNewMessage(true);
        }
      }
    } catch {
      // Silent fail
    }
  }, [sessionId, lastMsgId, started, isOpen]);

  useEffect(() => {
    if (started && isOpen) {
      // Fetch all messages first
      fetch(`/api/chat?sessionId=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          const msgs: ChatMessage[] = data.messages || [];
          setMessages(msgs);
          if (msgs.length > 0) {
            setLastMsgId(msgs[msgs.length - 1].id);
          }
        });
    }
  }, [started, isOpen, sessionId]);

  useEffect(() => {
    if (started) {
      pollRef.current = setInterval(pollMessages, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [started, pollMessages]);

  const startChat = async () => {
    if (!nameForm.name.trim()) return;

    sessionStorage.setItem("chat_started", "true");
    sessionStorage.setItem("chat_name", nameForm.name);
    sessionStorage.setItem("chat_email", nameForm.email);
    setStarted(true);

    // Send welcome bot message
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        sender: "bot",
        senderName: "Xerxes Bot",
        message: `Hello ${nameForm.name}! 👋 Welcome to Xerxes live chat. An agent will be with you shortly. How can we help you?`,
        visitorName: nameForm.name,
        visitorEmail: nameForm.email,
      }),
    });

    pollMessages();
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      // Send visitor message
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sender: "visitor",
          senderName: nameForm.name || "Visitor",
          message: text,
        }),
      });

      // Auto bot reply if no agent has responded yet
      const agentMessages = messages.filter((m) => m.sender === "agent");
      if (agentMessages.length === 0) {
        const botReply = getBotReply(text);
        if (botReply) {
          setTimeout(async () => {
            await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                sender: "bot",
                senderName: "Xerxes Bot",
                message: botReply,
              }),
            });
            pollMessages();
          }, 1500);
        }
      }

      // Immediate poll
      await pollMessages();
    } catch {
      // Silent fail
    }

    setSending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessage(false);
        }}
        className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-primary hover:bg-primary-dark"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            {hasNewMessage && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                !
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-40 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-primary p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Xerxes Live Chat</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  {started ? "Connected" : "Start a conversation"}
                </p>
              </div>
            </div>
          </div>

          {!started ? (
            /* Name/Email form before chat */
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Please enter your details to start chatting with our team:
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={nameForm.name}
                  onChange={(e) =>
                    setNameForm({ ...nameForm, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={nameForm.email}
                  onChange={(e) =>
                    setNameForm({ ...nameForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
                <button
                  onClick={startChat}
                  disabled={!nameForm.name.trim()}
                  className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  Start Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "visitor" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[80%]">
                      {msg.sender !== "visitor" && (
                        <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                          {msg.sender === "bot" ? (
                            <Bot className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          msg.sender === "visitor"
                            ? "bg-primary text-white rounded-br-none"
                            : msg.sender === "agent"
                            ? "bg-green-50 border border-green-200 text-gray-800 rounded-bl-none"
                            : "bg-white border border-gray-200 text-gray-700 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          msg.sender === "visitor"
                            ? "text-right text-gray-400"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="p-3 border-t border-gray-200 flex gap-2 bg-white"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
