import { useGetStatistics, useListReports } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Zap, ZapOff, AlertTriangle, CheckCircle, TrendingUp, Clock, MapPin, ChevronRight, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function liveStatus(activeOutages: number) {
  if (activeOutages === 0) return { label: "Power Available", color: "text-green-400", bg: "bg-green-500/15 border-green-500/30", icon: CheckCircle };
  if (activeOutages <= 3) return { label: "Unstable Supply", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", icon: AlertTriangle };
  return { label: "Active Outage", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", icon: ZapOff };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const typeStyle: Record<string, { dot: string; label: string }> = {
  outage: { dot: "bg-red-500", label: "Outage" },
  restoration: { dot: "bg-green-500", label: "Restored" },
  transformer_fault: { dot: "bg-amber-500", label: "Transformer" },
};

export default function UserDashboard() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { data: stats, isLoading } = useGetStatistics();
  const { data: reports } = useListReports({ status: "active", limit: 10 } as any);

  const activeOutages = stats?.activeReports ?? 0;
  const status = liveStatus(activeOutages);
  const StatusIcon = status.icon;

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Neighbourhood Status</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live electricity reports from your community</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Live Status Badge */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${status.bg}`}>
        <StatusIcon className={`w-7 h-7 ${status.color} shrink-0`} />
        <div>
          <div className={`text-base font-semibold ${status.color}`}>{status.label}</div>
          <div className="text-xs text-muted-foreground">
            {activeOutages === 0 ? "No active outages reported nearby" : `${activeOutages} active report${activeOutages > 1 ? "s" : ""} in your area`}
          </div>
        </div>
        <span className={`ml-auto w-2 h-2 rounded-full ${activeOutages === 0 ? "bg-green-400" : activeOutages <= 3 ? "bg-amber-400" : "bg-red-400"} animate-pulse`} />
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-lg bg-card border border-border animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Reliability"
            value={stats ? `${Math.round(((stats.totalReports - stats.activeReports) / Math.max(stats.totalReports, 1)) * 100)}%` : "—"}
            icon={TrendingUp}
            color="text-green-400"
          />
          <StatCard
            label="Reports Today"
            value={stats?.reportsToday ?? 0}
            icon={Clock}
            color="text-blue-400"
          />
          <StatCard
            label="Verified"
            value={stats?.verifiedReports ?? 0}
            icon={CheckCircle}
            color="text-emerald-400"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="text-sm font-medium text-foreground mb-3">Submit a Report</div>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/report/outage">
            <button className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors">
              <ZapOff className="w-5 h-5 text-red-400" />
              <span className="text-xs font-medium text-red-400">Power Out</span>
            </button>
          </Link>
          <Link href="/report/restoration">
            <button className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-xs font-medium text-green-400">Power Back</span>
            </button>
          </Link>
          <Link href="/report/transformer">
            <button className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Transformer</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-foreground">Recent Reports</div>
          <Link href="/map" className="text-xs text-primary hover:underline">View map</Link>
        </div>
        {!reports || reports.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">No active reports nearby. ✓</div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map((r: any) => {
              const s = typeStyle[r.type] ?? typeStyle.outage;
              return (
                <Link key={r.id} href={`/report/${r.id}`}>
                  <div className="flex items-center gap-3 py-3 hover:bg-muted/30 -mx-2 px-2 rounded cursor-pointer transition-colors">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground font-medium">{s.label}</div>
                      {r.address && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{r.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</div>
                        {r.verified && <div className="text-xs text-green-400 mt-0.5">Verified</div>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
