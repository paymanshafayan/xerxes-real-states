import React from "react";
import { Feather } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, spacing, radius, typography, shadow } from "../theme";

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.screenPadding, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.h1, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
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
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const Cmp: any = onPress ? TouchableOpacity : View;
  return (
    <Cmp onPress={onPress} activeOpacity={0.85} style={[styles.card, style]}>
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
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isPrimary = variant === "primary";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.button,
        isPrimary ? { backgroundColor: colors.primary } : { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.textOnPrimary : colors.primary} />
      ) : (
        <Text style={[typography.h3, { color: isPrimary ? colors.textOnPrimary : colors.primary }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        active ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
      ]}
    >
      <Text style={[typography.body, { color: active ? colors.textOnPrimary : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Badge({ label, tone = "primary" }: { label: string; tone?: "primary" | "danger" | "success" }) {
  const bg = tone === "danger" ? colors.danger : tone === "success" ? colors.success : colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.small, { color: "#fff", fontWeight: "700" }]}>{label}</Text>
    </View>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  multiline?: boolean;
  style?: TextStyle;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[styles.input, multiline && { height: 100, textAlignVertical: "top" }, style]}
    />
  );
}

export function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <View style={styles.centered}>
      <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginBottom: spacing.md }]}>
        {message}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenPadding: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  button: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    justifyContent: "flex-end",
  },
  sheetBody: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
});

/** "New Arrival ... VIEW All" style section header used throughout the app. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[typography.h2, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[typography.body, { color: colors.primary, fontWeight: "700" }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Circular-icon menu row, matching the Account screen's "My Orders / Wish List / ..." rows. */
export function IconListItem({
  icon,
  label,
  onPress,
  tone = "primary",
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  tone?: "primary" | "danger";
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.iconListItem}>
      <View style={[styles.iconCircle, tone === "danger" && { backgroundColor: colors.danger }]}>
        <Feather name={icon} size={16} color={colors.textOnPrimary} />
      </View>
      <Text style={[typography.h3, { color: colors.text, fontWeight: "500" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Small square icon button for toolbars (grid/list toggle, filter, sort). */
export function IconButton({
  icon,
  onPress,
  active,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.iconButton, active && { backgroundColor: colors.primaryLight }]}
    >
      <Feather name={icon} size={17} color={colors.text} />
    </TouchableOpacity>
  );
}

/** Slide-up sheet used for filters and sort options, matching the reference screenshots. */
export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheetBody}>
          <View style={styles.sheetHandle} />
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
