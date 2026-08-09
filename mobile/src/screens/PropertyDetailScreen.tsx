import React, { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Audio } from "expo-av";
import { Screen, Header, Card, Button, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { getProperty, deleteProperty, type Property } from "../api/staff";
import { API_URL } from "../config";

function abs(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export default function PropertyDetailScreen() {
  const { theme } = useThemeStore();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as number;
  const qc = useQueryClient();
  const [playing, setPlaying] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getProperty(id),
  });
  const p = data as Property | undefined;

  if (isLoading) return <Loading />;
  if (!p) return <Screen><Header title={t("properties")} /></Screen>;

  const images = (p.images || []).map(abs).filter(Boolean) as string[];

  function onDelete() {
    Alert.alert(t("delete") || "Delete", "", [
      { text: t("cancel") || "Cancel", style: "cancel" },
      {
        text: t("delete") || "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteProperty(p!.id);
          qc.invalidateQueries({ queryKey: ["properties"] });
          nav.goBack();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header title={p.titleFa || p.titleEn} />

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {images.map((u, i) => (
            <Image key={i} source={{ uri: u }} style={{ width: 220, height: 150, borderRadius: 12, marginRight: 8 }} />
          ))}
        </ScrollView>
      )}

      {(p.panoramas?.length ?? 0) > 0 && (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}><Feather name="globe" size={16} color={theme.text} /> {t("panorama360")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {p.panoramas.map((u, i) => (
              <Image
                key={i}
                source={{ uri: abs(u)! }}
                style={{ width: 320, height: 150, borderRadius: 12, marginRight: 8 }}
              />
            ))}
          </ScrollView>
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
            {t("dragToLook") || "Drag to look around"}
          </Text>
        </Card>
      )}

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.h2, { color: theme.text }]}>
          {p.price?.toLocaleString()} {p.currency}
        </Text>
        <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>
          {p.city} · {p.category} · {p.bedrooms} bd · {p.bathrooms} ba · {p.area} m²
        </Text>
        {(p.panoramas?.length ?? 0) > 0 && (
          <Text style={[typography.caption, { color: theme.accent, marginTop: 6 }]}>
            <Feather name="globe" size={12} color={theme.accent} /> {p.panoramas.length} {t("panorama360")}
          </Text>
        )}
      </Card>

      {(p.videos?.length ?? 0) > 0 && (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>{t("video")}</Text>
          {p.videos.map((v, i) => (
            <Video key={i} source={{ uri: abs(v)! }} style={{ width: "100%", height: 200, borderRadius: 12 }} useNativeControls />
          ))}
        </Card>
      )}

      {(p.audioNotes?.length ?? 0) > 0 && (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>{t("audioNote")}</Text>
          {p.audioNotes.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={{ paddingVertical: 8 }}
              onPress={() => setPlaying(playing === a ? null : a)}
            >
              <Text style={{ color: theme.primary }}><Feather name="mic" size={14} color={theme.primary} /> {playing === a ? t("pause") || "Pause" : t("play") || "Play"}</Text>
              {playing === a && <AudioPlayer uri={abs(a)!} />}
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {p.features?.length > 0 && (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>{t("features") || "Features"}</Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>{p.features.join(" · ")}</Text>
        </Card>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button label={t("edit") || "Edit"} onPress={() => nav.navigate("PropertyForm", { id: p.id })} />
        <Button label={t("delete") || "Delete"} variant="danger" onPress={onDelete} />
      </View>
    </Screen>
  );
}

function AudioPlayer({ uri }: { uri: string }) {
  const [sound, setSound] = useState<any>(null);
  React.useEffect(() => {
    let active = true;
    (async () => {
      const { sound } = await Audio.Sound.createAsync({ uri });
      if (active) {
        setSound(sound);
        await sound.playAsync();
      }
    })();
    return () => {
      active = false;
      sound?.unloadAsync();
    };
  }, [uri]);
  return null;
}
