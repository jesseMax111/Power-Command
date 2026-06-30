import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useGetMe, useListSavedLocations, useListReports } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

const c = colors.light;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: profile } = useGetMe();
  const { data: savedLocations } = useListSavedLocations();
  const { data: myReports } = useListReports({ limit: 100 });

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  const displayName = profile?.name || user?.fullName || "User";
  const email = profile?.email || user?.emailAddresses?.[0]?.emailAddress || "";
  const reputation = profile?.reputation || 0;
  const totalReports = myReports?.filter((r: any) => r.userId === profile?.id)?.length || 0;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Profile</Text>
        </View>

        {/* Avatar + info */}
        <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.avatar, { backgroundColor: c.primary + "25" }]}>
            <Text style={[styles.avatarInitial, { color: c.primary }]}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.displayName, { color: c.foreground }]}>{displayName}</Text>
          <Text style={[styles.email, { color: c.mutedForeground }]}>{email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.primary }]}>{reputation}</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Reputation</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.primary }]}>{totalReports}</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Reports</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.primary }]}>{savedLocations?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Saved</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>LOCATIONS</Text>
          <MenuItem
            icon="bookmark"
            label="Saved Locations"
            onPress={() => router.push("/(home)/saved-locations")}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>REPORT</Text>
          <MenuItem icon="flash-off" label="Report Outage" onPress={() => router.push("/(home)/report/outage")} iconColor={c.powerOff} />
          <MenuItem icon="flash" label="Report Restoration" onPress={() => router.push("/(home)/report/restoration")} iconColor={c.powerOn} />
          <MenuItem icon="warning" label="Report Transformer" onPress={() => router.push("/(home)/report/transformer")} iconColor={c.unstable} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>ACCOUNT</Text>
          <MenuItem icon="log-out" label="Sign Out" onPress={handleSignOut} iconColor={c.destructive} labelColor={c.destructive} />
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, onPress, iconColor, labelColor }: { icon: string; label: string; onPress: () => void; iconColor?: string; labelColor?: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.menuIconBg, { backgroundColor: (iconColor || c.primary) + "15" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor || c.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: labelColor || c.foreground }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={c.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  profileCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 6, marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarInitial: { fontSize: 30, fontFamily: "Inter_700Bold" },
  displayName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  email: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 24, marginTop: 12 },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, height: 30 },
  section: { marginBottom: 8, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 6 },
  menuIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
