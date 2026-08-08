import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { fetchPriceDrops } from "../api/properties";
import { PropertyCard } from "../components/PropertyCard";
import { LoadingView, EmptyState, Header } from "../components/ui";
import { spacing } from "../theme";
import { useT } from "../store/locale";
import type { Property } from "../api/types";

export default function PriceDropsScreen() {
  const t = useT();
  const navigation = useNavigation<any>();

  const query = useQuery({
    queryKey: ["properties", "price-drops"],
    queryFn: () => fetchPriceDrops(30),
  });

  if (query.isLoading) return <LoadingView />;

  return (
    <FlatList
      data={query.data || []}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: spacing.xs }}>
          <Header title={t("priceDropsTitle")} subtitle={t("priceDropsSubtitle")} />
        </View>
      }
      renderItem={({ item }: { item: Property }) => (
        <View style={{ flex: 1 }}>
          <PropertyCard property={item} onPress={() => navigation.navigate("PropertyDetail", { id: item.id })} />
        </View>
      )}
      ListEmptyComponent={<EmptyState message={t("noPriceDrops")} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xs, paddingBottom: spacing.xl * 2 },
});
