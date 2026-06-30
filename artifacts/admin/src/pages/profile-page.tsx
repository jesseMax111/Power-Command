import { useGetMe, useListReports } from "@workspace/api-client-react";
import { useUser, useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { LogOut, Star, FileText, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile } = useGetMe();
  const { data: reportsData } = useListReports({ limit: 200 } as any);

  const displayName = profile?.name || user?.fullName || "User";
  const email = profile?.email || user?.emailAddresses?.[0]?.emailAddress || "";
  const reputation = profile?.reputation ?? 0;
  const initial = displayName.charAt(0).toUpperCase();
  const myReports = (reportsData as any)?.length ?? 0;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your account and community stats</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-card border border-border rounded-xl p-6 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold text-foreground truncate">{displayName}</div>
            <div className="text-sm text-muted-foreground truncate">{email}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
          <StatItem icon={Star} label="Reputation" value={reputation} color="text-amber-400" />
          <StatItem icon={FileText} label="Reports" value={myReports} color="text-blue-400" />
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
        <button
          onClick={() => navigate("/saved-locations")}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/40 transition-colors border-b border-border"
        >
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Saved Locations
          <span className="ml-auto text-muted-foreground">→</span>
        </button>
        <button
          onClick={() => navigate("/notifications")}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/40 transition-colors"
        >
          <Star className="w-4 h-4 text-muted-foreground" />
          Notifications
          <span className="ml-auto text-muted-foreground">→</span>
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
