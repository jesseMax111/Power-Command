import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useCreateReport } from "@workspace/api-client-react";
import { Zap, ZapOff, AlertTriangle, MapPin, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

type ReportType = "outage" | "restoration" | "transformer_fault";

const config: Record<ReportType, { label: string; desc: string; icon: React.ElementType; color: string; accent: string }> = {
  outage: {
    label: "Report Power Outage",
    desc: "Let your community know power is out in your area.",
    icon: ZapOff,
    color: "text-red-400",
    accent: "bg-red-500/15 border-red-500/30",
  },
  restoration: {
    label: "Report Power Restoration",
    desc: "Great news — let everyone know power is back!",
    icon: Zap,
    color: "text-green-400",
    accent: "bg-green-500/15 border-green-500/30",
  },
  transformer_fault: {
    label: "Report Transformer Fault",
    desc: "Warn the community about a transformer issue.",
    icon: AlertTriangle,
    color: "text-amber-400",
    accent: "bg-amber-500/15 border-amber-500/30",
  },
};

export default function ReportForm() {
  const [, navigate] = useLocation();
  const [matchOutage] = useRoute("/report/outage");
  const [matchRestoration] = useRoute("/report/restoration");
  const [matchTransformer] = useRoute("/report/transformer");

  const type: ReportType = matchOutage ? "outage" : matchRestoration ? "restoration" : "transformer_fault";
  const cfg = config[type];
  const Icon = cfg.icon;

  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { mutate: createReport, isPending } = useCreateReport();

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported."); return; }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const d = await r.json();
          if (d.display_name) {
            const parts = d.display_name.split(",").slice(0, 3).join(",");
            setAddress(parts.trim());
          }
        } catch {
          // Couldn't reverse geocode — user can type manually
        }
        setGeoLoading(false);
      },
      () => { setGeoError("Couldn't get location. Enter address manually."); setGeoLoading(false); },
      { timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return;
    createReport(
      {
        data: {
          type,
          latitude: coords.lat,
          longitude: coords.lng,
          address: address || undefined,
          description: description || undefined,
        },
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => alert("Failed to submit report. Please try again."),
      }
    );
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-xl font-semibold text-foreground">Report Submitted</div>
          <div className="text-sm text-muted-foreground">
            Your report has been shared with the community. Thank you!
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => navigate("/dashboard")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Back to Dashboard
            </button>
            <button onClick={() => { setSubmitted(false); setDescription(""); }} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors">
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${cfg.accent}`}>
        <Icon className={`w-6 h-6 ${cfg.color} shrink-0`} />
        <div>
          <div className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</div>
          <div className="text-xs text-muted-foreground">{cfg.desc}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={geoLoading ? "Detecting location…" : "Enter address or use GPS"}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoLoading}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              GPS
            </button>
          </div>
          {geoError && <p className="text-xs text-red-400 mt-1">{geoError}</p>}
          {coords && !geoLoading && (
            <p className="text-xs text-green-400 mt-1">
              📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add any details that might help your community…"
            className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!coords || isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
          {isPending ? "Submitting…" : `Submit ${cfg.label.replace("Report ", "")}`}
        </button>
      </form>
    </div>
  );
}
