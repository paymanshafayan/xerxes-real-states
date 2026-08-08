import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchChatMessages, sendChatMessage, type ChatMessage } from "../api/chat";
import { Input, Button, Header } from "../components/ui";
import { colors, spacing, radius, typography } from "../theme";
import { useT } from "../store/locale";
import { CHAT_POLL_INTERVAL } from "../config";

const SESSION_KEY = "xerxes-client.chatSessionId";
const NAME_KEY = "xerxes-client.chatName";

function genSessionId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatScreen() {
  const t = useT();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [started, setStarted] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const savedSession = await AsyncStorage.getItem(SESSION_KEY);
      const savedName = await AsyncStorage.getItem(NAME_KEY);
      if (savedSession) {
        setSessionId(savedSession);
        setVisitorName(savedName || "Guest");
        setStarted(true);
      }
    })();
  }, []);

  const loadMessages = useCallback(async (sid: string) => {
    try {
      const msgs = await fetchChatMessages(sid);
      setMessages(msgs);
    } catch {
      /* ignore transient errors, next poll will retry */
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    loadMessages(sessionId);
    pollRef.current = setInterval(() => loadMessages(sessionId), CHAT_POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId, loadMessages]);

  async function handleStart() {
    if (!nameInput.trim()) return;
    const sid = genSessionId();
    await AsyncStorage.setItem(SESSION_KEY, sid);
    await AsyncStorage.setItem(NAME_KEY, nameInput.trim());
    setSessionId(sid);
    setVisitorName(nameInput.trim());
    setStarted(true);
    try {
      await sendChatMessage({
        sessionId: sid,
        message: `👋 ${nameInput.trim()} started a chat`,
        visitorName: nameInput.trim(),
        visitorEmail: emailInput.trim() || undefined,
      });
    } catch {
      /* the session still gets created on the next real message */
    }
  }

  async function handleSend() {
    if (!draft.trim() || !sessionId) return;
    const text = draft.trim();
    setDraft("");
    try {
      const msg = await sendChatMessage({ sessionId, message: text, visitorName });
      setMessages((prev) => [...prev, msg]);
    } catch {
      setDraft(text); // restore so the user can retry
    }
  }

  if (!started) {
    return (
      <View style={styles.startContainer}>
        <Header title={t("chatTitle")} subtitle={t("chatWelcome")} />
        <Input value={nameInput} onChangeText={setNameInput} placeholder={t("chatNamePrompt")} />
        <Input value={emailInput} onChangeText={setEmailInput} placeholder={t("chatEmailPrompt")} keyboardType="email-address" />
        <Button label={t("startChat")} onPress={handleStart} disabled={!nameInput.trim()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isVisitor = item.sender === "visitor";
          return (
            <View style={[styles.bubble, isVisitor ? styles.bubbleVisitor : styles.bubbleAgent]}>
              {!isVisitor && (
                <Text style={[typography.small, { color: colors.primary, marginBottom: 2 }]}>
                  {item.senderName}
                </Text>
              )}
              <Text style={{ color: isVisitor ? "#fff" : colors.text }}>{item.message}</Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <Input value={draft} onChangeText={setDraft} placeholder={t("typeMessage")} style={{ marginBottom: 0 }} />
        </View>
        <Button label={t("send")} onPress={handleSend} disabled={!draft.trim()} style={styles.sendBtn} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  startContainer: { flex: 1, padding: spacing.md, justifyContent: "center" },
  messagesList: { padding: spacing.md, paddingBottom: spacing.xl },
  bubble: {
    maxWidth: "80%",
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  bubbleVisitor: { backgroundColor: colors.primary, alignSelf: "flex-end" },
  bubbleAgent: { backgroundColor: colors.surface, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendBtn: { width: 90 },
});
