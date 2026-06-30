import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGetStatistics, useListReports } from "@workspace/api-client-react";
import colors from "@/constants/colors";

const c = colors.light;

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: string }> = {
    available: { color: c.powerOn, label: "Power Available", icon: "checkmark-circle" },
    outage: { color: c.powerOff, label: "Power Outage", icon: "close-circle" },
    unstable: { color: c.unstable, label: "Unstable Supply", icon: "warning" },
    unknown: { color: c.mutedForeground, label: "Unknown Status", icon: "help-circle" },
  };
  const cfg = config[status] || config.unknown;
  return (
    <View style={[styles.statusBadge, { borderColor: cfg.color }]}>
      <Ionicons name={cfg.icon as any} size={48} color={cfg.color} />
      <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name={icon as any} size={20} color={c.primary} />
      <Text style={[styles.statValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function ReportCard({ report }: { report: any }) {
  const router = useRouter();
  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    outage: { color: c.powerOff, icon: "flash-off", label: "Outage" },
    restoration: { color: c.powerOn, icon: "flash", label: "Restored" },
    transformer: { color: c.unstable, icon: "warning", label: "Transformer" },
  };
  const cfg = typeConfig[report.type] || typeConfig.outage;
  const timeAgo = (() => {
    const diff = Date.now() - new Date(report.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  })();

  return (
    <Pressable
      style={({ pressed }) => [styles.reportCard, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => router.push({ pathname: "/(home)/report-detail", params: { id: report.id } })}
    >
      <View style={[styles.reportIconBg, { backgroundColor: cfg.color + "20" }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.reportType, { color: c.foreground }]}>{cfg.label}</Text>
        {report.address ? <Text style={[styles.reportAddr, { color: c.mutedForeground }]} numberOfLines={1}>{report.address}</Text> : null}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.reportTime, { color: c.mutedForeground }]}>{timeAgo}</Text>
        {report.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={c.powerOn} />
            <Text style={[styles.verifiedText, { color: c.powerOn }]}>Verified</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useGetStatistics();
  const { data: reports, refetch: refetchReports } = useListReports({ status: "active", limit: 10 });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchReports()]);
    setRefreshing(false);
  };

  const handleReport = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (type === "outage") router.push("/(home)/report/outage");
    else if (type === "restoration") router.push("/(home)/report/restoration");
    else router.push("/(home)/report/transformer");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View>
            <Text style={[styles.greeting, { color: c.mutedForeground }]}>PowerPulse</Text>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>Live Status</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.mapBtn, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push("/(home)/(tabs)/map")}
          >
            <Ionicons name="map" size={20} color={c.primary} />
          </Pressable>
        </View>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <StatusBadge status={stats?.currentStatus || "unknown"} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="Reliability" value={stats ? `${stats.reliabilityPercent.toFixed(1)}%` : "—"} icon="trending-up" />
          <StatCard label="Avg Outage" value={stats ? `${stats.avgOutageDurationMinutes}m` : "—"} icon="time" />
          <StatCard label="This Month" value={stats ? `${stats.monthlyOutages}` : "—"} icon="calendar" />
        </View>

        {/* Quick report buttons */}
        <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>QUICK REPORT</Text>
        <View style={styles.quickRow}>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, { backgroundColor: c.powerOff + "15", borderColor: c.powerOff, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => handleReport("outage")}
          >
            <Ionicons name="flash-off" size={24} color={c.powerOff} />
            <Text style={[styles.quickBtnText, { color: c.powerOff }]}>Power Out</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, { backgroundColor: c.powerOn + "15", borderColor: c.powerOn, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => handleReport("restoration")}
          >
            <Ionicons name="flash" size={24} color={c.powerOn} />
            <Text style={[styles.quickBtnText, { color: c.powerOn }]}>Restored</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, { backgroundColor: c.unstable + "15", borderColor: c.unstable, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => handleReport("transformer")}
          >
            <Ionicons name="warning" size={24} color={c.unstable} />
            <Text style={[styles.quickBtnText, { color: c.unstable }]}>Transformer</Text>
          </Pressable>
        </View>

        {/* Recent reports */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>NEARBY REPORTS</Text>
          <Pressable onPress={() => router.push("/(home)/(tabs)/map")}>
            <Text style={[styles.seeAll, { color: c.primary }]}>See map</Text>
          </Pressable>
        </View>
        {!reports || reports.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color={c.mutedForeground} />
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>No active reports nearby</Text>
          </View>
        ) : (
          reports.map((r: any) => <ReportCard key={r.id} report={r} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 16 },
  greeting: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 1, textTransform: "uppercase" },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginTop: 2 },
  mapBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  statusContainer: { alignItems: "center", paddingVertical: 24, marginHorizontal: 20, backgroundColor: colors.light.card, borderRadius: 20, borderWidth: 1, borderColor: colors.light.border, marginBottom: 20 },
  statusBadge: { alignItems: "center", gap: 8, borderWidth: 0 },
  statusLabel: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center", gap: 4, padding: 14, borderRadius: 14, borderWidth: 1 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginHorizontal: 20, marginBottom: 10 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  quickRow: { flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 24 },
  quickBtn: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  quickBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  reportCard: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  reportIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  reportType: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reportAddr: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  reportTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  verifiedText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  emptyState: { alignItems: "center", gap: 8, marginHorizontal: 20, padding: 28, borderRadius: 14, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
