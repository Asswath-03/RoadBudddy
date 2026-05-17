import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin, Phone, Navigation, List, Map,
  Loader2, AlertTriangle, Clock, ExternalLink,
  RefreshCw, ChevronDown, MessageCircle, BadgeCheck, Wrench,
  LocateFixed, X, Info, Signal, Search, Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useGPSLocation, forwardGeocode, reverseGeocode } from "@/hooks/useGPSLocation";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
interface Place {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  distance_km: number;
  travel_minutes?: number;
  lat: number;
  lng: number;
  place_id?: string;
  verified?: boolean;
  experience_years?: number;
}

const PAGE_SIZE = 15;

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) *
    Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchVerifiedMechanics(
  userLat: number,
  userLng: number,
  radiusKm: number
): Promise<Place[]> {
  try {
    const { data, error } = await supabase
      .from("verified_mechanics" as any)
      .select("*")
      .eq("verified", true);
    if (error) throw error;
    const rows: any[] = data || [];
    return rows
      .map((r) => {
        const dist = Math.round(haversineKm(userLat, userLng, r.latitude, r.longitude) * 10) / 10;
        if (dist > radiusKm) return null;
        return {
          id: `verified-${r.id}`,
          name: r.garage_name,
          category: "Car Repair",
          address: r.address,
          phone: r.phone_number,
          website: null,
          opening_hours: null,
          distance_km: dist,
          travel_minutes: Math.round((dist / 30) * 60),
          lat: r.latitude,
          lng: r.longitude,
          verified: true,
          experience_years: r.experience_years,
          services: r.services,
        } as Place;
      })
      .filter(Boolean) as Place[];
  } catch (e) {
    console.warn("[VerifiedMechanics] fetch failed:", e);
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Error boundary
───────────────────────────────────────────────────────────────────────────── */
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };
  componentDidCatch(err: Error) {
    console.error("[MapErrorBoundary] caught:", err);
    this.setState({ crashed: true });
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Map failed to load. The list view above still works.
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   LeafletMap (dynamically imported)
───────────────────────────────────────────────────────────────────────────── */
const LeafletMap = ({
  places,
  userLocation,
}: {
  places: Place[];
  userLocation: { lat: number; lng: number } | null;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const mechsRef = useRef<any>(null);
  const userPinRef = useRef<any>(null);

  /* initialise map once */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      mapRef.current = L.map(containerRef.current!, {
        center: userLocation
          ? [userLocation.lat, userLocation.lng]
          : [20.5937, 78.9629],
        zoom: userLocation ? 14 : 5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapRef.current);

      mechsRef.current = L.layerGroup().addTo(mapRef.current);
    })();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      mechsRef.current = null;
      userPinRef.current = null;
    };
  }, []);

  /* update user pin + auto-center map */
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    (async () => {
      const L = (await import("leaflet")).default;
      userPinRef.current?.remove();

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;background:#2563eb;border:3px solid #fff;
          border-radius:50%;box-shadow:0 2px 12px rgba(37,99,235,.7);
          display:flex;align-items:center;justify-content:center;position:relative;">
          <div style="width:9px;height:9px;background:#fff;border-radius:50%"></div>
          <div style="position:absolute;width:50px;height:50px;border:2px solid rgba(37,99,235,.3);
            border-radius:50%;top:-13px;left:-13px;animation:ping 1.5s ease-out infinite"></div>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 999 })
        .bindPopup(`<b>📍 Your Location</b><br/><span style="font-size:11px;color:#6b7280">
          ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}</span>`)
        .addTo(mapRef.current);

      userPinRef.current = marker;
      // Auto-center map on detected location
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1.2 });
    })();
  }, [userLocation]);

  /* update mechanic markers */
  useEffect(() => {
    if (!mechsRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      mechsRef.current.clearLayers();

      places.forEach((p) => {
        const min = p.travel_minutes ?? Math.round((p.distance_km / 30) * 60);
        const color = p.verified ? "#16a34a" : "#ef4444";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;background:${color};border:2px solid #fff;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">
            <svg style="transform:rotate(45deg)" width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94
                7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -30],
        });

        L.marker([p.lat, p.lng], { icon })
          .bindPopup(`<div style="font-family:system-ui;min-width:170px">
            <b style="font-size:13px">${p.name}</b>
            ${p.verified ? `<span style="font-size:10px;background:#dcfce7;color:#16a34a;border-radius:4px;padding:1px 5px;margin-left:4px">⭐ Verified</span>` : ""}
            <br/><span style="font-size:11px;color:#6b7280">${p.category}</span><br/>
            <span style="font-size:11px">📏 ${p.distance_km} km &nbsp;🕐 ~${min} min</span>
            ${p.address ? `<br/><span style="font-size:11px;color:#6b7280">${p.address}</span>` : ""}
            <br/>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}"
              target="_blank" rel="noopener"
              style="display:inline-block;margin-top:6px;padding:4px 10px;background:#2563eb;
                color:#fff;border-radius:6px;font-size:11px;text-decoration:none">
              Open in Google Maps ↗
            </a></div>`)
          .addTo(mechsRef.current);
      });
    })();
  }, [places]);

  return (
    <div
      ref={containerRef}
      style={{ height: 440, width: "100%" }}
      className="rounded-xl overflow-hidden border border-border"
    />
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Manual Location Entry Modal
───────────────────────────────────────────────────────────────────────────── */
const ManualLocationModal = ({
  onSubmit,
  onClose,
  errorMessage,
}: {
  onSubmit: (lat: number, lng: number) => void;
  onClose: () => void;
  errorMessage: string;
}) => {
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [validationErr, setValidationErr] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setValidationErr("Latitude must be between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setValidationErr("Longitude must be between -180 and 180.");
      return;
    }
    onSubmit(lat, lng);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <LocateFixed className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Location Access Needed</h3>
                <p className="text-xs text-muted-foreground mt-0.5">GPS permission was denied</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Error notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>

          {/* How to enable */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs mb-5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>
              To enable GPS: click the 🔒 padlock icon in your browser's address bar →{" "}
              <strong>Location → Allow</strong>, then refresh and try again.
            </p>
          </div>

          {/* Manual entry form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-medium text-foreground">Or enter your coordinates manually:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Latitude</label>
                <Input
                  id="manual-lat"
                  type="number"
                  step="any"
                  placeholder="e.g. 12.9716"
                  value={latStr}
                  onChange={(e) => { setLatStr(e.target.value); setValidationErr(""); }}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Longitude</label>
                <Input
                  id="manual-lng"
                  type="number"
                  step="any"
                  placeholder="e.g. 77.5946"
                  value={lngStr}
                  onChange={(e) => { setLngStr(e.target.value); setValidationErr(""); }}
                  className="text-sm"
                />
              </div>
            </div>
            {validationErr && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {validationErr}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              💡 Find your coords at{" "}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                Google Maps
              </a>{" "}
              (right-click your location → copy coordinates).
            </p>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!latStr || !lngStr}
                className="flex-1 bg-primary text-primary-foreground"
              >
                <MapPin className="w-4 h-4 mr-1.5" />
                Use This Location
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Refine Location Modal — draggable pin + address search
───────────────────────────────────────────────────────────────────────────── */
const RefineLocationModal = ({
  initialLat,
  initialLng,
  initialAddress,
  onConfirm,
  onClose,
}: {
  initialLat: number;
  initialLng: number;
  initialAddress: string;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [pinLat, setPinLat] = useState(initialLat);
  const [pinLng, setPinLng] = useState(initialLng);
  const [pinAddress, setPinAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    let mounted = true;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!mounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 17,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:32px;height:32px;background:#2563eb;border:3px solid #fff;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          box-shadow:0 3px 10px rgba(37,99,235,.5);display:flex;align-items:center;justify-content:center">
          <div style="width:10px;height:10px;background:#fff;border-radius:50%;transform:rotate(45deg)"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([initialLat, initialLng], { draggable: true, icon }).addTo(map);

      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        setPinLat(pos.lat);
        setPinLng(pos.lng);
        setGeocoding(true);
        const { formatted } = await reverseGeocode(pos.lat, pos.lng);
        setPinAddress(formatted);
        setGeocoding(false);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      mounted = false;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, []);

  // Address search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const result = await forwardGeocode(searchQuery);
    setSearching(false);
    if (!result) {
      toast.error("Address not found. Try a different search.");
      return;
    }
    setPinLat(result.lat);
    setPinLng(result.lng);
    if (markerInstanceRef.current && mapInstanceRef.current) {
      markerInstanceRef.current.setLatLng([result.lat, result.lng]);
      mapInstanceRef.current.flyTo([result.lat, result.lng], 17, { animate: true, duration: 0.8 });
    }
    setGeocoding(true);
    const { formatted } = await reverseGeocode(result.lat, result.lng);
    setPinAddress(formatted);
    setGeocoding(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Crosshair className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Refine Your Location</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Drag the pin or search an address</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Address search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, landmark, or place…"
              className="text-sm flex-1"
            />
            <Button type="submit" size="sm" disabled={searching} className="shrink-0">
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </Button>
          </form>

          {/* Map */}
          <div ref={mapContainerRef} className="w-full h-64 rounded-xl border border-border overflow-hidden mb-3" style={{ zIndex: 0 }} />

          {/* Pin address */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary border border-border text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
            <div className="flex-1 min-w-0">
              {geocoding ? (
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Looking up address…
                </span>
              ) : (
                <>
                  <p className="text-xs font-medium text-foreground leading-snug">{pinAddress}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{pinLat.toFixed(6)}, {pinLng.toFixed(6)}</p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => onConfirm(pinLat, pinLng)} disabled={geocoding} className="flex-1 bg-primary text-primary-foreground">
              <MapPin className="w-4 h-4 mr-1.5" />
              Confirm Location
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */
const NearbyMechanics = () => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [radius, setRadius] = useState("10000");
  const [view, setView] = useState<"list" | "map">("list");

  const {
    location: userLocation,
    locSource,
    locating,
    loadingLabel,
    liveAccuracy,
    phase,
    gpsError,
    needsManualEntry,
    setNeedsManualEntry,
    showRefineModal,
    setShowRefineModal,
    detectLocation,
    applyManualLocation,
    applyRefinedLocation,
  } = useGPSLocation();

  /* ── Start location detection on mount ─────────────────────────────── */
  useEffect(() => { detectLocation(); }, [detectLocation]);

  /* ── Toasts on location source change ───────────────────────────────── */
  useEffect(() => {
    if (locSource === "manual") {
      toast.success("Using your manually entered location.");
    }
    if (phase === "done" && locSource === "gps" && userLocation) {
      const acc = userLocation.accuracy;
      if (acc > 0 && acc > 100) {
        toast.warning(`GPS accuracy is ±${Math.round(acc)}m — results may be slightly off.`);
      }
    }
  }, [locSource, phase, userLocation]);

  /* ── Fetch mechanics ────────────────────────────────────────────────── */
  const fetchNearby = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setFetchError(null);
    setNotice(null);
    setVisibleCount(PAGE_SIZE);

    const radiusKm = parseInt(radius) / 1000;
    const r = parseInt(radius);
    const { lat, lng } = userLocation;
    console.log(`[Fetch] lat:${lat} lng:${lng} r:${r}m`);

    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["shop"="car_repair"](around:${r},${lat},${lng});
          way["shop"="car_repair"](around:${r},${lat},${lng});
          node["amenity"="car_repair"](around:${r},${lat},${lng});
          node["shop"="tyres"](around:${r},${lat},${lng});
          node["shop"="auto_parts"](around:${r},${lat},${lng});
          node["amenity"="fuel"](around:${r},${lat},${lng});
          node["shop"="motorcycle_repair"](around:${r},${lat},${lng});
          node["craft"="mechanic"](around:${r},${lat},${lng});
        );
        out center tags;
      `;

      const [verifiedResult, osmResponse] = await Promise.allSettled([
        fetchVerifiedMechanics(lat, lng, radiusKm),
        fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: overpassQuery,
          signal: AbortSignal.timeout(30000),
        }),
      ]);

      const verified: Place[] =
        verifiedResult.status === "fulfilled" ? verifiedResult.value : [];

      let osmPlaces: Place[] = [];
      if (osmResponse.status === "fulfilled" && osmResponse.value.ok) {
        const data = await osmResponse.value.json();
        const elements: any[] = data.elements || [];
        const categoryMap: Record<string, string> = {
          car_repair: "Car Repair",
          tyres: "Tyre Shop",
          auto_parts: "Car Parts",
          fuel: "Fuel Station",
          motorcycle_repair: "Bike Repair",
          mechanic: "Mechanic",
        };
        osmPlaces = elements
          .filter((el) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            return elLat && elLng && el.tags?.name;
          })
          .map((el) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            const tags = el.tags || {};
            const shopType = tags.shop || tags.amenity || tags.craft || "car_repair";
            const distKm = Math.round(haversineKm(lat, lng, elLat, elLng) * 10) / 10;
            return {
              id: `osm-${el.id}`,
              name: tags.name,
              category: categoryMap[shopType] ?? "Car Repair",
              address: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || null,
              phone: tags.phone || tags["contact:phone"] || null,
              website: tags.website || tags["contact:website"] || null,
              opening_hours: tags.opening_hours || null,
              distance_km: distKm,
              travel_minutes: Math.round((distKm / 30) * 60),
              lat: elLat,
              lng: elLng,
              verified: false,
            } as Place;
          });
        console.log(`[Overpass] ${osmPlaces.length} results`);
      } else {
        setNotice("Could not reach map server. Showing verified partners only.");
      }

      const verifiedNames = new Set(verified.map((v) => v.name.toLowerCase().trim()));
      const uniqueOsm = osmPlaces.filter(
        (p) => !verifiedNames.has(p.name.toLowerCase().trim())
      );
      const combined = [
        ...verified.sort((a, b) => a.distance_km - b.distance_km),
        ...uniqueOsm.sort((a, b) => a.distance_km - b.distance_km),
      ];

      console.log(`[Fetch] ${verified.length} verified + ${uniqueOsm.length} OSM = ${combined.length} total`);
      setAllPlaces(combined);

      if (combined.length === 0) {
        toast.info("No mechanics found. Try increasing the search radius.");
      } else {
        toast.success(
          `Found ${combined.length} mechanic${combined.length !== 1 ? "s" : ""} nearby` +
          (verified.length > 0 ? ` (${verified.length} verified ⭐)` : "") + "."
        );
      }
    } catch (e: any) {
      console.error("[Fetch] error:", e);
      setFetchError(e.message || "Failed to fetch nearby mechanics");
      toast.error("Failed to fetch nearby mechanics.");
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius]);

  useEffect(() => {
    if (userLocation) fetchNearby();
  }, [userLocation, fetchNearby]);

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const openMaps = (p: Place) =>
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
      "_blank", "noopener,noreferrer"
    );

  const cleanPhone = (raw: string) => raw.replace(/[\s\-().]/g, "");
  const waPhone = (raw: string) => raw.replace(/[^0-9]/g, "");

  const catColor = (cat: string) => {
    if (cat === "Tyre Shop") return "border-yellow-500 text-yellow-600";
    if (cat === "Car Parts") return "border-blue-500 text-blue-600";
    if (cat === "Fuel Station") return "border-green-500 text-green-600";
    if (cat === "Bike Repair") return "border-purple-500 text-purple-600";
    return "border-primary text-primary";
  };

  const visiblePlaces = allPlaces.slice(0, visibleCount);
  const hasMore = visibleCount < allPlaces.length;

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* Manual location modal (permission denied fallback) */}
      {needsManualEntry && gpsError && (
        <ManualLocationModal
          errorMessage={gpsError.message}
          onSubmit={(lat, lng) => {
            setNeedsManualEntry(false);
            applyManualLocation(lat, lng);
          }}
          onClose={() => setNeedsManualEntry(false)}
        />
      )}

      {/* Refine location modal (drag pin / search address) */}
      {showRefineModal && userLocation && (
        <RefineLocationModal
          initialLat={userLocation.lat}
          initialLng={userLocation.lng}
          initialAddress={userLocation.address || `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`}
          onConfirm={(lat, lng) => applyRefinedLocation(lat, lng)}
          onClose={() => setShowRefineModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-emergency flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Nearby Mechanics
            </h2>
            {allPlaces.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {allPlaces.length} found · verified first
                {locSource === "manual" && " · manual location"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="5000">Within 5 km</SelectItem>
              <SelectItem value="10000">Within 10 km</SelectItem>
              <SelectItem value="15000">Within 15 km</SelectItem>
              <SelectItem value="20000">Within 20 km</SelectItem>
              <SelectItem value="25000">Within 25 km</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline" size="sm"
            disabled={loading || locating}
            onClick={() => { if (userLocation) fetchNearby(); else detectLocation(); }}
            className="border-border text-foreground hover:bg-secondary"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {notice}
        </div>
      )}

      {/* ── Locating state ── */}
      {locating && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${phase === "improving"
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
        >
          <div className="relative shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
            <div className={`absolute inset-0 rounded-full border-2 animate-ping opacity-40 ${phase === "improving" ? "border-amber-400" : "border-blue-300"
              }`} />
          </div>
          <div className="flex-1">
            <p className="font-medium">{loadingLabel}</p>
            {phase === "getting" && (
              <p className="text-xs mt-0.5 opacity-70">
                enableHighAccuracy · timeout: 15s · maximumAge: 0 · Please allow location access if prompted
              </p>
            )}
            {phase === "improving" && liveAccuracy !== null && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: `${Math.max(5, Math.min(100, (100 / liveAccuracy) * 100))}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-mono shrink-0">±{Math.round(liveAccuracy)}m</span>
              </div>
            )}
            {phase === "geocoding" && (
              <p className="text-xs mt-0.5 opacity-70">Looking up your street address…</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Detected location info bar ── */}
      {userLocation && !locating && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${locSource === "gps" && userLocation.accuracy <= 100
            ? "bg-green-50 border-green-200 text-green-800"
            : locSource === "gps" && userLocation.accuracy > 100
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-purple-50 border-purple-200 text-purple-800"
            }`}
        >
          <LocateFixed className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {locSource === "gps" ? "📡 GPS Location Detected" : "✏️ Manual Location"}
              </span>
              {locSource === "gps" && userLocation.accuracy > 0 && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 ${userLocation.accuracy <= 20
                  ? "bg-green-200 text-green-800"
                  : userLocation.accuracy <= 100
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                  <Signal className="w-2.5 h-2.5" />
                  ±{Math.round(userLocation.accuracy)}m
                </span>
              )}
              <span className="text-xs opacity-60 font-mono">
                {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
              </span>
            </div>
            {userLocation.address && (
              <p className="text-xs mt-0.5 opacity-80 truncate">
                📍 {userLocation.address}
              </p>
            )}
            {locSource === "gps" && userLocation.accuracy > 100 && (
              <p className="text-xs mt-0.5 text-amber-600">
                ⚠️ Low accuracy — move outdoors or enable Precise Location for better results.
              </p>
            )}
          </div>
          <button
            onClick={() => setNeedsManualEntry(true)}
            className="text-xs underline shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            Change
          </button>
        </motion.div>
      )}


      {/* ── GPS error (non-permission, no fallback available) ── */}
      {gpsError && !needsManualEntry && !userLocation && !locating && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p>{gpsError.message}</p>
            <div className="flex gap-3 mt-2">
              <button onClick={detectLocation} className="underline text-xs">
                Try again
              </button>
              <button onClick={() => setNeedsManualEntry(true)} className="underline text-xs">
                Enter manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fetch error ── */}
      {fetchError && !loading && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p>{fetchError}</p>
            <button onClick={fetchNearby} className="underline text-xs mt-1">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!locating && userLocation && (
        <>
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border bg-secondary w-fit">
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors ${view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {v === "list" ? <List className="w-3.5 h-3.5" /> : <Map className="w-3.5 h-3.5" />}
                {v === "list" ? "List" : "Map"}
                {v === "list" && allPlaces.length > 0 && (
                  <span className="text-[10px] opacity-70">({allPlaces.length})</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Searching for nearby mechanics…</span>
            </div>
          ) : (
            <>
              {/* ── LIST ── */}
              {view === "list" && (
                <div className="space-y-3">
                  <AnimatePresence>
                    {allPlaces.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        No mechanics found. Try increasing the search radius or refreshing.
                      </p>
                    )}
                    {visiblePlaces.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      >
                        <Card className={`bg-card border hover:shadow-md transition-all ${p.verified
                          ? "border-green-300 shadow-green-100 shadow-sm bg-green-50/30"
                          : "border-border"
                          }`}>
                          <CardContent className="p-4">

                            {/* Header row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">#{i + 1}</span>
                                  <h3 className="font-semibold text-foreground text-sm truncate">{p.name}</h3>
                                  {p.verified && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 border border-green-300 rounded-full px-2 py-0.5 shrink-0">
                                      <BadgeCheck className="w-3 h-3" /> Verified Mechanic
                                    </span>
                                  )}
                                </div>

                                {p.address && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {p.address}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className={`text-[10px] shrink-0 ${catColor(p.category)}`}>
                                {p.category}
                              </Badge>
                            </div>

                            {/* Distance + time row */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {p.distance_km} km away
                              </span>
                              {p.travel_minutes !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  ~{p.travel_minutes} min
                                </span>
                              )}
                              {p.opening_hours && (
                                <span className="flex items-center gap-1 truncate max-w-[160px]">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  {p.opening_hours}
                                </span>
                              )}
                            </div>

                            {/* Services */}
                            {p.verified && (
                              <div className="mt-2 text-xs text-slate-600 flex items-start gap-1">
                                <Wrench className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                                <span className="line-clamp-2">{(p as any).services || p.category}</span>
                              </div>
                            )}

                            {/* Phone display */}
                            {p.phone && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                                <Phone className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                <span>📞 {p.phone}</span>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <Button
                                size="sm"
                                onClick={() => openMaps(p)}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 min-w-[90px]"
                              >
                                <Navigation className="w-3 h-3 mr-1" />
                                Directions
                              </Button>

                              {p.phone && (
                                <Button
                                  size="sm"
                                  onClick={() => { window.location.href = `tel:${cleanPhone(p.phone!)}`; }}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8 min-w-[90px]"
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Call Mechanic
                                </Button>
                              )}

                              {p.phone && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const num = waPhone(p.phone!);
                                    const text = encodeURIComponent("Hi, I found you on RoadBuddy and need roadside assistance. Are you available?");
                                    window.open(`https://wa.me/${num}?text=${text}`, "_blank", "noopener,noreferrer");
                                  }}
                                  className="flex-1 text-white text-xs h-8 min-w-[90px]"
                                  style={{ backgroundColor: "#25D366" }}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  WhatsApp
                                </Button>
                              )}

                              {p.website && (
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => window.open(p.website!, "_blank")}
                                  className="border-border text-foreground hover:bg-secondary text-xs h-8"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {hasMore && (
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show more ({allPlaces.length - visibleCount} remaining)
                    </Button>
                  )}
                </div>
              )}

              {/* ── MAP ── */}
              <div style={{ height: view === "map" ? 440 : 0, overflow: "hidden", transition: "height .35s ease" }}>
                <MapErrorBoundary>
                  <LeafletMap places={allPlaces} userLocation={userLocation} />
                </MapErrorBoundary>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyMechanics;
