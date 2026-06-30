import { useAdminGetStatistics, useAdminListReports } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertTriangle, Zap, Users, CheckCircle, TrendingUp, Activity, Clock, Shield } from "lucide-react";

const COLORS = {
  outage: "#ef4444",
  restoration: "#22c55e",
  transformer: "#f59e0b",
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ?? "bg-primary/15"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-white" : "text-primary"}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/70 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useAdminGetStatistics();
  const { data: reportsData } = useAdminListReports({ limit: 200 });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground text-sm">Loading statistics...</div>
      </div>
    );
  }

  const typeData = stats
    ? [
        { name: "Outages", value: stats.outageReports, color: COLORS.outage },
        { name: "Restorations", value: stats.restorationReports, color: COLORS.restoration },
        { name: "Transformer", value: stats.transformerReports, color: COLORS.transformer },
      ]
    : [];

  const statusData = stats
    ? [
        { name: "Active", value: stats.activeReports },
        { name: "Resolved", value: stats.resolvedReports },
      ]
    : [];

  const recent = reportsData?.reports?.slice(0, 5) ?? [];

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform overview and activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reports" value={stats?.totalReports ?? 0} icon={FileText} />
        <StatCard label="Active Reports" value={stats?.activeReports ?? 0} icon={AlertTriangle} accent="bg-red-500/20" />
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard label="Verified Reports" value={stats?.verifiedReports ?? 0} icon={Shield} accent="bg-green-500/20" />
        <StatCard label="Reports Today" value={stats?.reportsToday ?? 0} icon={Clock} sub="Since midnight" />
        <StatCard label="This Week" value={stats?.reportsThisWeek ?? 0} icon={TrendingUp} sub="Since Monday" />
        <StatCard label="Resolved" value={stats?.resolvedReports ?? 0} icon={CheckCircle} accent="bg-green-500/20" />
        <StatCard label="Outages Active" value={stats?.outageReports ?? 0} icon={Zap} accent="bg-amber-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm font-medium text-foreground mb-4">Reports by Type</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(217 33% 17%)", border: "1px solid hsl(215 28% 26%)", borderRadius: 6 }}
                labelStyle={{ color: "hsl(210 40% 96%)" }}
                itemStyle={{ color: "hsl(210 40% 96%)" }}
              />
              <Legend
                formatter={(value) => <span style={{ color: "hsl(215 16% 65%)", fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm font-medium text-foreground mb-4">Status Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 26%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215 16% 65%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 16% 65%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(217 33% 17%)", border: "1px solid hsl(215 28% 26%)", borderRadius: 6 }}
                labelStyle={{ color: "hsl(210 40% 96%)" }}
                itemStyle={{ color: "hsl(210 40% 96%)" }}
              />
              <Bar dataKey="value" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="text-sm font-medium text-foreground mb-4">Recent Reports</div>
        {recent.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">No reports yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    r.type === "outage" ? "bg-red-500" :
                    r.type === "restoration" ? "bg-green-500" : "bg-amber-500"
                  }`} />
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate capitalize">{r.type}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.address ?? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === "active" ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"
                  }`}>
                    {r.status}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      <path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
    </svg>
  );
}
