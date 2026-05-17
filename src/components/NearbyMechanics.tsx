import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin, Phone, Navigation, List, Map,
  Loader2, AlertTriangle, Clock, ExternalLink,
  RefreshCw, ChevronDown, MessageCircle, BadgeCheck, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
   Location helpers
───────────────────────────────────────────────────────────────────────────── */
function getGPSLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("UNSUPPORTED")); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        console.log(`[GPS] lat:${coords.latitude} lng:${coords.longitude} ±${coords.accuracy}m`);
        resolve({ lat: coords.latitude, lng: coords.longitude });
      },
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

async function getIPLocation(): Promise<{ lat: number; lng: number }> {
  const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("IP geo failed");
  const d = await res.json();
  if (!d.latitude || !d.longitude) throw new Error("No coords");
  console.log(`[IPGeo] lat:${d.latitude} lng:${d.longitude} (${d.city})`);
  return { lat: d.latitude, lng: d.longitude };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) *
    Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fetch RoadBuddy-verified mechanics from Supabase within radiusKm */
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

  /* update user pin */
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    (async () => {
      const L = (await import("leaflet")).default;
      userPinRef.current?.remove();

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:26px;height:26px;background:#2563eb;border:3px solid #fff;
          border-radius:50%;box-shadow:0 2px 8px rgba(37,99,235,.6);
          display:flex;align-items:center;justify-content:center">
          <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
        </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 999 })
        .bindPopup(`<b>📍 Your Location</b><br/><span style="font-size:11px;color:#6b7280">
          ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}</span>`)
        .addTo(mapRef.current);

      userPinRef.current = marker;
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1 });
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
   Main component
───────────────────────────────────────────────────────────────────────────── */
const NearbyMechanics = () => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locSource, setLocSource] = useState<"gps" | "ip" | null>(null);
  const [radius, setRadius] = useState("10000");
  const [view, setView] = useState<"list" | "map">("list");

  /* ── Location detection ───────────────────────────────────────────── */
  const detectLocation = useCallback(async () => {
    setLocating(true);
    setError(null);
    try {
      const loc = await getGPSLocation();
      setUserLocation(loc);
      setLocSource("gps");
    } catch {
      try {
        const loc = await getIPLocation();
        setUserLocation(loc);
        setLocSource("ip");
        toast.info("Using approximate location (GPS unavailable).");
      } catch {
        const gpsErr = await getGPSLocation().catch((e) => e);
        const m: Record<number, string> = {
          1: "Location permission denied. Please allow access in browser settings.",
          2: "Could not determine your location.",
          3: "Location request timed out. Please try again.",
        };
        setError(m[gpsErr?.code ?? -1] ?? "Unable to detect location.");
      }
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  /* ── Fetch mechanics (Overpass API directly) ──────────────────────── */
  const fetchNearby = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setError(null);
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
      const verifiedSorted = [...verified].sort((a, b) => a.distance_km - b.distance_km);
      const osmSorted = [...uniqueOsm].sort((a, b) => a.distance_km - b.distance_km);
      const combined = [...verifiedSorted, ...osmSorted];

      console.log(`[Fetch] ${verified.length} verified + ${osmSorted.length} OSM = ${combined.length} total`);
      setAllPlaces(combined);

      if (combined.length === 0) {
        toast.info("No mechanics found. Try increasing the search radius.");
      } else {
        const vCount = verified.length;
        toast.success(
          `Found ${combined.length} mechanic${combined.length !== 1 ? "s" : ""} nearby` +
          (vCount > 0 ? ` (${vCount} verified ⭐)` : "") + "."
        );
      }
    } catch (e: any) {
      console.error("[Fetch] error:", e);
      setError(e.message || "Failed to fetch nearby mechanics");
      toast.error("Failed to fetch nearby mechanics.");
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius]);

  useEffect(() => {
    if (userLocation) fetchNearby();
  }, [userLocation, fetchNearby]);

  /* ── Helpers ─────────────────────────────────────────────────────── */
  const openMaps = (p: Place) =>
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
      "_blank", "noopener,noreferrer"
    );

  // Strip everything except digits (and leading +) for tel/wa.me
  const cleanPhone = (raw: string) => raw.replace(/[\s\-().]/g, "");
  const waPhone = (raw: string) => raw.replace(/[^0-9]/g, "");  // wa.me needs digits only

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
                {locSource === "ip" && " · approximate location"}
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

      {/* Locating state */}
      {locating && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Detecting your location…
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <button onClick={detectLocation} className="underline text-xs mt-1">
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

                                {/* Garage name (for verified partners) */}
                                {p.verified && p.name && (
                                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                                    <Wrench className="w-3 h-3 text-slate-400" />
                                    <span className="font-medium">{p.name}</span>
                                  </div>
                                )}

                                {/* Address */}
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

                            {/* Phone number display */}
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
                                  onClick={() => {
                                    // tel: must use location.href — window.open blocks it in browsers
                                    window.location.href = `tel:${cleanPhone(p.phone!)}`;
                                  }}
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
