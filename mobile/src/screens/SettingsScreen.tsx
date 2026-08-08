import React from "react";
import { View, Text } from "react-native";
import { Screen, Card, Header, Chip } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t, setLocale } from "../i18n";
import { i18n } from "../i18n";
import { LOCALES, LOCALE_LABELS, type Locale } from "../i18n/strings";

export default function SettingsScreen() {
  const { theme, isDark, toggle } = useThemeStore();

  return (
    <Screen>
      <Header title={t("settings")} />

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.sm }]}>{t("darkMode")}</Text>
        <View style={{ flexDirection: "row" }}>
          <Chip label={isDark ? "ON" : "OFF"} active={isDark} onPress={toggle} />
        </View>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.sm }]}>{t("language")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {LOCALES.map((l: Locale) => (
            <Chip key={l} label={LOCALE_LABELS[l]} active={i18n.locale === l} onPress={() => setLocale(l)} />
          ))}
        </View>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.sm }]}>{t("about")}</Text>
        <Text style={[typography.small, { color: theme.textMuted }]}>
          {t("appName")} — {t("managerFullAccess")} / {t("consultantLimited")}
        </Text>
      </Card>
    </Screen>
  );
}
