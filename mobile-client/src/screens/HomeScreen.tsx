import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { fetchProperties } from "../api/properties";
import { PropertyCard } from "../components/PropertyCard";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryGrid } from "../components/CategoryGrid";
import { LoadingView, EmptyState, Button, SectionHeader } from "../components/ui";
import { colors, spacing, typography } from "../theme";
import { useT } from "../store/locale";
import type { Property } from "../api/types";

export default function HomeScreen() {
  const t = useT();
  const navigation = useNavigation<any>();

  const featured = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: () => fetchProperties({ featured: true, limit: 6 }),
  });

  const latest = useQuery({
    queryKey: ["properties", "latest"],
    queryFn: () => fetchProperties({ limit: 20 }),
  });

  if (latest.isLoading) return <LoadingView />;

  if (latest.isError) {
    return (
      <EmptyState
        message={t("noProperties")}
        action={<Button label={t("retry")} onPress={() => latest.refetch()} />}
      />
    );
  }

  const properties = latest.data || [];

  return (
    <FlatList
      data={properties}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={{ gap: 0 }}
      ListHeaderComponent={
        <View>
          <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.md, paddingHorizontal: spacing.xs }]}>
            {t("appName")}
          </Text>

          {!!featured.data?.length && (
            <HeroBanner
              properties={featured.data}
              onPressItem={(id) => navigation.navigate("PropertyDetail", { id })}
            />
          )}

          <View style={{ paddingHorizontal: spacing.xs }}>
            <CategoryGrid />
          </View>

          {!!featured.data?.length && (
            <View style={{ marginBottom: spacing.lg }}>
              <View style={{ paddingHorizontal: spacing.xs }}>
                <SectionHeader
                  title={t("featuredProperties")}
                  actionLabel={t("viewAll")}
                  onAction={() => navigation.navigate("SearchTab", { screen: "Search", params: { featured: true } })}
                />
              </View>
              <FlatList
                horizontal
                data={featured.data}
                keyExtractor={(item) => `f-${item.id}`}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={{ width: 220 }}>
                    <PropertyCard
                      property={item}
                      onPress={() => navigation.navigate("PropertyDetail", { id: item.id })}
                    />
                  </View>
                )}
              />
            </View>
          )}

          <View style={{ paddingHorizontal: spacing.xs }}>
            <SectionHeader
              title={t("latestProperties")}
              actionLabel={t("viewAll")}
              onAction={() => navigation.navigate("SearchTab")}
            />
          </View>
        </View>
      }
      renderItem={({ item }: { item: Property }) => (
        <View style={{ flex: 1 }}>
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate("PropertyDetail", { id: item.id })}
          />
        </View>
      )}
      ListEmptyComponent={<EmptyState message={t("noProperties")} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xs, paddingBottom: spacing.xl * 2 },
});
