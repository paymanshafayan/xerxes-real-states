import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../theme";
import { useT } from "../store/locale";

const ITEMS: { key: string; emoji: string; bg: string; action: (nav: any) => void }[] = [
  { key: "forSale", emoji: "🏡", bg: "#dbeafe", action: (nav) => nav.navigate("SearchTab", { screen: "Search", params: { type: "sale" } }) },
  { key: "forRent", emoji: "🔑", bg: "#dcfce7", action: (nav) => nav.navigate("SearchTab", { screen: "Search", params: { type: "rent" } }) },
  { key: "villa", emoji: "🏖️", bg: "#fce7f3", action: (nav) => nav.navigate("SearchTab", { screen: "Search", params: { category: "villa" } }) },
  { key: "apartment", emoji: "🏢", bg: "#ede9fe", action: (nav) => nav.navigate("SearchTab", { screen: "Search", params: { category: "apartment" } }) },
  { key: "land", emoji: "🌳", bg: "#fef9c3", action: (nav) => nav.navigate("SearchTab", { screen: "Search", params: { category: "land" } }) },
  { key: "commercial", emoji: "🏬", bg: "#ffe4e6", action: (nav) => nav.navigate("SearchTab", { screen: "Search", params: { category: "commercial" } }) },
  { key: "tabPriceDrops", emoji: "📉", bg: "#fee2e2", action: (nav) => nav.navigate("PriceDropsTab") },
  { key: "tabFavorites", emoji: "❤️", bg: "#e0f2fe", action: (nav) => nav.navigate("MoreTab", { screen: "Favorites" }) },
];

export function CategoryGrid() {
  const t = useT();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.grid}>
      {ITEMS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.item}
          activeOpacity={0.75}
          onPress={() => item.action(navigation)}
        >
          <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
            <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
          </View>
          <Text numberOfLines={1} style={[typography.small, { color: colors.text, marginTop: 6 }]}>
            {t(item.key)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.lg },
  item: { width: "25%", alignItems: "center", marginBottom: spacing.md },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
