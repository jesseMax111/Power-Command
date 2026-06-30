import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListReports } from "@workspace/api-client-react";
import colors from "@/constants/colors";

const c = colors.light;

// Web fallback — react-native-maps is native only.
// On native, map.native.tsx is loaded instead.
export default function MapWebFallback() {
  const insets = useSafeAreaInsets();
  const { data: reports } = useListReports({ status: "active", limit: 100 });

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Live Map</Text>
      </View>
      <View style={[styles.placeholder, { backgroundColor: c.card, borderColor: c.border }]}>
        <Ionicons name="map-outline" size={48} color={c.mutedForeground} />
        <Text style={[styles.placeholderTitle, { color: c.foreground }]}>Interactive Map</Text>
        <Text style={[styles.placeholderText, { color: c.mutedForeground }]}>
          Open PowerPulse in Expo Go on your phone to see the live electricity status map.
        </Text>
        {reports && reports.length > 0 && (
          <Text style={[styles.activeCount, { color: c.primary }]}>
            {reports.length} active report{reports.length !== 1 ? "s" : ""} right now
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  placeholder: { flex: 1, margin: 20, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  placeholderTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  placeholderText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  activeCount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
