import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import MapView, { Marker, Callout } from "react-native-maps";
import { useListReports } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

const c = colors.light;

const MARKER_COLORS: Record<string, string> = {
  outage: c.powerOff,
  restoration: c.powerOn,
  transformer: c.unstable,
};

const FILTER_OPTIONS = [
  { label: "All", value: undefined },
  { label: "Outages", value: "outage" },
  { label: "Restored", value: "restoration" },
  { label: "Transformer", value: "transformer" },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const { data: reports, isLoading } = useListReports({ type: filter, status: "active", limit: 100 });

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {/* Filter bar (overlay on map) */}
      <View style={[styles.filterBar, { top: insets.top + 8 }]}>
        {FILTER_OPTIONS.map(opt => (
          <Pressable
            key={opt.label}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === opt.value ? c.primary : c.card,
                borderColor: filter === opt.value ? c.primary : c.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter(opt.value);
            }}
          >
            <Text style={[styles.filterChipText, { color: filter === opt.value ? c.background : c.foreground }]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={c.primary} />
        </View>
      )}

      <MapView
        style={StyleSheet.absoluteFill}
        userInterfaceStyle="dark"
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {reports?.map((r: any) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            pinColor={MARKER_COLORS[r.type] || c.mutedForeground}
          >
            <Callout onPress={() => router.push({ pathname: "/(home)/report-detail", params: { id: r.id } })}>
              <View style={styles.callout}>
                <Text style={styles.calloutType}>{r.type.charAt(0).toUpperCase() + r.type.slice(1)}</Text>
                {r.address ? <Text style={styles.calloutAddr} numberOfLines={2}>{r.address}</Text> : null}
                <Text style={styles.calloutTap}>Tap for details</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* FAB - Report */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 90 }]}>
        <Pressable
          style={({ pressed }) => [styles.fab, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(home)/report/outage");
          }}
        >
          <Ionicons name="add" size={28} color={c.background} />
        </Pressable>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: c.card + "DD", borderColor: c.border, bottom: insets.bottom + 90 }]}>
        <LegendItem color={c.powerOn} label="Available" />
        <LegendItem color={c.powerOff} label="Outage" />
        <LegendItem color={c.unstable} label="Transformer" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: c.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterBar: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 8, zIndex: 10, flexWrap: "wrap" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 5 },
  fabContainer: { position: "absolute", right: 16, zIndex: 10 },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  legend: { position: "absolute", left: 12, flexDirection: "column", gap: 6, borderRadius: 12, padding: 10, borderWidth: 1, zIndex: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  callout: { width: 160, padding: 8 },
  calloutType: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  calloutAddr: { fontSize: 12, color: "#666", marginBottom: 4 },
  calloutTap: { fontSize: 11, color: "#888" },
});
