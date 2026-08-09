import React, { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { useThemeStore } from "../store/theme";
import { typography, spacing, radius } from "../theme";
import { t } from "../i18n";

export interface MediaState {
  images: string[];
  panoramas: string[];
  videos: string[];
  audioNotes: string[];
  documents: string[];
}

export default function MediaCapture({
  value,
  onChange,
}: {
  value: MediaState;
  onChange: (next: MediaState) => void;
}) {
  const { theme } = useThemeStore();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const update = (patch: Partial<MediaState>) =>
    onChange({ ...value, ...patch });

  const addTo = (key: keyof MediaState, uri: string) =>
    update({ [key]: [...value[key], uri] } as Partial<MediaState>);

  async function ensurePerms() {
    await ImagePicker.requestCameraPermissionsAsync();
    await Audio.requestPermissionsAsync();
  }

  async function capturePhoto(kind: "images" | "panoramas") {
    await ensurePerms();
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) addTo(kind, res.assets[0].uri);
  }

  async function pickGallery(kind: "images" | "panoramas" | "videos") {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        kind === "videos"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) addTo(kind, res.assets[0].uri);
  }

  async function recordVideo() {
    await ensurePerms();
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 180,
    });
    if (!res.canceled && res.assets[0]) addTo("videos", res.assets[0].uri);
  }

  async function captureDocument() {
    // Capture a document photo with the camera (stored as a document)
    await ensurePerms();
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled && res.assets[0]) addTo("documents", res.assets[0].uri);
  }

  async function pickDocument() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (!res.canceled && res.assets && res.assets[0]) {
        addTo("documents", res.assets[0].uri);
      }
    } catch {
      /* ignore */
    }
  }

  async function startAudio() {
    try {
      await ensurePerms();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync();
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      console.warn("audio start failed", e);
    }
  }

  async function stopAudio() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const dur =
        status && "durationMillis" in status
          ? Math.round((status as any).durationMillis / 1000)
          : 0;
      if (uri) addTo("audioNotes", uri);
      setRecording(null);
      setIsRecording(false);
    } catch (e) {
      console.warn("audio stop failed", e);
      setIsRecording(false);
    }
  }

  const counter = (n: number, label: string) => (
    <Text style={[typography.caption, { color: theme.textMuted }]}>
      {label}: {n}
    </Text>
  );

  return (
    <View style={{ marginTop: spacing.sm }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.sm }}>
        <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={() => capturePhoto("images")}>
          <Text style={[styles.btnLabel, { color: theme.text }]}>{t("takePhoto")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { borderColor: theme.accent }]} onPress={() => capturePhoto("panoramas")}>
          <Text style={[styles.btnLabel, { color: theme.accent }]}>{t("capture360")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={() => pickGallery("images")}>
          <Text style={[styles.btnLabel, { color: theme.text }]}>{t("pickFromGallery")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={recordVideo}>
          <Text style={[styles.btnLabel, { color: theme.text }]}>{t("recordVideo")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { borderColor: isRecording ? theme.danger : theme.border }]}
          onPressIn={startAudio}
          onPressOut={stopAudio}
        >
          <Text style={[styles.btnLabel, { color: isRecording ? theme.danger : theme.text }]}>
            {isRecording ? t("recording") : t("recordAudio")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={captureDocument}>
          <Text style={[styles.btnLabel, { color: theme.text }]}><Feather name="file-text" size={14} color={theme.text} /> {t("scanDocument") || "Scan"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={pickDocument}>
          <Text style={[styles.btnLabel, { color: theme.text }]}><Feather name="paperclip" size={14} color={theme.text} /> {t("pickDocument") || "File"}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" }}>
        {counter(value.images.length, t("images"))}
        {counter(value.panoramas.length, t("panorama360"))}
        {counter(value.videos.length, t("video"))}
        {counter(value.audioNotes.length, t("audioNote"))}
        {counter(value.documents.length, t("documents") || "Docs")}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  btnLabel: { fontSize: 13, fontWeight: "600" },
});
