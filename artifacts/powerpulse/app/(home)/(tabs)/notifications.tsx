import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

const c = colors.light;

function NotificationItem({ notif, onRead }: { notif: any; onRead: (id: number) => void }) {
  const timeAgo = (() => {
    const diff = Date.now() - new Date(notif.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  })();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.notifCard,
        { backgroundColor: notif.read ? c.card : c.primary + "10", borderColor: notif.read ? c.border : c.primary + "40", opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => {
        if (!notif.read) {
          Haptics.selectionAsync();
          onRead(notif.id);
        }
      }}
    >
      <View style={[styles.notifDot, { backgroundColor: notif.read ? "transparent" : c.primary }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.notifTitle, { color: c.foreground }]}>{notif.title}</Text>
        <Text style={[styles.notifBody, { color: c.mutedForeground }]} numberOfLines={2}>{notif.body}</Text>
        <Text style={[styles.notifTime, { color: c.mutedForeground }]}>{timeAgo}</Text>
      </View>
      {!notif.read && <Ionicons name="ellipse" size={8} color={c.primary} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: notifications, refetch, isLoading } = useListNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadCount, { color: c.primary }]}>{unreadCount} unread</Text>
          )}
        </View>
        <Ionicons name="notifications" size={22} color={c.primary} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Platform.OS === "web" ? 34 + 84 : 100, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {!notifications || notifications.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="notifications-off-outline" size={40} color={c.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No notifications</Text>
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>You'll be notified when power status changes near your saved locations.</Text>
          </View>
        ) : (
          notifications.map((n: any) => (
            <NotificationItem
              key={n.id}
              notif={n}
              onRead={(id) => markRead({ id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  unreadCount: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  notifCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  notifDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  notifTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyState: { alignItems: "center", gap: 12, padding: 40, borderRadius: 20, borderWidth: 1, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
