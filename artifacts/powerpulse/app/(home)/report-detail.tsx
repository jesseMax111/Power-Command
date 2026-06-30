import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGetReport, useVerifyReport } from "@workspace/api-client-react";
import { useUser } from "@clerk/expo";
import colors from "@/constants/colors";

const c = colors.light;

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const { data: report, isLoading, refetch } = useGetReport(parseInt(id || "0"));
  const { mutate: verifyReport, isPending } = useVerifyReport();

  const handleVote = (vote: "confirm" | "dispute") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    verifyReport(
      { id: parseInt(id || "0"), data: { vote } },
      {
        onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); refetch(); },
        onError: () => Alert.alert("Error", "Vote failed"),
      }
    );
  };

  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    outage: { color: c.powerOff, icon: "flash-off", label: "Power Outage" },
    restoration: { color: c.powerOn, icon: "flash", label: "Power Restored" },
    transformer: { color: c.unstable, icon: "warning", label: "Transformer Fault" },
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={[styles.errorText, { color: c.mutedForeground }]}>Report not found</Text>
        <Pressable onPress={() => router.back()}><Text style={{ color: c.primary, marginTop: 8 }}>Go back</Text></Pressable>
      </View>
    );
  }

  const cfg = typeConfig[report.type] || typeConfig.outage;
  const confidencePct = report.confidence;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Report Detail</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: cfg.color + "15", borderColor: cfg.color }]}>
          <Ionicons name={cfg.icon as any} size={28} color={cfg.color} />
          <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          {report.verified && (
            <View style={[styles.verifiedPill, { backgroundColor: c.powerOn + "20", borderColor: c.powerOn }]}>
              <Ionicons name="checkmark-circle" size={12} color={c.powerOn} />
              <Text style={[styles.verifiedText, { color: c.powerOn }]}>Verified</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <DetailRow icon="time" label="Reported" value={timeAgo(report.createdAt)} />
          {report.address && <DetailRow icon="location" label="Location" value={report.address} />}
          {report.faultType && <DetailRow icon="alert-circle" label="Fault Type" value={report.faultType.replace(/_/g, " ")} />}
          {report.description && <DetailRow icon="document-text" label="Notes" value={report.description} />}
          <DetailRow icon="person" label="Status" value={report.status.charAt(0).toUpperCase() + report.status.slice(1)} />
        </View>

        {/* Confidence */}
        <View style={[styles.confidenceCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.confidenceLabel, { color: c.mutedForeground }]}>Community Confidence</Text>
          <View style={[styles.confidenceBar, { backgroundColor: c.border }]}>
            <View style={[styles.confidenceFill, { backgroundColor: confidencePct >= 70 ? c.powerOn : c.primary, width: `${confidencePct}%` as any }]} />
          </View>
          <View style={styles.voteRow}>
            <View style={styles.voteItem}>
              <Ionicons name="thumbs-up" size={14} color={c.powerOn} />
              <Text style={[styles.voteCount, { color: c.powerOn }]}>{report.confirmations} confirmed</Text>
            </View>
            <View style={styles.voteItem}>
              <Ionicons name="thumbs-down" size={14} color={c.powerOff} />
              <Text style={[styles.voteCount, { color: c.powerOff }]}>{report.disputes} disputed</Text>
            </View>
          </View>
        </View>

        {/* Vote buttons */}
        <View style={styles.voteButtons}>
          <Pressable
            style={({ pressed }) => [styles.voteBtn, { backgroundColor: c.powerOn + "20", borderColor: c.powerOn, opacity: pressed || isPending ? 0.8 : 1, flex: 1 }]}
            onPress={() => handleVote("confirm")}
            disabled={isPending}
          >
            <Ionicons name="thumbs-up" size={18} color={c.powerOn} />
            <Text style={[styles.voteBtnText, { color: c.powerOn }]}>Confirm</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.voteBtn, { backgroundColor: c.powerOff + "15", borderColor: c.powerOff, opacity: pressed || isPending ? 0.8 : 1, flex: 1 }]}
            onPress={() => handleVote("dispute")}
            disabled={isPending}
          >
            <Ionicons name="thumbs-down" size={18} color={c.powerOff} />
            <Text style={[styles.voteBtnText, { color: c.powerOff }]}>Dispute</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={c.mutedForeground} />
      <Text style={[styles.detailLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 20, gap: 12 },
  typeBadge: { alignItems: "center", gap: 8, padding: 24, borderRadius: 20, borderWidth: 1.5 },
  typeLabel: { fontSize: 22, fontFamily: "Inter_700Bold" },
  verifiedPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  verifiedText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  detailCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_500Medium", width: 70 },
  detailValue: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  confidenceCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  confidenceLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  confidenceBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  confidenceFill: { height: 6, borderRadius: 3 },
  voteRow: { flexDirection: "row", justifyContent: "space-between" },
  voteItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  voteCount: { fontSize: 12, fontFamily: "Inter_500Medium" },
  voteButtons: { flexDirection: "row", gap: 10 },
  voteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  voteBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
