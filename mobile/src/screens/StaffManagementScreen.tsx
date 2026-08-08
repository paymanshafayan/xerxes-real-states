import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Card, Header, Field, Button, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { listStaff, createStaff, updateStaff, deleteStaff, type Staff } from "../api/staff";

export default function StaffManagementScreen() {
  const { theme } = useThemeStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "", name: "", email: "", password: "", role: "consultant",
  });

  const { data, isLoading } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const staffList: Staff[] = data ?? [];

  const createMut = useMutation({
    mutationFn: () => createStaff(form),
    onSuccess: () => {
      setShowForm(false);
      setForm({ username: "", name: "", email: "", password: "", role: "consultant" });
      qc.invalidateQueries({ queryKey: ["staff"] });
      Alert.alert(t("success") || "OK");
    },
    onError: (e: any) => Alert.alert(e?.response?.data?.error || "Error"),
  });

  const toggleMut = useMutation({
    mutationFn: (s: Staff) => updateStaff(s.id, { status: s.status === "active" ? "disabled" : "active" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <Header title={t("roleConsultant") + "s"} />
      <View style={{ marginBottom: spacing.md }}>
        <Button label={showForm ? t("cancel") : "+ " + (t("roleConsultant") || "Consultant")} variant="ghost" onPress={() => setShowForm((v) => !v)} />
      </View>

      {showForm && (
        <Card style={{ marginBottom: spacing.lg }}>
          <Field label={t("username")} value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} />
          <Field label={t("name") || "Name"} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Field label={t("email")} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          <Field label={t("password") || "Password"} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secure />
          <Button label={t("saveProperty") || "Save"} loading={createMut.isPending} onPress={() => createMut.mutate()} />
        </Card>
      )}

      {staffList.length === 0 ? (
        <EmptyState message={t("noProperties")} />
      ) : (
        staffList.map((s) => (
          <Card key={s.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={[typography.h3, { color: theme.text }]}>{s.name}</Text>
                <Text style={[typography.small, { color: theme.textMuted }]}>@{s.username} · {s.role}</Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  style={{ paddingHorizontal: 10, justifyContent: "center" }}
                  onPress={() => toggleMut.mutate(s)}
                >
                  <Text style={{ color: s.status === "active" ? theme.danger : theme.success }}>
                    {s.status === "active" ? "Disable" : "Enable"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 10, justifyContent: "center" }}
                  onPress={() => delMut.mutate(s.id)}
                >
                  <Text style={{ color: theme.danger }}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
