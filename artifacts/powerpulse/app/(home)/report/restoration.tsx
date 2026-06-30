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

export default function ReportRestorationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("");
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createReport(
      { data: { type: "restoration", latitude: location.latitude, longitude: location.longitude, address: address || undefined, userName: user?.fullName || undefined } },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); },
        onError: () => { Alert.alert("Error", "Failed to submit report."); },
      }
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={c.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Report Restoration</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconRow}>
          <View style={[styles.iconBg, { backgroundColor: c.powerOn + "20" }]}>
            <Ionicons name="flash" size={32} color={c.powerOn} />
          </View>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Let your community know power has been restored</Text>
        </View>
        <View style={[styles.locationCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={location ? c.powerOn : c.mutedForeground} />
            {locLoading ? <ActivityIndicator size="small" color={c.primary} style={{ flex: 1 }} /> :
              <Text style={[styles.locationText, { color: location ? c.foreground : c.mutedForeground }]}>
                {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Detecting location..."}
              </Text>}
            <Pressable onPress={getLocation}><Ionicons name="refresh" size={18} color={c.primary} /></Pressable>
          </View>
        </View>
        <Text style={[styles.label, { color: c.mutedForeground }]}>Address (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
          value={address} onChangeText={setAddress}
          placeholder="e.g. 12 Marina Road, Lagos" placeholderTextColor={c.mutedForeground}
        />
        <Pressable
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: c.powerOn, opacity: pressed || isPending ? 0.85 : 1 }]}
          onPress={handleSubmit} disabled={isPending}
        >
          {isPending ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="flash" size={20} color="#fff" /><Text style={[styles.submitText, { color: "#fff" }]}>Confirm Power Restored</Text></>
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
  locationCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
