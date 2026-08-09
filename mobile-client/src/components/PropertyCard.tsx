import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Property } from "../api/types";
import { colors, spacing, radius, typography, shadow } from "../theme";
import { useFavoritesStore } from "../store/favorites";
import { useT, useLocaleStore } from "../store/locale";
import type { Locale } from "../i18n/strings";

function titleFor(property: Property, locale: Locale): string {
  switch (locale) {
    case "en":
      return property.titleEn;
    case "tr":
      return property.titleTr;
    case "ru":
      return property.titleRu;
    default:
      return property.titleFa;
  }
}

function formatPrice(price: number, currency: string): string {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  return `${symbol}${price.toLocaleString()}`;
}

export function PropertyCard({
  property,
  onPress,
  variant = "grid",
}: {
  property: Property;
  onPress: () => void;
  variant?: "grid" | "list";
}) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const { isFavorite, toggle } = useFavoritesStore();
  const favorite = isFavorite(property.id);
  const hasDrop = !!property.previousPrice && property.previousPrice > property.price;

  if (variant === "list") {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.listCard}>
        <View style={styles.listImageWrap}>
          <Image source={{ uri: property.images[0] }} style={styles.image} resizeMode="cover" />
          {hasDrop && (
            <View style={styles.dropBadge}>
              <Text style={styles.dropBadgeText}>{t("priceDropBadge")}</Text>
            </View>
          )}
        </View>
        <View style={styles.listBody}>
          <Text numberOfLines={1} style={[typography.h3, { color: colors.text }]}>
            {titleFor(property, locale)}
          </Text>
          <Text numberOfLines={1} style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
            {property.city}
          </Text>
          <Text style={[typography.h3, { color: colors.primary, marginTop: 4 }]}>
            {formatPrice(property.price, property.currency)}
            {property.type === "rent" ? t("perMonth") : ""}
          </Text>
          {hasDrop && (
            <Text style={styles.wasPrice}>
              {t("was")} {formatPrice(property.previousPrice!, property.currency)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => toggle(property.id)}
          style={styles.listFavoriteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={favorite ? "heart" : "heart-outline"} size={16} color={favorite ? colors.danger : colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: property.images[0] }} style={styles.image} resizeMode="cover" />
        <TouchableOpacity
          onPress={() => toggle(property.id)}
          style={styles.favoriteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={favorite ? "heart" : "heart-outline"} size={16} color={favorite ? colors.danger : colors.textMuted} />
        </TouchableOpacity>
        {hasDrop && (
          <View style={styles.dropBadge}>
            <Text style={styles.dropBadgeText}>{t("priceDropBadge")}</Text>
          </View>
        )}
        {property.isFeatured && !hasDrop && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={11} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[typography.h3, { color: colors.text }]}>
          {titleFor(property, locale)}
        </Text>
        <Text numberOfLines={1} style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
          {property.city}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[typography.h3, { color: colors.primary }]}>
            {formatPrice(property.price, property.currency)}
            {property.type === "rent" ? t("perMonth") : ""}
          </Text>
        </View>
        {hasDrop && (
          <Text style={styles.wasPrice}>
            {t("was")} {formatPrice(property.previousPrice!, property.currency)}
          </Text>
        )}
        <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
          {property.bedrooms} {t("bedrooms")} · {property.bathrooms} {t("bathrooms")} · {property.area} {t("sqm")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: "hidden",
    margin: spacing.xs,
    ...shadow.card,
  },
  imageWrap: { width: "100%", height: 130, backgroundColor: colors.surface },
  image: { width: "100%", height: "100%" },
  favoriteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radius.full,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.discount,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.star,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  dropBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: spacing.sm },
  priceRow: { marginTop: 4 },
  wasPrice: { fontSize: 11, color: colors.textMuted, textDecorationLine: "line-through", marginTop: 2 },
  listCard: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    alignItems: "center",
    ...shadow.card,
  },
  listImageWrap: { width: 90, height: 90, backgroundColor: colors.surface },
  listBody: { flex: 1, paddingHorizontal: spacing.sm },
  listFavoriteBtn: { padding: spacing.sm },
});
