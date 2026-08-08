import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, Card, Header, Field, Button } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { useAuthStore, clearAuth } from "../store/auth";
import { updateMe, changePassword } from "../api/staff";

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const staff = useAuthStore((s) => s.staff);
  const setStaff = useAuthStore((s) => s.setStaff);
  const nav = useNavigation<any>();

  const [editMode, setEditMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [form, setForm] = useState({ name: staff?.name || "", email: staff?.email || "", phone: staff?.phone || "" });
  const [pw, setPw] = useState({ current: "", next: "" });

  async function saveProfile() {
    try {
      const res = await updateMe(form);
      if (res?.staff) setStaff(res.staff);
      setEditMode(false);
      Alert.alert(t("success"));
    } catch (e: any) {
      Alert.alert(e?.response?.data?.error || "Error");
    }
  }

  async function savePassword() {
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "" });
      setPwMode(false);
      Alert.alert(t("success"));
    } catch (e: any) {
      Alert.alert(e?.response?.data?.error || "Error");
    }
  }

  const navBtn = (label: string, target: string) => (
    <TouchableOpacity
      style={{ paddingVertical: spacing.sm }}
      onPress={() => nav.navigate(target)}
    >
      <Text style={[typography.h3, { color: theme.primary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <Header title={t("profile")} />

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h2, { color: theme.text }]}>{staff?.name}</Text>
        <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>
          @{staff?.username} · {staff?.role === "manager" ? t("roleManager") : t("roleConsultant")}
        </Text>
        <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>{staff?.email}</Text>
        <Text style={[typography.caption, { color: theme.accent, marginTop: 6 }]}>
          {staff?.role === "manager" ? t("managerFullAccess") : t("consultantLimited")}
        </Text>
        <TouchableOpacity style={{ marginTop: spacing.sm }} onPress={() => setEditMode((v) => !v)}>
          <Text style={{ color: theme.primary }}>{t("edit")}</Text>
        </TouchableOpacity>
      </Card>

      {editMode && (
        <Card style={{ marginBottom: spacing.lg }}>
          <Field label={t("name")} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Field label={t("email")} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          <Field label={t("phone") || "Phone"} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
          <Button label={t("saveProperty") || "Save"} onPress={saveProfile} />
        </Card>
      )}

      {staff?.role === "manager" && (
        <Card style={{ marginBottom: spacing.lg }}>
          {navBtn(t("roleConsultant") + "s", "StaffManagement")}
          {navBtn(t("agents"), "Agents")}
        </Card>
      )}

      <Card style={{ marginBottom: spacing.lg }}>
        {navBtn(t("settings"), "Settings")}
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.sm }]}>{t("changePassword")}</Text>
        {!pwMode ? (
          <TouchableOpacity onPress={() => setPwMode(true)}>
            <Text style={{ color: theme.primary }}>{t("changePassword")}</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Field label={t("currentPassword")} value={pw.current} onChangeText={(v) => setPw({ ...pw, current: v })} secure />
            <Field label={t("newPassword")} value={pw.next} onChangeText={(v) => setPw({ ...pw, next: v })} secure />
            <Button label={t("saveProperty") || "Save"} onPress={savePassword} />
          </View>
        )}
      </Card>

      <Button label={t("logout")} variant="danger" full onPress={() => { clearAuth(); nav.reset({ index: 0, routes: [{ name: "Login" }] }); }} />
    </Screen>
  );
}
