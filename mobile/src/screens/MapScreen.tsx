import React from "react";
import { View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Header, Loading, EmptyState } from "../components/ui";
import { useThemeStore } from "../store/theme";
import { typography, spacing } from "../theme";
import { t } from "../i18n";
import { listProperties, type Property } from "../api/staff";

const DEFAULT_REGION = {
  latitude: 35.26,
  longitude: 33.4,
  latitudeDelta: 1.4,
  longitudeDelta: 1.4,
};

export default function MapScreen() {
  const { theme } = useThemeStore();
  const nav = useNavigation<any>();
  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => listProperties({ limit: 200 }),
  });

  const items: Property[] = (data ?? []).filter(
    (p) => typeof p.lat === "number" && typeof p.lng === "number"
  );

  if (isLoading) return <Loading />;

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ padding: spacing.lg, backgroundColor: theme.background }}>
        <Header title={t("map")} subtitle={`${items.length} ${t("properties")}`} />
      </View>
      {items.length === 0 ? (
        <EmptyState message={t("noProperties")} />
      ) : (
        <MapView
          style={{ flex: 1 }}
          initialRegion={
            items[0].lat && items[0].lng
              ? {
                  latitude: items[0].lat,
                  longitude: items[0].lng,
                  latitudeDelta: 0.6,
                  longitudeDelta: 0.6,
                }
              : DEFAULT_REGION
          }
        >
          {items.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.lat as number, longitude: p.lng as number }}
              title={p.titleFa || p.titleEn}
              description={`${p.price.toLocaleString()} ${p.currency}`}
              onCalloutPress={() => nav.navigate("PropertyForm", { id: p.id })}
              onPress={() => nav.navigate("PropertyForm", { id: p.id })}
            />
          ))}
        </MapView>
      )}
    </Screen>
  );
}
