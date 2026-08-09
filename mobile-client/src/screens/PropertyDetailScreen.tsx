import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  Linking,
  Dimensions,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import WebView from "react-native-webview";
import { fetchPropertyById, fetchAgentById, sendInquiry } from "../api/properties";
import { PanoramaViewer } from "../components/PanoramaViewer";
import { LoadingView, EmptyState, Card, Button, Input, Badge } from "../components/ui";
import { colors, spacing, radius, typography, shadow } from "../theme";
import { useT, useLocaleStore } from "../store/locale";
import { useFavoritesStore } from "../store/favorites";
import type { Locale } from "../i18n/strings";
import type { Property } from "../api/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function localizedField(property: Property, field: "title" | "description", locale: Locale): string {
  const key = `${field}${locale === "en" ? "En" : locale === "tr" ? "Tr" : locale === "ru" ? "Ru" : "Fa"}` as keyof Property;
  return (property[key] as string) || property[`${field}En` as keyof Property] as string;
}

function formatPrice(price: number, currency: string): string {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  return `${symbol}${price.toLocaleString()}`;
}

export default function PropertyDetailScreen() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const { isFavorite, toggle } = useFavoritesStore();
  const scrollRef = useRef<ScrollView>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const propertyQuery = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchPropertyById(id),
  });

  const agentQuery = useQuery({
    queryKey: ["agent", propertyQuery.data?.agentId],
    queryFn: () => fetchAgentById(propertyQuery.data!.agentId),
    enabled: !!propertyQuery.data,
  });

  if (propertyQuery.isLoading) return <LoadingView />;
  if (propertyQuery.isError || !propertyQuery.data) {
    return <EmptyState message={t("noProperties")} />;
  }

  const property = propertyQuery.data;
  const agent = agentQuery.data;
  const favorite = isFavorite(property.id);
  const hasDrop = !!property.previousPrice && property.previousPrice > property.price;

  async function handleSendInquiry() {
    if (!name || !email || !message) return;
    setSending(true);
    try {
      await sendInquiry({ propertyId: property.id, name, email, phone, message });
      setSent(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      Alert.alert(t("send"), "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 90 }}>
      <View>
        {/* Gallery */}
          <FlatList
            data={property.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="cover" />
            )}
          />

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[typography.h1, { color: colors.text, flex: 1 }]}>
                {localizedField(property, "title", locale)}
              </Text>
              <Text onPress={() => toggle(property.id)} style={styles.favIcon}>
                <Ionicons name={favorite ? "heart" : "heart-outline"} size={24} color={favorite ? colors.danger : colors.textMuted} />
              </Text>
            </View>

            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              {property.city}, {property.district}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Text style={[typography.h1, { color: colors.primary }]}>
                {formatPrice(property.price, property.currency)}
                {property.type === "rent" ? t("perMonth") : ""}
              </Text>
              {hasDrop && <Badge label={t("priceDropBadge")} tone="danger" />}
              {property.isFeatured && <Badge label="★" />}
            </View>
            {hasDrop && (
              <Text style={{ color: colors.textMuted, textDecorationLine: "line-through", marginBottom: spacing.md }}>
                {t("was")} {formatPrice(property.previousPrice!, property.currency)}
              </Text>
            )}

            <Text style={[typography.body, { color: colors.text, marginBottom: spacing.md }]}>
              {property.bedrooms} {t("bedrooms")} · {property.bathrooms} {t("bathrooms")} · {property.area} {t("sqm")}
            </Text>

            {/* 360 tour: real panorama pan viewer, or Matterport/other embed as fallback */}
            {property.panoramas && property.panoramas.length > 0 ? (
              <Card style={{ marginBottom: spacing.lg, padding: 0 }}>
                <View style={{ padding: spacing.sm }}>
                  <Text style={[typography.h3, { color: colors.text }]}>{t("virtualTour")}</Text>
                </View>
                <PanoramaViewer imageUri={property.panoramas[0]} label={t("dragToLookAround")} />
              </Card>
            ) : property.virtualTourUrl ? (
              <Card style={{ marginBottom: spacing.lg, padding: 0, overflow: "hidden" }}>
                <View style={{ padding: spacing.sm }}>
                  <Text style={[typography.h3, { color: colors.text }]}>{t("virtualTour")}</Text>
                </View>
                <WebView source={{ uri: property.virtualTourUrl }} style={{ width: SCREEN_WIDTH - spacing.md * 2, height: 260 }} />
              </Card>
            ) : null}

            {/* Description */}
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("description")}</Text>
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
              {localizedField(property, "description", locale)}
            </Text>

            {/* Features */}
            {property.features.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{t("features")}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {property.features.map((f) => (
                    <View key={f} style={styles.featureChip}>
                      <Text style={typography.small}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Location */}
            <Card style={{ marginBottom: spacing.lg }}>
              <Text
                style={[typography.h3, { color: colors.primary }]}
                onPress={() =>
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`)
                }
              >
                <Feather name="map-pin" size={14} color={colors.textMuted} /> {t("viewOnMap")}
              </Text>
            </Card>

            {/* Calculators quick links */}
            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("mortgageCalculator")}
                  variant="outline"
                  onPress={() => navigation.navigate("Calculators", { propertyPrice: property.price })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("roiCalculator")}
                  variant="outline"
                  onPress={() => navigation.navigate("Calculators", { propertyPrice: property.price, tab: "roi" })}
                />
              </View>
            </View>

            {/* Agent contact */}
            {agent && (
              <Card style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>{t("contactAgent")}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
                  <Image source={{ uri: agent.photo }} style={styles.agentPhoto} />
                  <Text style={[typography.h3, { color: colors.text, marginLeft: spacing.sm }]}>{agent.name}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button label={t("callAgent")} onPress={() => Linking.openURL(`tel:${agent.phone}`)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("whatsappAgent")}
                      variant="outline"
                      onPress={() =>
                        Linking.openURL(`https://wa.me/${agent.phone.replace(/[^0-9]/g, "")}`)
                      }
                    />
                  </View>
                </View>
              </Card>
            )}

            {/* Inquiry form */}
            <Card>
              <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>{t("sendInquiry")}</Text>
              {sent ? (
                <Text style={{ color: colors.success }}>{t("inquirySent")}</Text>
              ) : (
                <>
                  <Input value={name} onChangeText={setName} placeholder={t("yourName")} />
                  <Input value={email} onChangeText={setEmail} placeholder={t("yourEmail")} keyboardType="email-address" />
                  <Input value={phone} onChangeText={setPhone} placeholder={t("yourPhone")} keyboardType="phone-pad" />
                  <Input value={message} onChangeText={setMessage} placeholder={t("yourMessage")} multiline />
                  <Button label={t("send")} onPress={handleSendInquiry} loading={sending} disabled={!name || !email || !message} />
                </>
              )}
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.stickyBar}>
        <View>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t("propertyPrice")}</Text>
          <Text style={[typography.h2, { color: colors.primary }]}>
            {formatPrice(property.price, property.currency)}
            {property.type === "rent" ? t("perMonth") : ""}
          </Text>
        </View>
        <View style={{ width: 160 }}>
          <Button label={t("sendInquiry")} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  galleryImage: { width: SCREEN_WIDTH, height: 280, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  favIcon: { fontSize: 24, marginLeft: spacing.sm },
  featureChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  agentPhoto: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.surface },
  stickyBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
});
