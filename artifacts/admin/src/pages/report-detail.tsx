import { useRoute, useLocation } from "wouter";
import { useGetReport, useVerifyReport } from "@workspace/api-client-react";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Shield, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const typeStyle: Record<string, { label: string; dot: string; bg: string }> = {
  outage: { label: "Power Outage", dot: "bg-red-500", bg: "bg-red-500/15 border-red-500/30 text-red-400" },
  restoration: { label: "Power Restored", dot: "bg-green-500", bg: "bg-green-500/15 border-green-500/30 text-green-400" },
  transformer_fault: { label: "Transformer Fault", dot: "bg-amber-500", bg: "bg-amber-500/15 border-amber-500/30 text-amber-400" },
};

export default function ReportDetail() {
  const [, params] = useRoute("/report/:id");
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const id = Number(params?.id);
  const { data: report, isLoading, error } = useGetReport(id, { query: { enabled: !!id } });
  const { mutate: verify, isPending: verifying } = useVerifyReport();

  const handleVote = (vote: "confirm" | "dispute") => {
    verify(
      { id, data: { vote } },
      { onSuccess: () => qc.invalidateQueries() }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading report…
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  const style = typeStyle[report.type] ?? typeStyle.outage;
  const confirmations = report.confirmations ?? 0;
  const disputes = report.disputes ?? 0;
  const total = confirmations + disputes;
  const confidence = total > 0 ? Math.round((confirmations / total) * 100) : 0;

  return (
    <div className="p-6 max-w-lg">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Type badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-4 ${style.bg}`}>
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        {style.label}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${report.status === "active" ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
          {report.status === "active" ? "Active" : "Resolved"}
        </span>
        {report.verified && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
            <Shield className="w-3 h-3" /> Verified
          </span>
        )}
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5 space-y-3">
        {report.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-foreground">{report.address}</span>
          </div>
        )}
        {!report.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            {Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          {timeAgo(report.createdAt)} · {new Date(report.createdAt).toLocaleDateString()}
        </div>
        {report.description && (
          <p className="text-sm text-foreground/80 border-t border-border pt-3">{report.description}</p>
        )}
      </div>

      {/* Community Confidence */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-foreground">Community Confidence</div>
          <div className="text-sm font-bold text-primary">{confidence}%</div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${confidence}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> {confirmations} confirmations</span>
          <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {disputes} disputes</span>
        </div>
      </div>

      {/* Vote Buttons */}
      {report.status === "active" && (
        <div>
          <div className="text-sm font-medium text-foreground mb-3">Help verify this report</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVote("confirm")}
              disabled={verifying}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
              Confirm
            </button>
            <button
              onClick={() => handleVote("dispute")}
              disabled={verifying}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
              Dispute
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
