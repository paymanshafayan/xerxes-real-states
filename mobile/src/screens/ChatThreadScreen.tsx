import React, { useEffect, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Audio } from "expo-av";
import { Screen, Header, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing, radius } from "../theme";
import { t } from "../i18n";
import {
  getChatMessages,
  sendChatMessage,
  uploadFiles,
  type ChatMessage,
} from "../api/staff";
import { POLL_INTERVAL } from "../config";
import { subscribeChatSession, publishTyping } from "../lib/ably";
import * as ImagePicker from "expo-image-picker";

function mimeFor(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "m4a") return "audio/m4a";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "wav") return "audio/wav";
  if (ext === "webm") return "audio/webm";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  return "image/jpeg";
}

export default function ChatThreadScreen() {
  const { theme } = useThemeStore();
  const route = useRoute<any>();
  const sessionId = route.params?.sessionId as string;
  const qc = useQueryClient();

  const [text, setText] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-messages", sessionId],
    queryFn: () => getChatMessages(sessionId),
    refetchInterval: POLL_INTERVAL,
  });
  const messages: ChatMessage[] = data ?? [];

  // Realtime: refetch immediately when a new message arrives over Ably.
  useEffect(() => {
    const unsub = subscribeChatSession(
      sessionId,
      () => {
        qc.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
      },
      () => {
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 1500);
      }
    );
    return unsub;
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function sendText() {
    if (!text.trim()) return;
    await sendChatMessage(sessionId, { message: text.trim(), type: "text" });
    setText("");
    qc.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
    qc.invalidateQueries({ queryKey: ["chat-sessions"] });
  }

  async function startAudio() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync();
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch {
      /* ignore */
    }
  }

  async function stopAudio() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const dur = status && "durationMillis" in status ? Math.round((status as any).durationMillis / 1000) : 0;
      setRecording(null);
      setIsRecording(false);
      if (uri) {
        const form = new FormData() as any;
        form.append("kind", "audio");
        form.append("files", { uri, name: "voice.m4a", type: mimeFor(uri) });
        const res = await uploadFiles(form);
        const url = res.urls?.[0];
        if (url) {
          await sendChatMessage(sessionId, { type: "audio", mediaUrl: url, durationSec: dur });
          qc.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
          qc.invalidateQueries({ queryKey: ["chat-sessions"] });
        }
      }
    } catch {
      setIsRecording(false);
    }
  }

  async function pickImage() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
      if (!res.canceled && res.assets[0]) {
        const uri = res.assets[0].uri;
        const form = new FormData() as any;
        form.append("kind", "image");
        form.append("files", { uri, name: "photo.jpg", type: mimeFor(uri) });
        const r = await uploadFiles(form);
        const url = r.urls?.[0];
        if (url) {
          await sendChatMessage(sessionId, { type: "image", mediaUrl: url });
          qc.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
          qc.invalidateQueries({ queryKey: ["chat-sessions"] });
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (isLoading) return <Loading />;

  return (
    <Screen style={{ padding: 0 }}>
      <View style={[styles.head, { padding: spacing.lg, backgroundColor: theme.background }]}>
        <Header title={t("chat")} subtitle={sessionId} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, padding: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      >
        {messages.map((m) => {
          const mine = m.sender === "staff";
          return (
            <View
              key={m.id}
              style={[
                styles.bubbleRow,
                mine ? styles.rowRight : styles.rowLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: mine ? theme.primary : theme.surface,
                  },
                ]}
              >
                {m.type === "audio" && m.mediaUrl ? (
                  <Text style={{ color: mine ? "#fff" : theme.text }}>
                    <Feather name="mic" size={12} color={mine ? "#fff" : theme.text} /> {m.durationSec || ""}s
                  </Text>
                ) : (
                  <Text style={{ color: mine ? "#fff" : theme.text }}>{m.message}</Text>
                )}
                {m.sender === "staff" && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: mine ? "rgba(255,255,255,0.8)" : theme.textMuted,
                      marginTop: 2,
                      textAlign: mine ? "right" : "left",
                    }}
                  >
                    {m.readAt ? "Read ✓✓" : "Sent ✓"}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {typing && (
        <Text style={[typography.caption, { color: theme.textMuted, paddingHorizontal: spacing.lg, paddingBottom: 4 }]}>
          typing…
        </Text>
      )}
      <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            if (v.trim()) publishTyping(sessionId);
          }}
          placeholder={t("typeMessage")}
          placeholderTextColor={theme.textMuted}
          style={[typography.body, { flex: 1, color: theme.text, paddingHorizontal: spacing.sm }]}
        />
        <TouchableOpacity onPress={pickImage} style={{ padding: spacing.sm }}>
          <Feather name="image" size={22} color={theme.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPressIn={startAudio} onPressOut={stopAudio} style={{ padding: spacing.sm }}>
          <Feather name="mic" size={22} color={isRecording ? theme.danger : theme.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={sendText} style={{ padding: spacing.sm }}>
          <Text style={{ color: theme.primary }}>{t("send")}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { borderBottomWidth: 1, borderBottomColor: "#00000020" },
  bubbleRow: { flexDirection: "row", marginBottom: 8 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "75%",
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: spacing.sm,
  },
});
