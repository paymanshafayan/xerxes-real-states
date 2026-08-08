import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Card, Header, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { listInquiries, updateInquiryStatus } from "../api/staff";

const STATUSES = ["new", "contacted", "closed"];

export default function InquiriesScreen() {
  const { theme } = useThemeStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: () => listInquiries(),
  });
  const items: any[] = data ?? [];

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateInquiryStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inquiries"] }),
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <Header title={t("inquiries") || "Inquiries"} />
      {items.length === 0 ? (
        <EmptyState message={t("noChats")} />
      ) : (
        items.map((q) => (
          <Card key={q.id} style={{ marginBottom: spacing.md }}>
            <Text style={[typography.h3, { color: theme.text }]}>{q.name}</Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>
              {q.email} · {q.phone || "-"}
            </Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]} numberOfLines={3}>
              {q.message}
            </Text>
            <View style={{ flexDirection: "row", marginTop: spacing.sm, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    {
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 20,
                      borderWidth: 1,
                      marginRight: 6,
                      marginBottom: 6,
                      borderColor: q.status === s ? theme.primary : theme.border,
                      backgroundColor: q.status === s ? theme.primarySoft : theme.surface,
                    },
                  ]}
                  onPress={() => mutation.mutate({ id: q.id, status: s })}
                >
                  <Text style={[typography.caption, { color: q.status === s ? theme.primary : theme.textMuted }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
