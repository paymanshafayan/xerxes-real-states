import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, Header, Button, Card, Input, Picker } from "../components/ui";
import { colors, spacing, typography, radius } from "../theme";
import { useT } from "../store/locale";
import { createListing, getUserProfile } from "../api/listings";
import { getCurrentUser, logoutUser } from "../api/user";

const STEPS = [
  { key: "profile", title: "Owner Info" },
  { key: "kind", title: "Type" },
  { key: "specs", title: "Specs" },
  { key: "location", title: "Location" },
  { key: "pricing", title: "Pricing" },
  { key: "media", title: "Media" },
  { key: "review", title: "Review" },
];

export default function ListPropertyScreen() {
  const navigation = useNavigation<any>();
  const t = useT();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    lastName: "",
    nationalId: "",
    addressLine: "",
    city: "",
    country: "Turkey",
    postalCode: "",
  });
  const [profileCompleted, setProfileCompleted] = useState(false);

  const [listingKinds, setListingKinds] = useState<("sale" | "rent")[]>([]);
  const [category, setCategory] = useState("apartment");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState("0");
  const [bathrooms, setBathrooms] = useState("0");
  const [area, setArea] = useState("0");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [price, setPrice] = useState("");
  const [rentDeposit, setRentDeposit] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [currency, setCurrency] = useState("GBP");

  const [imageUrls, setImageUrls] = useState(""); // comma-separated for MVP
  const [videoUrls, setVideoUrls] = useState("");

  const [commitmentAccepted, setCommitmentAccepted] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) {
        Alert.alert("Login Required", "Please sign in to list a property.");
        navigation.navigate("Account");
        return;
      }
      if (u.isBlocked) {
        Alert.alert("Account Blocked", "Your account is currently blocked.");
        await logoutUser();
        navigation.navigate("Account");
        return;
      }
      setUser(u);
      try {
        const p = await getUserProfile();
        if (p) {
          setProfile({
            lastName: p.lastName || "",
            nationalId: p.nationalId || "",
            addressLine: p.addressLine || "",
            city: p.city || "",
            country: p.country || "Turkey",
            postalCode: p.postalCode || "",
          });
          setProfileCompleted(!!p.profileCompleted);
        }
      } catch {}
      setChecking(false);
    })();
  }, []);

  const next = () => {
    // Per-step validation
    if (step === 0) {
      if (!profile.lastName || !profile.addressLine || !profile.city) {
        Alert.alert("Required", "Last name, address, and city are required");
        return;
      }
    }
    if (step === 1 && listingKinds.length === 0) {
      Alert.alert("Required", "Select at least one: for sale or for rent");
      return;
    }
    if (step === 2) {
      if (title.length < 5 || description.length < 20 || Number(area) <= 0) {
        Alert.alert("Required", "Title (5+), description (20+), area > 0");
        return;
      }
    }
    if (step === 3 && (address.length < 5 || !city)) {
      Alert.alert("Required", "Address and city are required");
      return;
    }
    if (step === 4) {
      if (listingKinds.includes("sale") && (!price || Number(price) <= 0)) {
        Alert.alert("Required", "Sale price is required");
        return;
      }
      if (listingKinds.includes("rent")) {
        if (!rentDeposit || !monthlyRent) {
          Alert.alert("Required", "Deposit and monthly rent are required");
          return;
        }
      }
    }
    if (step === 5) {
      const urls = imageUrls.split(",").map((u) => u.trim()).filter(Boolean);
      if (urls.length < 3) {
        Alert.alert("Required", "At least 3 image URLs (comma-separated)");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!commitmentAccepted) {
      Alert.alert("Required", "You must accept the commitment");
      return;
    }
    setLoading(true);
    try {
      const images = imageUrls.split(",").map((u) => u.trim()).filter(Boolean);
      const videos = videoUrls.split(",").map((u) => u.trim()).filter(Boolean);
      const result = await createListing({
        profile,
        listingKinds,
        category,
        title,
        description,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area: Number(area),
        features: [],
        address,
        city,
        district: district || undefined,
        country: profile.country,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        price: price ? Number(price) : null,
        rentDeposit: rentDeposit ? Number(rentDeposit) : null,
        monthlyRent: monthlyRent ? Number(monthlyRent) : null,
        currency,
        commitmentAccepted: true,
      });
      Alert.alert("Success", result.message || "Listing submitted for review", [
        { text: "OK", onPress: () => navigation.navigate("MyListings") },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || err?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="List Property" />

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((s, idx) => (
          <View
            key={s.key}
            style={[
              styles.stepBadge,
              idx === step && { backgroundColor: colors.primary },
              idx < step && { backgroundColor: "#10b981" },
            ]}
          >
            <Text style={styles.stepText}>{idx + 1}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.stepTitle}>{STEPS[step].title}</Text>

      <Card>
        {/* Step 0: Profile */}
        {step === 0 && (
          <View>
            {profileCompleted && (
              <Text style={{ color: "#10b981", marginBottom: spacing.sm }}>
                ✓ Profile already complete
              </Text>
            )}
            <Input
              label="Last name *"
              value={profile.lastName}
              onChangeText={(v) => setProfile({ ...profile, lastName: v })}
            />
            <Input
              label="National ID (optional)"
              value={profile.nationalId}
              onChangeText={(v) => setProfile({ ...profile, nationalId: v })}
            />
            <Input
              label="Address *"
              value={profile.addressLine}
              onChangeText={(v) => setProfile({ ...profile, addressLine: v })}
              multiline
            />
            <Input
              label="City *"
              value={profile.city}
              onChangeText={(v) => setProfile({ ...profile, city: v })}
            />
            <Input
              label="Country"
              value={profile.country}
              onChangeText={(v) => setProfile({ ...profile, country: v })}
            />
            <Input
              label="Postal code"
              value={profile.postalCode}
              onChangeText={(v) => setProfile({ ...profile, postalCode: v })}
            />
          </View>
        )}

        {/* Step 1: Listing kind */}
        {step === 1 && (
          <View>
            <Text style={styles.label}>Listing Type *</Text>
            <View style={styles.row}>
              <Switch
                value={listingKinds.includes("sale")}
                onValueChange={(v) =>
                  setListingKinds(
                    v ? [...listingKinds, "sale"] : listingKinds.filter((k) => k !== "sale")
                  )
                }
              />
              <Text style={styles.rowText}>For Sale</Text>
            </View>
            <View style={styles.row}>
              <Switch
                value={listingKinds.includes("rent")}
                onValueChange={(v) =>
                  setListingKinds(
                    v ? [...listingKinds, "rent"] : listingKinds.filter((k) => k !== "rent")
                  )
                }
              />
              <Text style={styles.rowText}>For Rent</Text>
            </View>
            <Text style={[styles.label, { marginTop: spacing.md }]}>Category</Text>
            <View style={styles.chipRow}>
              {["villa", "apartment", "land", "commercial"].map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.chip,
                    category === c && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === c && { color: "#fff" },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Specs */}
        {step === 2 && (
          <View>
            <Input
              label="Title *"
              value={title}
              onChangeText={setTitle}
            />
            <Input
              label="Description *"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Area (m²)"
                  value={area}
                  onChangeText={setArea}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Bedrooms"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Bathrooms"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <View>
            <Input
              label="Address *"
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <Input label="City *" value={city} onChangeText={setCity} />
            <Input label="District" value={district} onChangeText={setDistrict} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Latitude (optional)"
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Longitude (optional)"
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
          <View>
            <Input label="Currency" value={currency} onChangeText={setCurrency} />
            {listingKinds.includes("sale") && (
              <Input
                label="Sale price *"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            )}
            {listingKinds.includes("rent") && (
              <View>
                <Input
                  label="Deposit *"
                  value={rentDeposit}
                  onChangeText={setRentDeposit}
                  keyboardType="numeric"
                />
                <Input
                  label="Monthly rent *"
                  value={monthlyRent}
                  onChangeText={setMonthlyRent}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        )}

        {/* Step 5: Media */}
        {step === 5 && (
          <View>
            <Input
              label="Image URLs (comma-separated, min 3) *"
              value={imageUrls}
              onChangeText={setImageUrls}
              multiline
            />
            <Input
              label="Video URLs (optional)"
              value={videoUrls}
              onChangeText={setVideoUrls}
              multiline
            />
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: spacing.sm }}>
              Note: 360° panoramas can be added after your listing is approved.
            </Text>
          </View>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <View>
            <Text style={styles.reviewLabel}>Title:</Text>
            <Text style={styles.reviewValue}>{title}</Text>
            <Text style={styles.reviewLabel}>Type:</Text>
            <Text style={styles.reviewValue}>
              {listingKinds.join(", ")} • {category}
            </Text>
            <Text style={styles.reviewLabel}>Location:</Text>
            <Text style={styles.reviewValue}>{city}</Text>
            <Text style={styles.reviewLabel}>Specs:</Text>
            <Text style={styles.reviewValue}>
              {area} m² • {bedrooms} bed • {bathrooms} bath
            </Text>

            <View style={styles.commitBox}>
              <Text style={styles.commitText}>
                ⚠️ COMMITMENT: I will immediately remove this listing if the property
                is sold, rented, or withdrawn. If a visit is requested and the
                property is unavailable, my account will be blocked and all my
                listings deleted.
              </Text>
              <View style={styles.row}>
                <Switch value={commitmentAccepted} onValueChange={setCommitmentAccepted} />
                <Text style={[styles.rowText, { flex: 1 }]}>
                  I accept this commitment
                </Text>
              </View>
            </View>
          </View>
        )}
      </Card>

      <View style={styles.navRow}>
        {step > 0 && (
          <Button title="Back" onPress={back} variant="secondary" />
        )}
        {step < STEPS.length - 1 ? (
          <Button title="Next" onPress={next} />
        ) : (
          <Button
            title={loading ? "Submitting..." : "Submit for Review"}
            onPress={submit}
            disabled={loading || !commitmentAccepted}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: spacing.md,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  stepTitle: { ...typography.h2, marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  rowText: { ...typography.body },
  chipRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: "#f3f4f6",
  },
  chipText: { ...typography.bodySmall },
  reviewLabel: { ...typography.label, marginTop: spacing.sm },
  reviewValue: { ...typography.body, fontWeight: "500" },
  commitBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "#fef3c7",
    borderRadius: radius.md,
  },
  commitText: { ...typography.bodySmall, color: "#92400e", marginBottom: spacing.sm },
  navRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
