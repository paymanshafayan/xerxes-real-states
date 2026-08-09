import React, { useState, useEffect } from "react";
import { Feather } from "@expo/vector-icons";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, Header, Card, Button } from "../components/ui";
import { colors, spacing, typography, radius } from "../theme";
import { useT } from "../store/locale";
import { fetchMyListings, deleteListing, type Listing } from "../api/listings";
import { getCurrentUser } from "../api/user";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  removed: "Removed",
  unavailable_reported: "Reported Unavailable",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  approved: "#10b981",
  rejected: "#ef4444",
  removed: "#6b7280",
  unavailable_reported: "#dc2626",
};

export default function MyListingsScreen() {
  const navigation = useNavigation<any>();
  const t = useT();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const u = await getCurrentUser();
      if (!u) {
        navigation.navigate("Account");
        return;
      }
      const data = await fetchMyListings();
      setListings(data.listings || []);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        navigation.navigate("Account");
      } else {
        Alert.alert("Error", err?.message || "Failed to load");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleDelete = (id: number, status: string) => {
    if (!["pending", "approved"].includes(status)) {
      Alert.alert("Cannot Delete", "This listing cannot be removed.");
      return;
    }
    Alert.alert("Confirm", "Remove this listing from your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteListing(id);
            await load();
          } catch (err: any) {
            Alert.alert("Error", err?.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="My Listings"
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate("ListProperty")}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>+ New</Text>
          </TouchableOpacity>
        }
      />
      {listings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No listings yet</Text>
          <Button
            title="List a Property"
            onPress={() => navigation.navigate("ListProperty")}
          />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const cover = item.images?.[0] || "";
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate("MyListingDetail", { id: item.id })}
              >
                <Card style={styles.card}>
                  <View style={styles.row}>
                    {cover ? (
                      <View style={styles.thumb}>
                        <Feather name="home" size={22} color={colors.textMuted} />
                      </View>
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty]}>
                        <Feather name="home" size={22} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.city}>{item.city}</Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: STATUS_COLORS[item.approvalStatus] || "#9ca3af" },
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {STATUS_LABELS[item.approvalStatus] || item.approvalStatus}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {["pending", "approved"].includes(item.approvalStatus) && (
                    <Button
                      title="Remove"
                      onPress={() => handleDelete(item.id, item.approvalStatus)}
                      variant="secondary"
                      style={{ marginTop: spacing.sm }}
                    />
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center" },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbEmpty: { backgroundColor: "#f3f4f6" },
  thumbEmoji: { fontSize: 24 },
  title: { ...typography.body, fontWeight: "600" },
  city: { ...typography.bodySmall, color: colors.textMuted },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
});
