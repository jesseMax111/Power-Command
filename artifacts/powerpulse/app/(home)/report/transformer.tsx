import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useCreateReport } from "@workspace/api-client-react";
import { useUser } from "@clerk/expo";
import colors from "@/constants/colors";

const c = colors.light;

const FAULT_TYPES = [
  { value: "explosion", label: "Explosion", icon: "flame" },
  { value: "smoke", label: "Smoke", icon: "cloud" },
  { value: "fire", label: "Fire", icon: "flame-outline" },
  { value: "fallen_pole", label: "Fallen Pole", icon: "arrow-down" },
  { value: "broken_cable", label: "Broken Cable", icon: "cut" },
  { value: "oil_leak", label: "Oil Leak", icon: "water" },
  { value: "sparking", label: "Sparking", icon: "flash" },
];

export default function ReportTransformerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [faultType, setFaultType] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const { mutate: createReport, isPending } = useCreateReport();

  useEffect(() => { getLocation(); }, []);

  const getLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo) setAddress([geo.street, geo.city, geo.region].filter(Boolean).join(", "));
    } catch {}
    finally { setLocLoading(false); }
  };

  const handleSubmit = () => {
    if (!location) { Alert.alert("Location needed", "Please wait for location."); return; }
    if (!faultType) { Alert.alert("Fault type needed", "Please select the type of fault."); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    createReport(
      { data: { type: "transformer", latitude: location.latitude, longitude: location.longitude, address: address || undefined, description: description || undefined, faultType, userName: user?.fullName || undefined } },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); },
        onError: () => Alert.alert("Error", "Failed to submit report."),
      }
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={c.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Transformer Fault</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconRow}>
          <View style={[styles.iconBg, { backgroundColor: c.unstable + "20" }]}>
            <Ionicons name="warning" size={32} color={c.unstable} />
          </View>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Report transformer damage to help your community</Text>
        </View>

        {/* Fault type selector */}
        <Text style={[styles.label, { color: c.mutedForeground }]}>Fault Type</Text>
        <View style={styles.faultGrid}>
          {FAULT_TYPES.map(ft => (
            <Pressable
              key={ft.value}
              style={({ pressed }) => [
                styles.faultChip,
                { backgroundColor: faultType === ft.value ? c.unstable : c.card, borderColor: faultType === ft.value ? c.unstable : c.border, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => { Haptics.selectionAsync(); setFaultType(ft.value); }}
            >
              <Ionicons name={ft.icon as any} size={16} color={faultType === ft.value ? c.background : c.foreground} />
              <Text style={[styles.faultLabel, { color: faultType === ft.value ? c.background : c.foreground }]}>{ft.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.locationCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={location ? c.powerOn : c.mutedForeground} />
            {locLoading ? <ActivityIndicator size="small" color={c.primary} style={{ flex: 1 }} /> :
              <Text style={[styles.locationText, { color: location ? c.foreground : c.mutedForeground }]}>
                {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Detecting..."}
              </Text>}
            <Pressable onPress={getLocation}><Ionicons name="refresh" size={18} color={c.primary} /></Pressable>
          </View>
        </View>

        <Text style={[styles.label, { color: c.mutedForeground }]}>Address (optional)</Text>
        <TextInput style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]} value={address} onChangeText={setAddress} placeholder="Location address" placeholderTextColor={c.mutedForeground} />

        <Text style={[styles.label, { color: c.mutedForeground }]}>Notes (optional)</Text>
        <TextInput style={[styles.input, styles.notesInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]} value={description} onChangeText={setDescription} placeholder="Describe what you observed..." placeholderTextColor={c.mutedForeground} multiline numberOfLines={3} textAlignVertical="top" />

        <Pressable
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: c.unstable, opacity: pressed || isPending ? 0.85 : 1 }]}
          onPress={handleSubmit} disabled={isPending}
        >
          {isPending ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="warning" size={20} color="#fff" /><Text style={[styles.submitText, { color: "#fff" }]}>Report Fault</Text></>
          )}
        </Pressable>
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
  iconRow: { alignItems: "center", gap: 12, marginBottom: 8 },
  iconBg: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  faultGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  faultChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  faultLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  locationCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  notesInput: { minHeight: 80, paddingTop: 12 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
