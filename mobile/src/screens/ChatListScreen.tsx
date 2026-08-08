import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Card, Header, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { listChatSessions, chatSessionAction, type ChatSession } from "../api/staff";
import { useAuthStore } from "../store/auth";
import { POLL_INTERVAL } from "../config";

export default function ChatListScreen() {
  const { theme } = useThemeStore();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const staffId = useAuthStore((s) => s.staff?.id);
  const isManager = useAuthStore((s) => s.staff?.role === "manager");

  const { data, isLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => listChatSessions(),
    refetchInterval: POLL_INTERVAL,
  });
  const sessions: ChatSession[] = data ?? [];

  function act(sessionId: string, action: "open" | "close" | "assign") {
    chatSessionAction(sessionId, action, action === "assign" ? staffId : undefined).then(() =>
      qc.invalidateQueries({ queryKey: ["chat-sessions"] })
    );
  }

  return (
    <Screen>
      <Header title={t("chat")} />
      {isLoading ? (
        <Loading />
      ) : sessions.length === 0 ? (
        <EmptyState message={t("noChats")} />
      ) : (
        sessions.map((s) => (
          <Card
            key={s.id}
            style={{ marginBottom: spacing.md }}
            onPress={() => nav.navigate("ChatThread", { sessionId: s.sessionId })}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[typography.h3, { color: theme.text }]}>
                {s.visitorName || s.visitorEmail || s.sessionId}
              </Text>
              {s.unreadCount ? (
                <View style={{ backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: "#fff", fontSize: 12 }}>{s.unreadCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]} numberOfLines={1}>
              {s.lastMessage || "..."}
            </Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity
                style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.border, marginRight: 8 }}
                onPress={() => act(s.sessionId, s.status === "active" ? "close" : "open")}
              >
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  {s.status === "active" ? t("close") || "Close" : t("open") || "Open"}
                </Text>
              </TouchableOpacity>
              {isManager && (
                <TouchableOpacity
                  style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.primary }}
                  onPress={() => act(s.sessionId, "assign")}
                >
                  <Text style={[typography.caption, { color: theme.primary }]}>{t("assign") || "Assign to me"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
