import { useState } from "react";
import {
  useAdminListReports,
  useUpdateReport,
  useDeleteReport,
  getAdminListReportsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, CheckCircle, Filter, Search } from "lucide-react";
import type { AdminListReportsParams } from "@workspace/api-client-react";

const TYPE_LABELS: Record<string, string> = {
  outage: "Outage",
  restoration: "Restoration",
  transformer: "Transformer",
};

const TYPE_COLORS: Record<string, string> = {
  outage: "bg-red-500/15 text-red-400",
  restoration: "bg-green-500/15 text-green-400",
  transformer: "bg-amber-500/15 text-amber-400",
};

export default function Reports() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminListReportsParams>({ limit: 100 });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminListReports(filters);
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();

  const reports = data?.reports ?? [];
  const filtered = search
    ? reports.filter(
        (r) =>
          r.address?.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()) ||
          r.userName?.toLowerCase().includes(search.toLowerCase()),
      )
    : reports;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListReportsQueryKey() });
  };

  const handleResolve = (id: number) => {
    updateReport.mutate({ id, data: { status: "resolved" } }, { onSuccess: invalidate });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this report permanently?")) return;
    deleteReport.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data?.total ?? 0} total reports
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address, description..."
            className="pl-9 pr-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: (e.target.value as any) || undefined }))
            }
            className="bg-card border border-border rounded-md text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filters.type ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: (e.target.value as any) || undefined }))
            }
            className="bg-card border border-border rounded-md text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All types</option>
            <option value="outage">Outage</option>
            <option value="restoration">Restoration</option>
            <option value="transformer">Transformer</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No reports found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reporter</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((report) => (
                <tr key={report.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">#{report.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[report.type] ?? ""}`}>
                      {TYPE_LABELS[report.type] ?? report.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      report.status === "active"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-green-500/15 text-green-400"
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-xs">
                    <div className="truncate">{report.address ?? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}</div>
                    {report.description && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{report.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{report.userName ?? report.userId.slice(0, 12) + "…"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${report.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{report.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {report.status === "active" && (
                        <button
                          onClick={() => handleResolve(report.id)}
                          disabled={updateReport.isPending}
                          title="Mark resolved"
                          className="p-1.5 rounded hover:bg-green-500/15 text-muted-foreground hover:text-green-400 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={deleteReport.isPending}
                        title="Delete report"
                        className="p-1.5 rounded hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
