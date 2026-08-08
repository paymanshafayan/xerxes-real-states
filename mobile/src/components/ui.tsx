import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useThemeStore } from "../store/theme";
import { typography, spacing, radius } from "../theme";
import { t } from "../i18n";

export function useT() {
  return t;
}

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: any;
}) {
  const { theme } = useThemeStore();
  const content = <View style={[styles.screen, { backgroundColor: theme.background }, style]}>{children}</View>;
  if (scroll) {
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.screenPadding, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return content;
}

export function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { theme } = useThemeStore();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.h1, { color: theme.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}) {
  const { theme } = useThemeStore();
  const Cmp = onPress ? TouchableOpacity : View;
  return (
    <Cmp
      onPress={onPress}
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </Cmp>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "ghost" | "accent" | "danger";
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
}) {
  const { theme } = useThemeStore();
  const bg =
    variant === "primary"
      ? theme.primary
      : variant === "accent"
      ? theme.accent
      : variant === "danger"
      ? theme.danger
      : "transparent";
  const color = variant === "ghost" ? theme.primary : "#FFFFFF";
  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.primary,
          opacity: disabled ? 0.5 : 1,
          width: full ? "100%" : undefined,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[typography.body, { color, fontWeight: "600" }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
  secure?: boolean;
}) {
  const { theme } = useThemeStore();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.small, { color: theme.textMuted, marginBottom: 6 }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        style={[
          typography.body,
          {
            backgroundColor: theme.surface,
            color: theme.text,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            minHeight: multiline ? 96 : 44,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { theme } = useThemeStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: active ? theme.selectedBorder : theme.border,
          backgroundColor: active ? theme.primarySoft : theme.surface,
          marginRight: 8,
          marginBottom: 8,
        },
      ]}
    >
      <Text style={[typography.small, { color: active ? theme.primary : theme.textMuted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ message }: { message: string }) {
  const { theme } = useThemeStore();
  return (
    <View style={{ padding: spacing.xxl, alignItems: "center" }}>
      <Text style={[typography.body, { color: theme.textMuted, textAlign: "center" }]}>
        {message}
      </Text>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { theme } = useThemeStore();
  return (
    <View style={{ padding: spacing.xxl, alignItems: "center" }}>
      <ActivityIndicator color={theme.primary} />
      {label && (
        <Text style={[typography.small, { color: theme.textMuted, marginTop: 8 }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenPadding: { padding: spacing.lg },
});
