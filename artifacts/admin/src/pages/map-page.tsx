import { useEffect, useRef } from "react";
import { useListReports } from "@workspace/api-client-react";
import { Loader2, MapPin } from "lucide-react";

const TYPE_COLOR: Record<string, string> = {
  outage: "#ef4444",
  restoration: "#22c55e",
  transformer_fault: "#f59e0b",
};

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { data: reports, isLoading } = useListReports({ status: "active", limit: 100 } as any);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((mod) => {
      if (cancelled) return;
      const L = mod.default;
      import("leaflet/dist/leaflet.css");

      // Container may not be mounted yet, or map already created — bail safely.
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView([-26.2041, 28.0473], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Fix sizing issues when the container becomes visible after mount.
      setTimeout(() => map.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add markers when reports load
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !reports) return;

    import("leaflet").then((mod) => {
      const L = mod.default;
      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) map.removeLayer(layer);
      });

      (reports as any[]).forEach((r) => {
        const color = TYPE_COLOR[r.type] ?? "#94a3b8";
        const label = r.type === "outage" ? "Power Out" : r.type === "restoration" ? "Restored" : "Transformer";
        L.circleMarker([Number(r.latitude), Number(r.longitude)], {
          radius: 10,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.35,
        })
          .addTo(map)
          .bindPopup(`
            <div style="font-size:13px;font-weight:600;color:${color}">${label}</div>
            ${r.address ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${r.address}</div>` : ""}
            <div style="font-size:11px;color:#64748b;margin-top:4px">${r.status === "active" ? "🔴 Active" : "✅ Resolved"}${r.verified ? " · Verified" : ""}</div>
          `);
      });

      // Auto-fit bounds if there are markers
      if ((reports as any[]).length > 0) {
        const bounds = L.latLngBounds((reports as any[]).map((r) => [Number(r.latitude), Number(r.longitude)]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    });
  }, [reports]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4 shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Live Map</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? "Loading reports…" : `${(reports as any)?.length ?? 0} active report${((reports as any)?.length ?? 0) !== 1 ? "s" : ""} on the map`}
        </p>
      </div>

      {/* Legend */}
      <div className="px-6 pb-4 flex items-center gap-4 shrink-0">
        {[
          { color: "bg-red-500", label: "Outage" },
          { color: "bg-green-500", label: "Restored" },
          { color: "bg-amber-500", label: "Transformer" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${color} opacity-70`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 px-6 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reports…
        </div>
      )}

      <div ref={mapRef} className="flex-1 mx-6 mb-6 rounded-xl overflow-hidden border border-border min-h-[400px]" />

      {!isLoading && (!reports || (reports as any[]).length === 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <MapPin className="w-8 h-8 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">No active reports to show</div>
        </div>
      )}
    </div>
  );
}
