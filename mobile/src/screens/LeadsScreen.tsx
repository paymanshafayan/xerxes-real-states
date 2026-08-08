import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Card, Header, Field, Button, EmptyState, Loading } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { listLeads, createLead, updateLead } from "../api/staff";

const STATUSES = ["new", "contacted", "qualified", "lost", "won"];

export default function LeadsScreen() {
  const { theme } = useThemeStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "website", status: "new", notes: "" });

  const { data, isLoading } = useQuery({ queryKey: ["leads"], queryFn: () => listLeads() });
  const leads: any[] = data ?? [];

  const createMut = useMutation({
    mutationFn: () => createLead(form),
    onSuccess: () => { setShowForm(false); setForm({ name: "", email: "", phone: "", source: "website", status: "new", notes: "" }); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.error || "Error"),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateLead(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <Header title={t("leads")} />
      <Button label={showForm ? t("cancel") : "+ " + (t("leads") || "Lead")} variant="ghost" onPress={() => setShowForm((v) => !v)} />

      {showForm && (
        <Card style={{ marginVertical: spacing.md }}>
          <Field label={t("name")} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Field label={t("email")} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          <Field label={t("phone") || "Phone"} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
          <Field label={t("notes") || "Notes"} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
          <Button label={t("saveProperty") || "Save"} loading={createMut.isPending} onPress={() => createMut.mutate()} />
        </Card>
      )}

      {leads.length === 0 ? (
        <EmptyState message={t("noChats")} />
      ) : (
        leads.map((l) => (
          <Card key={l.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[typography.h3, { color: theme.text }]}>{l.name}</Text>
              <Text style={[typography.caption, { color: theme.accent }]}>{l.priority}</Text>
            </View>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>{l.email} · {l.phone || "-"}</Text>
            <View style={{ flexDirection: "row", marginTop: spacing.sm, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[{
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1,
                    marginRight: 6, marginBottom: 6,
                    borderColor: l.status === s ? theme.primary : theme.border,
                    backgroundColor: l.status === s ? theme.primarySoft : theme.surface,
                  }]}
                  onPress={() => statusMut.mutate({ id: l.id, status: s })}
                >
                  <Text style={[typography.caption, { color: l.status === s ? theme.primary : theme.textMuted }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
