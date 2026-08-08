import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Card, Header, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing, radius } from "../theme";
import { t } from "../i18n";
import { listProperties, listLeads, listInquiries, type Property } from "../api/staff";

export default function SearchScreen() {
  const { theme } = useThemeStore();
  const nav = useNavigation<any>();
  const [q, setQ] = useState("");

  const { data: properties, isLoading: lp } = useQuery({
    queryKey: ["search-props", q],
    queryFn: () => listProperties({ limit: 50, search: q || undefined }),
    enabled: q.length > 0,
  });
  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: () => listLeads() });
  const { data: inquiries } = useQuery({ queryKey: ["inquiries"], queryFn: () => listInquiries() });

  const props: Property[] = (properties ?? []).filter((p) =>
    q.length === 0 ? false : true
  );
  const matchedLeads = (leads ?? []).filter((l: any) =>
    `${l.name} ${l.email}`.toLowerCase().includes(q.toLowerCase())
  );
  const matchedInquiries = (inquiries ?? []).filter((i: any) =>
    `${i.name} ${i.email} ${i.message}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Screen>
      <Header title={t("search")} />
      <View style={{ padding: spacing.lg }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t("search")}
          placeholderTextColor={theme.textMuted}
          style={[typography.body, { backgroundColor: theme.surface, color: theme.text, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
        />
      </View>

      {lp ? (
        <Loading />
      ) : q.length === 0 ? (
        <EmptyState message={t("search")} />
      ) : (
        <View style={{ padding: spacing.lg }}>
          {props.length > 0 && (
            <>
              <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.sm }]}>{t("properties")}</Text>
              {props.map((p) => (
                <Card key={p.id} style={{ marginBottom: spacing.sm }} onPress={() => nav.navigate("PropertyDetail", { id: p.id })}>
                  <Text style={[typography.body, { color: theme.text }]}>{p.titleFa || p.titleEn}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>{p.city} · {p.price?.toLocaleString()} {p.currency}</Text>
                </Card>
              ))}
            </>
          )}
          {matchedLeads.length > 0 && (
            <>
              <Text style={[typography.h3, { color: theme.text, marginVertical: spacing.sm }]}>{t("leads")}</Text>
              {matchedLeads.map((l: any) => (
                <Card key={l.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={[typography.body, { color: theme.text }]}>{l.name}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>{l.email}</Text>
                </Card>
              ))}
            </>
          )}
          {matchedInquiries.length > 0 && (
            <>
              <Text style={[typography.h3, { color: theme.text, marginVertical: spacing.sm }]}>{t("inquiries")}</Text>
              {matchedInquiries.map((i: any) => (
                <Card key={i.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={[typography.body, { color: theme.text }]}>{i.name}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={2}>{i.message}</Text>
                </Card>
              ))}
            </>
          )}
          {props.length === 0 && matchedLeads.length === 0 && matchedInquiries.length === 0 && (
            <EmptyState message={t("noProperties")} />
          )}
        </View>
      )}
    </Screen>
  );
}
