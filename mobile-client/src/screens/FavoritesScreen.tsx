import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useQueries } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { fetchPropertyById } from "../api/properties";
import { useFavoritesStore } from "../store/favorites";
import { PropertyCard } from "../components/PropertyCard";
import { LoadingView, EmptyState, Header, Button } from "../components/ui";
import { spacing } from "../theme";
import { useT } from "../store/locale";

export default function FavoritesScreen() {
  const t = useT();
  const navigation = useNavigation<any>();
  const ids = useFavoritesStore((s) => s.ids);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["property", id],
      queryFn: () => fetchPropertyById(id),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const properties = results.filter((r) => r.data).map((r) => r.data!);

  if (ids.length === 0) {
    return (
      <View style={{ flex: 1, padding: spacing.md }}>
        <Header title={t("favoritesTitle")} />
        <EmptyState
          message={t("noFavorites")}
          action={<Button label={t("browseProperties")} onPress={() => navigation.navigate("HomeTab")} />}
        />
      </View>
    );
  }

  if (isLoading) return <LoadingView />;

  return (
    <FlatList
      data={properties}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: spacing.xs }}>
          <Header title={t("favoritesTitle")} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <PropertyCard property={item} onPress={() => navigation.navigate("PropertyDetail", { id: item.id })} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xs, paddingBottom: spacing.xl * 2 },
});
