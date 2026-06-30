import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  const handleMarkRead = (id: number) => {
    markRead({ id }, { onSuccess: () => qc.invalidateQueries() });
  };

  const handleMarkAllRead = () => {
    const unread = notifications?.filter((n) => !n.read) ?? [];
    unread.forEach((n) => markRead({ id: n.id }, { onSuccess: () => qc.invalidateQueries() }));
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BellOff className="w-10 h-10 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">No notifications yet.</div>
          <div className="text-xs text-muted-foreground/70">
            You'll get notified when power status changes near your saved locations.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                n.read ? "bg-card border-border opacity-60" : "bg-card border-primary/20 shadow-sm"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                n.read ? "bg-muted" : "bg-primary/15"
              }`}>
                <Bell className={`w-4 h-4 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground leading-snug">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                <div className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors shrink-0 mt-1"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
