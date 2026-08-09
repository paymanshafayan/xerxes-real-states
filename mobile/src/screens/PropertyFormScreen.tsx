import React, { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Screen, Field, Button, Header, Card, Loading } from "../components/ui";
import MediaCapture, { type MediaState } from "../components/MediaCapture";
import { useThemeStore } from "../store/theme";
import { typography, spacing, radius } from "../theme";
import { t } from "../i18n";
import {
  getProperty,
  translateAll,
  type Property,
} from "../api/staff";
import { useDraftStore, type PropertyDraft } from "../store/drafts";
import { submitDraft, isNetworkError } from "../lib/propertySubmit";

export default function PropertyFormScreen() {
  const { theme } = useThemeStore();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const editId = route.params?.id as number | undefined;
  const qc = useQueryClient();
  const drafts = useDraftStore();

  const [form, setForm] = useState({
    titleFa: "", titleEn: "", titleTr: "", titleRu: "",
    descFa: "", descEn: "", descTr: "", descRu: "",
    type: "sale", category: "apartment", price: "", currency: "GBP",
    bedrooms: "", bathrooms: "", area: "", city: "", district: "", address: "",
    features: "", lat: "", lng: "",
  });
  const [local, setLocal] = useState<MediaState>({ images: [], panoramas: [], videos: [], audioNotes: [], documents: [] });
  const [translating, setTranslating] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["property", editId],
    queryFn: () => getProperty(editId as number),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existing) {
      const p = existing as Property;
      setForm((f) => ({
        ...f,
        titleFa: p.titleFa || "", titleEn: p.titleEn || "", titleTr: p.titleTr || "", titleRu: p.titleRu || "",
        descFa: p.descriptionFa || "", descEn: p.descriptionEn || "", descTr: p.descriptionTr || "", descRu: p.descriptionRu || "",
        type: p.type, category: p.category, price: String(p.price), currency: p.currency,
        bedrooms: String(p.bedrooms), bathrooms: String(p.bathrooms), area: String(p.area),
        city: p.city, district: p.district || "", address: p.address || "",
        features: (p.features || []).join(", "),
        lat: p.lat != null ? String(p.lat) : "", lng: p.lng != null ? String(p.lng) : "",
      }));
    }
    drafts.load();
  }, [existing]);

  function set(key: string, v: string) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  async function onTranslate() {
    if (!form.titleFa && !form.descFa) return;
    setTranslating(true);
    try {
      const [tt, td] = await Promise.all([
        form.titleFa ? translateAll(form.titleFa, "fa") : null,
        form.descFa ? translateAll(form.descFa, "fa") : null,
      ]);
      setForm((f) => ({
        ...f,
        titleEn: tt?.en || f.titleEn, titleTr: tt?.tr || f.titleTr, titleRu: tt?.ru || f.titleRu,
        descEn: td?.en || f.descEn, descTr: td?.tr || f.descTr, descRu: td?.ru || f.descRu,
      }));
    } catch {
      Alert.alert(t("autoTranslate"), "Translation service unavailable");
    } finally {
      setTranslating(false);
    }
  }

  function toDraft(): PropertyDraft {
    return {
      id: editId ? String(editId) : `draft_${Date.now()}`,
      ...form,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      images: local.images,
      panoramas: local.panoramas,
      videos: local.videos,
      audioNotes: local.audioNotes,
      documents: local.documents,
      editId,
      updatedAt: Date.now(),
    };
  }

  async function onSubmit() {
    try {
      await submitDraft(toDraft());
      qc.invalidateQueries({ queryKey: ["properties"] });
      if (editId) drafts.remove(String(editId));
      Alert.alert(t("propertySaved"));
      nav.goBack();
    } catch (e: any) {
      if (isNetworkError(e)) {
        drafts.save({ ...toDraft(), pendingSync: true });
        Alert.alert("Saved offline", "Will sync automatically when back online.");
        nav.goBack();
      } else {
        Alert.alert("Error", e?.response?.data?.error || "Failed to save");
      }
    }
  }

  async function useCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      set("lat", String(pos.coords.latitude));
      set("lng", String(pos.coords.longitude));
    } catch {
      /* ignore */
    }
  }

  function saveDraft() {
    drafts.save(toDraft());
    Alert.alert(t("draftSaved"));
  }

  function loadDraft(d: PropertyDraft) {
    setForm((f) => ({
      ...f,
      ...d,
      lat: d.lat != null ? String(d.lat) : "",
      lng: d.lng != null ? String(d.lng) : "",
    }));
    setLocal({ images: d.images, panoramas: d.panoramas, videos: d.videos, audioNotes: d.audioNotes, documents: d.documents || [] });
    setShowDrafts(false);
  }

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <Header title={editId ? t("properties") : t("addProperty")} />

      <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
        <Button label={t("saveDraft")} variant="ghost" onPress={saveDraft} />
        <View style={{ width: 8 }} />
        <Button label={`${t("drafts")} (${drafts.drafts.length})`} variant="ghost" onPress={() => setShowDrafts(true)} />
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.sm }]}>{t("title")} (FA)</Text>
        <Field label={`${t("title")} (FA)`} value={form.titleFa} onChangeText={(v) => set("titleFa", v)} />
        <Field label={`${t("title")} (EN)`} value={form.titleEn} onChangeText={(v) => set("titleEn", v)} />
        <Field label={`${t("description")} (FA)`} value={form.descFa} onChangeText={(v) => set("descFa", v)} multiline />
        <TouchableOpacity onPress={onTranslate} disabled={translating}>
          <Text style={[typography.small, { color: theme.accent, marginBottom: spacing.sm }]}>
            {translating ? t("translating") : (<><Feather name="zap" size={12} color={theme.accent} /> {t("autoTranslate")}</>)}
          </Text>
        </TouchableOpacity>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <Field label={t("type")} value={form.type} onChangeText={(v) => set("type", v)} />
        <Field label={t("category")} value={form.category} onChangeText={(v) => set("category", v)} />
        <Field label={t("price")} value={form.price} onChangeText={(v) => set("price", v)} keyboardType="numeric" />
        <Field label={t("currency")} value={form.currency} onChangeText={(v) => set("currency", v)} />
        <Field label={t("bedrooms")} value={form.bedrooms} onChangeText={(v) => set("bedrooms", v)} keyboardType="numeric" />
        <Field label={t("bathrooms")} value={form.bathrooms} onChangeText={(v) => set("bathrooms", v)} keyboardType="numeric" />
        <Field label={t("area")} value={form.area} onChangeText={(v) => set("area", v)} keyboardType="numeric" />
        <Field label={t("city")} value={form.city} onChangeText={(v) => set("city", v)} />
        <Field label={t("address")} value={form.address} onChangeText={(v) => set("address", v)} />
        <TouchableOpacity onPress={useCurrentLocation} style={{ marginBottom: spacing.md }}>
          <Text style={[typography.small, { color: theme.primary }]}>
            <Feather name="map-pin" size={12} color={theme.primary} /> {form.lat && form.lng ? `${form.lat}, ${form.lng}` : (t("useCurrentLocation") || "Use current location")}
          </Text>
        </TouchableOpacity>
        <Field label={t("features")} value={form.features} onChangeText={(v) => set("features", v)} placeholder="pool, garden, ..." />
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.sm }]}>{t("images")} / 360 / {t("video")} / {t("audioNote")}</Text>
        <MediaCapture value={local} onChange={setLocal} />
      </Card>

      <Button label={t("submit")} full loading={false} onPress={onSubmit} />
      <View style={{ height: spacing.xl }} />

      <Modal visible={showDrafts} transparent animationType="slide">
        <View style={[styles.modalBack, { backgroundColor: "#00000080" }]}>
          <View style={[styles.modal, { backgroundColor: theme.card, borderRadius: radius.lg, padding: spacing.lg }]}>
            <Text style={[typography.h3, { color: theme.text, marginBottom: spacing.md }]}>{t("drafts")}</Text>
            {drafts.drafts.length === 0 ? (
              <Text style={[typography.small, { color: theme.textMuted }]}>{t("noProperties")}</Text>
            ) : (
              drafts.drafts.map((d) => (
                <TouchableOpacity key={d.id} style={{ paddingVertical: spacing.sm }} onPress={() => loadDraft(d)}>
                  <Text style={[typography.body, { color: theme.text }]}>{d.titleFa || "(بدون عنوان)"}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {new Date(d.updatedAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <Button label={t("cancel")} variant="ghost" onPress={() => setShowDrafts(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modalBack: { flex: 1, justifyContent: "flex-end" },
  modal: { maxHeight: "70%" },
});
