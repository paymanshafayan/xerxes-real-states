import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fetchProperties } from "../api/properties";
import { PropertyCard } from "../components/PropertyCard";
import { LoadingView, EmptyState, Chip, Input, Button, IconButton, BottomSheet } from "../components/ui";
import { colors, spacing, typography } from "../theme";
import { useT } from "../store/locale";
import type { Property, PropertyFilters } from "../api/types";

const CATEGORIES = ["apartment", "villa", "land", "commercial"] as const;
type SortKey = "newest" | "priceLow" | "priceHigh";

export default function SearchScreen() {
  const t = useT();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | undefined>(route.params?.type);
  const [category, setCategory] = useState<string | undefined>(route.params?.category);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<PropertyFilters>({
    type: route.params?.type,
    category: route.params?.category,
    featured: route.params?.featured,
  });

  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");

  // Re-apply when arriving from Home's category grid with new params
  useEffect(() => {
    if (route.params?.type || route.params?.category || route.params?.featured) {
      setType(route.params.type);
      setCategory(route.params.category);
      setAppliedFilters((prev) => ({
        ...prev,
        type: route.params.type,
        category: route.params.category,
        featured: route.params.featured,
      }));
    }
  }, [route.params?.type, route.params?.category, route.params?.featured]);

  const query = useQuery({
    queryKey: ["properties", "search", appliedFilters],
    queryFn: () => fetchProperties({ ...appliedFilters, limit: 50 }),
  });

  const sortedData = React.useMemo(() => {
    const data = [...(query.data || [])];
    if (sort === "priceLow") data.sort((a, b) => a.price - b.price);
    else if (sort === "priceHigh") data.sort((a, b) => b.price - a.price);
    else data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return data;
  }, [query.data, sort]);

  function applyFilters() {
    setAppliedFilters({
      search: search || undefined,
      type,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
    });
    setFilterSheetOpen(false);
  }

  function clearFilters() {
    setSearch("");
    setType(undefined);
    setCategory(undefined);
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setAppliedFilters({});
    setFilterSheetOpen(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t("searchPlaceholder")}
            style={{ marginBottom: 0 }}
          />
        </View>
      </View>
      <View style={styles.iconRow}>
        <IconButton icon={layout === "grid" ? "grid" : "list"} active onPress={() => setLayout(layout === "grid" ? "list" : "grid")} />
        <View style={styles.iconDivider} />
        <IconButton icon="filter" onPress={() => setFilterSheetOpen(true)} />
        <View style={styles.iconDivider} />
        <IconButton icon="sliders" onPress={() => setSortSheetOpen(true)} />
      </View>

      {query.isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={sortedData}
          keyExtractor={(item) => String(item.id)}
          numColumns={layout === "grid" ? 2 : 1}
          key={layout} // force re-mount when column count changes (RN requirement)
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Property }) =>
            layout === "grid" ? (
              <View style={{ flex: 1 }}>
                <PropertyCard property={item} onPress={() => navigation.navigate("PropertyDetail", { id: item.id })} />
              </View>
            ) : (
              <PropertyCard
                property={item}
                variant="list"
                onPress={() => navigation.navigate("PropertyDetail", { id: item.id })}
              />
            )
          }
          ListEmptyComponent={<EmptyState message={t("noProperties")} />}
        />
      )}

      {/* Filter sheet */}
      <BottomSheet visible={filterSheetOpen} onClose={() => setFilterSheetOpen(false)}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>{t("filters")}</Text>

        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("type")}</Text>
        <View style={styles.chipRow}>
          <Chip label={t("all")} active={!type} onPress={() => setType(undefined)} />
          <Chip label={t("forSale")} active={type === "sale"} onPress={() => setType("sale")} />
          <Chip label={t("forRent")} active={type === "rent"} onPress={() => setType("rent")} />
        </View>

        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("category")}</Text>
        <View style={styles.chipRow}>
          <Chip label={t("all")} active={!category} onPress={() => setCategory(undefined)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={t(c)} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("priceRange")}</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Input value={minPrice} onChangeText={setMinPrice} placeholder={t("minPrice")} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input value={maxPrice} onChangeText={setMaxPrice} placeholder={t("maxPrice")} keyboardType="numeric" />
          </View>
        </View>

        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("minBedrooms")}</Text>
        <Input value={minBedrooms} onChangeText={setMinBedrooms} placeholder="0" keyboardType="numeric" />

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label={t("applyFilters")} onPress={applyFilters} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={t("clearFilters")} variant="outline" onPress={clearFilters} />
          </View>
        </View>
      </BottomSheet>

      {/* Sort sheet */}
      <BottomSheet visible={sortSheetOpen} onClose={() => setSortSheetOpen(false)}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>{t("filters")}</Text>
        {(
          [
            { key: "newest", labelKey: "latestProperties" },
            { key: "priceLow", labelKey: "minPrice" },
            { key: "priceHigh", labelKey: "maxPrice" },
          ] as { key: SortKey; labelKey: string }[]
        ).map((opt) => (
          <SortOption
            key={opt.key}
            label={t(opt.labelKey)}
            active={sort === opt.key}
            onPress={() => {
              setSort(opt.key);
              setSortSheetOpen(false);
            }}
          />
        ))}
      </BottomSheet>
    </View>
  );
}

function SortOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.sortOption,
        { color: active ? colors.primary : colors.text, fontWeight: active ? "700" : "400" },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", padding: spacing.md, paddingBottom: 0 },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconDivider: { width: 1, height: 20, backgroundColor: colors.border },
  list: { padding: spacing.xs, paddingBottom: spacing.xl * 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.md },
  sortOption: { fontSize: 15, paddingVertical: spacing.sm },
});
