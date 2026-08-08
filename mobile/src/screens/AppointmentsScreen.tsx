import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Card, Header, Field, Button, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { listAppointments, createAppointment, updateAppointment, deleteAppointment } from "../api/staff";

const STATUSES = ["new", "confirmed", "completed", "cancelled"];

export default function AppointmentsScreen() {
  const { theme } = useThemeStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", time: "", message: "" });

  const { data, isLoading } = useQuery({ queryKey: ["appointments"], queryFn: () => listAppointments() });
  const items: any[] = data ?? [];

  const createMut = useMutation({
    mutationFn: () => createAppointment(form),
    onSuccess: () => { setShowForm(false); setForm({ name: "", email: "", phone: "", date: "", time: "", message: "" }); qc.invalidateQueries({ queryKey: ["appointments"] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.error || "Error"),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateAppointment(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <Header title={t("appointments")} />
      <Button label={showForm ? t("cancel") : "+ " + (t("appointments") || "Appointment")} variant="ghost" onPress={() => setShowForm((v) => !v)} />

      {showForm && (
        <Card style={{ marginVertical: spacing.md }}>
          <Field label={t("name")} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Field label={t("email")} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          <Field label={t("phone") || "Phone"} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
          <Field label={t("date") || "Date (YYYY-MM-DD)"} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
          <Field label={t("time") || "Time (HH:MM)"} value={form.time} onChangeText={(v) => setForm({ ...form, time: v })} />
          <Field label={t("notes") || "Notes"} value={form.message} onChangeText={(v) => setForm({ ...form, message: v })} multiline />
          <Button label={t("saveProperty") || "Save"} loading={createMut.isPending} onPress={() => createMut.mutate()} />
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState message={t("noChats")} />
      ) : (
        items.map((a) => (
          <Card key={a.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[typography.h3, { color: theme.text }]}>{a.name}</Text>
              <TouchableOpacity onPress={() => delMut.mutate(a.id)}>
                <Text style={{ color: theme.danger }}>🗑</Text>
              </TouchableOpacity>
            </View>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>
              {a.date} {a.time} · {a.email}
            </Text>
            <View style={{ flexDirection: "row", marginTop: spacing.sm, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[{
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1,
                    marginRight: 6, marginBottom: 6,
                    borderColor: a.status === s ? theme.primary : theme.border,
                    backgroundColor: a.status === s ? theme.primarySoft : theme.surface,
                  }]}
                  onPress={() => statusMut.mutate({ id: a.id, status: s })}
                >
                  <Text style={[typography.caption, { color: a.status === s ? theme.primary : theme.textMuted }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
