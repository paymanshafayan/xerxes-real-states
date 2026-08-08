import React, { useState } from "react";
import { View, Text, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, Field, Button, Header } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { login } from "../api/staff";

export default function LoginScreen() {
  const { theme } = useThemeStore();
  const nav = useNavigation<any>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit() {
    setError("");
    if (!username || !password) {
      setError(t("invalidCredentials"));
      return;
    }
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res?.success) {
        // App will switch to the main navigator automatically (token updated)
      } else {
        setError(res?.error || t("invalidCredentials"));
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen style={{ justifyContent: "center" }}>
      <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Text style={[typography.h2, { color: "#fff" }]}>X</Text>
        </View>
        <Text style={[typography.h2, { color: theme.text }]}>{t("appName")}</Text>
        <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>
          {t("managerFullAccess")} · {t("consultantLimited")}
        </Text>
      </View>

      <Header title={t("login")} />

      <Field label={t("username")} value={username} onChangeText={setUsername} />
      <Field
        label={t("password")}
        value={password}
        onChangeText={setPassword}
        secure
      />

      {error ? (
        <Text style={[typography.small, { color: theme.danger, marginBottom: spacing.sm }]}>
          {error}
        </Text>
      ) : null}

      <Button label={loading ? t("loggingIn") : t("loginButton")} loading={loading} full onPress={onSubmit} />
    </Screen>
  );
}
