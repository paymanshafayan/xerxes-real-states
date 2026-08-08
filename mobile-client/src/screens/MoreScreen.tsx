import React, { useState } from "react";
import { View, Text, Linking, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Screen, Card, IconListItem, BottomSheet } from "../components/ui";
import { colors, spacing, typography, radius } from "../theme";
import { useT, useLocaleStore } from "../store/locale";
import { useFavoritesStore } from "../store/favorites";
import { LOCALE_LABELS, type Locale } from "../i18n/strings";
import { API_URL, APP_NAME } from "../config";

const LOCALES: Locale[] = ["en", "tr", "fa", "ru"];

export default function MoreScreen() {
  const t = useT();
  const navigation = useNavigation<any>();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const favoritesCount = useFavoritesStore((s) => s.ids.length);
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [aboutSheetOpen, setAboutSheetOpen] = useState(false);

  return (
    <Screen scroll style={{ padding: 0 }}>
      {/* Decorative gradient header, matching the reference account screen */}
      <LinearGradient
        colors={[colors.overlayGradientStart, colors.overlayGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 30 }}>🏠</Text>
        </View>
        <Text style={styles.appName}>{APP_NAME}</Text>
      </LinearGradient>

      <View style={{ padding: spacing.md }}>
        <Card style={{ marginBottom: spacing.md }}>
          <IconListItem
            emoji="❤️"
            label={`${t("tabFavorites")}${favoritesCount ? ` (${favoritesCount})` : ""}`}
            onPress={() => navigation.navigate("Favorites")}
          />
          <IconListItem emoji="🧮" label={t("calculators")} onPress={() => navigation.navigate("Calculators")} />
          <IconListItem emoji="🌐" label={t("language")} onPress={() => setLangSheetOpen(true)} />
          <IconListItem emoji="ℹ️" label={t("about")} onPress={() => setAboutSheetOpen(true)} />
          <IconListItem emoji="🔗" label={t("visitWebsite")} onPress={() => Linking.openURL(API_URL)} />
        </Card>
      </View>

      <BottomSheet visible={langSheetOpen} onClose={() => setLangSheetOpen(false)}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>{t("language")}</Text>
        {LOCALES.map((l) => (
          <Text
            key={l}
            onPress={() => {
              setLocale(l);
              setLangSheetOpen(false);
            }}
            style={[
              styles.langOption,
              { color: locale === l ? colors.primary : colors.text, fontWeight: locale === l ? "700" : "400" },
            ]}
          >
            {LOCALE_LABELS[l]}
          </Text>
        ))}
      </BottomSheet>

      <BottomSheet visible={aboutSheetOpen} onClose={() => setAboutSheetOpen(false)}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>{t("about")}</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Xerxes Realty — Northern Cyprus real estate, in English, Türkçe, فارسی, and Русский.
        </Text>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  appName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  langOption: { fontSize: 16, paddingVertical: spacing.sm },
});
