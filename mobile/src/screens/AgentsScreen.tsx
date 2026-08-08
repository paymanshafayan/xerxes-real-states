import React from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Card, Header, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { listAgents } from "../api/staff";

export default function AgentsScreen() {
  const { theme } = useThemeStore();
  const { data, isLoading } = useQuery({ queryKey: ["agents"], queryFn: () => listAgents() });
  const agents: any[] = data ?? [];

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <Header title={t("agents")} />
      {agents.length === 0 ? (
        <EmptyState message={t("noProperties")} />
      ) : (
        agents.map((a) => (
          <Card key={a.id} style={{ marginBottom: spacing.md }}>
            <Text style={[typography.h3, { color: theme.text }]}>{a.name}</Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>{a.email}</Text>
            {a.specialties?.length > 0 && (
              <Text style={[typography.caption, { color: theme.accent, marginTop: 4 }]}>
                {a.specialties.join(" · ")}
              </Text>
            )}
            {a.bio && (
              <Text style={[typography.small, { color: theme.textMuted, marginTop: 6 }]} numberOfLines={3}>
                {a.bio}
              </Text>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
