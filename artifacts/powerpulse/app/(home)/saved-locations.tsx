import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useListSavedLocations, useCreateSavedLocation, useDeleteSavedLocation } from "@workspace/api-client-react";
import colors from "@/constants/colors";

const c = colors.light;

const LOCATION_PRESETS = [
  { name: "Home", icon: "home" },
  { name: "Office", icon: "briefcase" },
  { name: "School", icon: "school" },
];

export default function SavedLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [customName, setCustomName] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);

  const { data: savedLocations, refetch } = useListSavedLocations();
  const { mutate: createLocation, isPending: creating } = useCreateSavedLocation();
  const { mutate: deleteLocation } = useDeleteSavedLocation();

  const getLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission denied", "Location access needed."); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: geo ? [geo.street, geo.city, geo.region].filter(Boolean).join(", ") : "",
      });
    } catch { Alert.alert("Error", "Could not get location."); }
    finally { setLocLoading(false); }
  };

  const handleSave = () => {
    const finalName = name || customName;
    if (!finalName) { Alert.alert("Name required", "Please choose or enter a name."); return; }
    if (!location) { Alert.alert("Location needed", "Please detect your location first."); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createLocation(
      { data: { name: finalName, latitude: location.latitude, longitude: location.longitude, address: location.address || undefined } },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setName(""); setCustomName(""); setLocation(null); refetch(); },
        onError: () => Alert.alert("Error", "Failed to save location."),
      }
    );
  };

  const handleDelete = (id: number) => {
    Alert.alert("Remove location", "Remove this saved location?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deleteLocation({ id }, { onSuccess: () => refetch() }); } },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Saved Locations</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Saved list */}
        {savedLocations && savedLocations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>YOUR LOCATIONS</Text>
            {savedLocations.map((loc: any) => (
              <View key={loc.id} style={[styles.savedItem, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.locIcon, { backgroundColor: c.primary + "20" }]}>
                  <Ionicons name="bookmark" size={16} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locName, { color: c.foreground }]}>{loc.name}</Text>
                  {loc.address ? <Text style={[styles.locAddr, { color: c.mutedForeground }]} numberOfLines={1}>{loc.address}</Text> : null}
                </View>
                <Pressable onPress={() => handleDelete(loc.id)}>
                  <Ionicons name="trash-outline" size={18} color={c.destructive} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add new */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>ADD LOCATION</Text>

          <Text style={[styles.label, { color: c.mutedForeground }]}>Quick Select</Text>
          <View style={styles.presetsRow}>
            {LOCATION_PRESETS.map(p => (
              <Pressable
                key={p.name}
                style={({ pressed }) => [styles.presetChip, { backgroundColor: name === p.name ? c.primary : c.card, borderColor: name === p.name ? c.primary : c.border, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => { setName(p.name); setCustomName(""); }}
              >
                <Ionicons name={p.icon as any} size={16} color={name === p.name ? c.background : c.foreground} />
                <Text style={[styles.presetLabel, { color: name === p.name ? c.background : c.foreground }]}>{p.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: c.mutedForeground }]}>Or Custom Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
            value={customName}
            onChangeText={(t) => { setCustomName(t); setName(""); }}
            placeholder="e.g. Mom's house, Market"
            placeholderTextColor={c.mutedForeground}
          />

          <Pressable
            style={({ pressed }) => [styles.detectBtn, { backgroundColor: location ? c.powerOn + "20" : c.card, borderColor: location ? c.powerOn : c.border, opacity: pressed ? 0.8 : 1 }]}
            onPress={getLocation}
            disabled={locLoading}
          >
            {locLoading ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <>
                <Ionicons name={location ? "checkmark-circle" : "location"} size={18} color={location ? c.powerOn : c.primary} />
                <Text style={[styles.detectText, { color: location ? c.powerOn : c.primary }]}>
                  {location ? `Location detected` : "Detect my location"}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: c.primary, opacity: pressed || creating ? 0.85 : 1 }]}
            onPress={handleSave}
            disabled={creating}
          >
            {creating ? <ActivityIndicator color={c.background} /> : (
              <><Ionicons name="bookmark" size={18} color={c.background} /><Text style={[styles.saveBtnText, { color: c.background }]}>Save Location</Text></>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 20, gap: 12 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 4 },
  savedItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  locIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  locName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  locAddr: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  presetsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  presetChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  presetLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 8 },
  detectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginBottom: 12 },
  detectText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
