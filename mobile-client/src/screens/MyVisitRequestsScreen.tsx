import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, Header, Card } from "../components/ui";
import { colors, spacing, typography, radius } from "../theme";
import { fetchMyVisitRequests, type VisitRequest } from "../api/listings";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  staff_reviewing: "Under Review",
  owner_contacted: "Contacting Owner",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  staff_reviewing: "#3b82f6",
  owner_contacted: "#3b82f6",
  approved: "#10b981",
  rejected: "#ef4444",
  completed: "#6b7280",
  cancelled: "#9ca3af",
};

export default function MyVisitRequestsScreen() {
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchMyVisitRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
        title="My Visit Requests"
        onBack={() => navigation.goBack()}
      />
      {requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No visit requests yet</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.visitRequest.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
          renderItem={({ item }) => {
            const r = item.visitRequest;
            return (
              <Card>
                <Text style={styles.title}>{item.listing.title}</Text>
                <Text style={styles.city}>{item.listing.city}</Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: STATUS_COLORS[r.status] || "#9ca3af" },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {STATUS_LABELS[r.status] || r.status}
                  </Text>
                </View>
                {r.appointmentDate && (
                  <View style={styles.appointBox}>
                    <Text style={styles.appointTitle}>✓ Appointment</Text>
                    <Text style={styles.appointDate}>
                      {new Date(r.appointmentDate).toLocaleString()}
                    </Text>
                    {r.appointmentNotes && (
                      <Text style={styles.appointNote}>{r.appointmentNotes}</Text>
                    )}
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.body, fontWeight: "600" },
  city: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  appointBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "#d1fae5",
    borderRadius: radius.md,
  },
  appointTitle: { ...typography.bodySmall, fontWeight: "600", color: "#065f46" },
  appointDate: { ...typography.bodySmall, color: "#065f46", marginTop: 2 },
  appointNote: { ...typography.bodySmall, color: "#065f46", marginTop: spacing.xs, fontStyle: "italic" },
});
