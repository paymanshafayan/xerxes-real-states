import React from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Header, Card, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { getStats } from "../api/staff";

export default function DashboardScreen() {
  const { theme } = useThemeStore();
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: () => getStats() });

  if (isLoading) return <Loading />;

  const stats = data?.stats || {};
  const cards: [string, string | number][] = [
    [t("properties"), stats.propertyCount ?? 0],
    [t("leads"), stats.leadCount ?? 0],
    [t("appointments"), stats.appointmentCount ?? 0],
    ["Inquiries", stats.inquiryCount ?? 0],
  ];

  return (
    <Screen>
      <Header title={`${t("welcome")}, ${t("dashboard")}`} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {cards.map(([label, val]) => (
          <Card key={label} style={{ width: "48%", marginBottom: spacing.md }}>
            <Text style={[typography.h1, { color: theme.primary }]}>{val}</Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>{label}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
