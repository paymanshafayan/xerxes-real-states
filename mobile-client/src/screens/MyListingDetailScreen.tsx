import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Screen, Header, Card, Button, Input } from "../components/ui";
import { colors, spacing, typography, radius } from "../theme";
import {
  fetchListingDetail,
  uploadPanoramas,
  removePanorama,
  type Listing,
} from "../api/listings";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  removed: "Removed",
  unavailable_reported: "Reported Unavailable",
};

export default function MyListingDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [panoramaInput, setPanoramaInput] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const data = await fetchListingDetail(id);
      setListing(data);
    } catch (err: any) {
      Alert.alert("Error", err?.message);
    } finally {
      setLoading(false);
    }
  };

  const addPanorama = async () => {
    if (!panoramaInput.trim()) {
      Alert.alert("Required", "Please paste a panorama image URL");
      return;
    }
    try {
      await uploadPanoramas(id, [panoramaInput.trim()]);
      setPanoramaInput("");
      await load();
      Alert.alert("Success", "Panorama added");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || err?.message);
    }
  };

  const removeOne = async (url: string) => {
    Alert.alert("Confirm", "Remove this panorama?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removePanorama(id, url);
            await load();
          } catch (err: any) {
            Alert.alert("Error", err?.message);
          }
        },
      },
    ]);
  };

  if (loading || !listing) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const panoramas = listing.panoramas || [];
  const canAddPanorama = listing.approvalStatus === "approved";

  return (
    <Screen scroll>
      <Header
        title="Listing Detail"
        onBack={() => navigation.goBack()}
      />

      <Card>
        <View style={styles.statusRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.status}>
            {STATUS_LABELS[listing.approvalStatus] || listing.approvalStatus}
          </Text>
        </View>
        <Text style={styles.city}>{listing.city} • {listing.category}</Text>
        <Text style={styles.meta}>
          {listing.area} m² • {listing.bedrooms} bed • {listing.bathrooms} bath
        </Text>
        {listing.rejectionReason && (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectText}>
              Rejection reason: {listing.rejectionReason}
            </Text>
          </View>
        )}
      </Card>

      <Card title="Description">
        <Text style={styles.body}>{listing.description}</Text>
      </Card>

      {listing.price && (
        <Card title="Pricing">
          {listing.price && (
            <Text style={styles.price}>
              Sale: {listing.price.toLocaleString()} {listing.currency}
            </Text>
          )}
          {listing.rentDeposit && (
            <Text style={styles.body}>
              Deposit: {listing.rentDeposit.toLocaleString()} {listing.currency}
            </Text>
          )}
          {listing.monthlyRent && (
            <Text style={styles.body}>
              Monthly: {listing.monthlyRent.toLocaleString()} {listing.currency}
            </Text>
          )}
        </Card>
      )}

      <Card title={`360° Panoramas (${panoramas.length})`}>
        {!canAddPanorama && (
          <Text style={styles.note}>
            Panoramas can be added only after your listing is approved.
          </Text>
        )}
        {canAddPanorama && (
          <View>
            <Input
              label="Add equirectangular image URL (2:1 ratio)"
              value={panoramaInput}
              onChangeText={setPanoramaInput}
              placeholder="https://..."
            />
            <Button title="Add Panorama" onPress={addPanorama} />
          </View>
        )}
        {panoramas.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            {panoramas.map((p, i) => (
              <View key={i} style={styles.panoRow}>
                <Text style={styles.body} numberOfLines={1}>
                  {p}
                </Text>
                {canAddPanorama && (
                  <TouchableOpacity onPress={() => removeOne(p)}>
                    <Text style={styles.remove}>✗</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: { ...typography.h2, flex: 1 },
  status: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  city: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  meta: { ...typography.bodySmall, marginTop: spacing.xs },
  body: { ...typography.body },
  price: { ...typography.body, fontWeight: "600", color: colors.primary },
  rejectBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "#fee2e2",
    borderRadius: radius.md,
  },
  rejectText: { ...typography.bodySmall, color: "#991b1b" },
  note: { ...typography.bodySmall, color: colors.textMuted },
  panoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  remove: { color: "#ef4444", fontSize: 18, marginLeft: spacing.sm },
});
