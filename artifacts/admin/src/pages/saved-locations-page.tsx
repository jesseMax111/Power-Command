import { useState } from "react";
import { useListSavedLocations, useCreateSavedLocation, useDeleteSavedLocation } from "@workspace/api-client-react";
import { MapPin, Plus, Trash2, Home, Briefcase, School, Loader2, Navigation } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const presets = [
  { name: "Home", icon: Home },
  { name: "Office", icon: Briefcase },
  { name: "School", icon: School },
];

export default function SavedLocationsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [customName, setCustomName] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: saved, isLoading } = useListSavedLocations();
  const { mutate: createLocation, isPending: creating } = useCreateSavedLocation();
  const { mutate: deleteLocation } = useDeleteSavedLocation();

  const detectLocation = async () => {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported."); return; }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = "";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const d = await r.json();
          address = d.display_name?.split(",").slice(0, 3).join(",").trim() ?? "";
        } catch {}
        setCoords({ lat: latitude, lng: longitude, address });
        setGeoLoading(false);
      },
      () => { setGeoError("Couldn't get your location."); setGeoLoading(false); },
      { timeout: 8000 }
    );
  };

  const handleSave = () => {
    const finalName = name || customName;
    if (!finalName || !coords) return;
    createLocation(
      { data: { name: finalName, latitude: coords.lat, longitude: coords.lng, address: coords.address || undefined } },
      {
        onSuccess: () => {
          setName(""); setCustomName(""); setCoords(null); setShowForm(false);
          qc.invalidateQueries();
        },
        onError: () => alert("Failed to save location."),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Remove this saved location?")) return;
    deleteLocation({ id }, { onSuccess: () => qc.invalidateQueries() });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Saved Locations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Get notified when power status changes nearby</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 mb-5 space-y-4">
          <div className="text-sm font-medium text-foreground">Add a Location</div>

          {/* Name presets */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Choose a name</div>
            <div className="flex gap-2 flex-wrap">
              {presets.map(({ name: n, icon: Icon }) => (
                <button
                  key={n}
                  onClick={() => setName(name === n ? "" : n)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    name === n ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-foreground hover:bg-muted/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {n}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customName}
              onChange={(e) => { setCustomName(e.target.value); setName(""); }}
              placeholder="Or type a custom name…"
              className="w-full mt-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Location */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Location</div>
            <button
              onClick={detectLocation}
              disabled={geoLoading}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors disabled:opacity-50"
            >
              {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              {geoLoading ? "Detecting…" : coords ? `📍 ${coords.address || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}` : "Detect my current location"}
            </button>
            {geoError && <p className="text-xs text-red-400 mt-1">{geoError}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={creating || !coords || !(name || customName)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              Save Location
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-muted/70 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : !saved || saved.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">No saved locations yet.</div>
          <div className="text-xs text-muted-foreground/70">Add locations like Home or Office to monitor power status.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {saved.map((loc) => (
            <div key={loc.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{loc.name}</div>
                {loc.address && <div className="text-xs text-muted-foreground truncate mt-0.5">{loc.address}</div>}
                {!loc.address && <div className="text-xs text-muted-foreground mt-0.5">{Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}</div>}
              </div>
              <button
                onClick={() => handleDelete(loc.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
