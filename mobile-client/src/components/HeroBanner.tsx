import React, { useRef, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Property } from "../api/types";
import { colors, spacing, radius } from "../theme";
import { useT, useLocaleStore } from "../store/locale";
import type { Locale } from "../i18n/strings";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - spacing.xs * 2;
const BANNER_HEIGHT = 190;

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

export function HeroBanner({
  properties,
  onPressItem,
}: {
  properties: Property[];
  onPressItem: (id: number) => void;
}) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveIndex(index);
  }

  if (properties.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={properties}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `banner-${item.id}`}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => onPressItem(item.id)} style={styles.slide}>
            <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
            <LinearGradient
              colors={[colors.overlayGradientStart + "cc", colors.overlayGradientEnd + "55", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.slideContent}>
              <Text numberOfLines={2} style={styles.slideTitle}>
                {titleFor(item, locale)}
              </Text>
              <Text style={styles.slidePrice}>{formatPrice(item.price, item.currency)}</Text>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText}>{t("browseProperties")}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.dots}>
        {properties.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  slide: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  image: { width: "100%", height: "100%", position: "absolute" },
  slideContent: { flex: 1, justifyContent: "flex-end", padding: spacing.md },
  slideTitle: { color: "#fff", fontSize: 19, fontWeight: "700", marginBottom: 4 },
  slidePrice: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: spacing.sm },
  ctaButton: {
    backgroundColor: colors.accent,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  ctaText: { color: "#1f2937", fontWeight: "700", fontSize: 12 },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border, marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.primary, width: 16 },
});
