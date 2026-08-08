import React from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Card, Header, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { listActivity } from "../api/staff";
import { t } from "../i18n";

export default function ActivityScreen() {
  const { theme } = useThemeStore();
  const { data, isLoading } = useQuery({ queryKey: ["activity"], queryFn: () => listActivity() });
  const items: any[] = data ?? [];

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <Header title={t("activity") || "Activity"} />
      {items.length === 0 ? (
        <EmptyState message={t("noChats") || "Nothing yet"} />
      ) : (
        items.map((a, i) => (
          <Card key={i} style={{ marginBottom: spacing.md }}>
            <Text style={[typography.h3, { color: theme.text }]}>
              {a.action} · {a.entity}
            </Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>{a.details}</Text>
            {a.createdAt && (
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
                {new Date(a.createdAt).toLocaleString()}
              </Text>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
