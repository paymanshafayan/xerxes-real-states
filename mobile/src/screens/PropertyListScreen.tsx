import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Card, Header, EmptyState, Loading, Button } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing, radius } from "../theme";
import { t } from "../i18n";
import { listProperties, type Property } from "../api/staff";

const PAGE = 20;

export default function PropertyListScreen() {
  const { theme } = useThemeStore();
  const nav = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["properties", search],
    queryFn: () => listProperties({ limit: PAGE, offset: 0, search: search || undefined }),
  });

  const all = useQuery({
    queryKey: ["properties-more", search, offset],
    queryFn: () => listProperties({ limit: PAGE, offset, search: search || undefined }),
    enabled: offset > 0,
  });

  const items: Property[] = [...(data ?? []), ...(all.data ?? [])];

  return (
    <Screen style={{ padding: 0 }} scroll={false}>
      <View style={[styles.head, { padding: spacing.lg, backgroundColor: theme.background }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Header title={t("properties")} subtitle={`${items.length} ${t("properties").toLowerCase()}`} />
          <TouchableOpacity
            style={{ padding: 8, borderRadius: 10, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
            onPress={() => nav.navigate("Map")}
          >
            <Text style={{ fontSize: 18 }}>🗺️</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={search}
          onChangeText={(v) => { setSearch(v); setOffset(0); }}
          placeholder={t("search") || "Search"}
          placeholderTextColor={theme.textMuted}
          style={[typography.body, { backgroundColor: theme.surface, color: theme.text, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.sm }]}
        />
      </View>

      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState message={t("noProperties")} />
      ) : (
        <View style={{ padding: spacing.lg }}>
          {items.map((p) => (
            <Card
              key={p.id}
              style={{ marginBottom: spacing.md }}
              onPress={() => nav.navigate("PropertyDetail", { id: p.id })}
            >
              <Text style={[typography.h3, { color: theme.text }]}>{p.titleFa || p.titleEn}</Text>
              <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>
                {p.city} · {p.category} · {p.price?.toLocaleString()} {p.currency}
              </Text>
              <Text style={[typography.caption, { color: theme.accent, marginTop: 6 }]}>
                {p.images.length} {t("images")} · {p.panoramas.length} {t("panorama360")} · {p.videos.length} {t("video")} · {p.audioNotes.length} {t("audioNote")}
              </Text>
            </Card>
          ))}
          {items.length >= PAGE && (
            <Button label={t("loadMore") || "Load more"} variant="ghost" onPress={() => setOffset((o) => o + PAGE)} />
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => nav.navigate("PropertyForm", { id: undefined })}
      >
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>+</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { borderBottomWidth: 1, borderBottomColor: "#00000020" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
