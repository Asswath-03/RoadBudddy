import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Phone, Navigation, List, Map, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Place {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  distance_km: number;
  lat: number;
  lng: number;
  place_id?: string;
}

// Fix default Leaflet marker icon paths (broken by bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const NearbyMechanics = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState("8000");
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location permission denied. Please enable GPS in your browser settings.",
          2: "Unable to determine your location. Please try again.",
          3: "Location request timed out. Please try again.",
        };
        setError(messages[err.code] || "Unable to detect location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [20, 78],
        zoom: 5,
        scrollWheelZoom: true,
      });

      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
        subdomains: ["a", "b", "c"],
      });

      tileLayer.on("tileerror", () => {
        setMapError(true);
      });

      tileLayer.addTo(map);
      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Resize handling for responsive
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapRef.current = null;
      };
    } catch {
      setMapError(true);
    }
  }, []);

  // Center map on user location
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13);

      // Add user location marker
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 10,
        fillColor: "hsl(210, 100%, 50%)",
        color: "white",
        weight: 2,
        fillOpacity: 0.9,
      })
        .bindPopup("<b>Your Location</b>")
        .addTo(mapRef.current);
    }
  }, [userLocation]);

  // Update markers when places change
  useEffect(() => {
    if (!markersRef.current || !mapRef.current) return;
    markersRef.current.clearLayers();

    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng]);
      marker.bindPopup(
        `<b>${place.name}</b><br/>${place.category}<br/>${place.distance_km} km away`
      );
      markersRef.current!.addLayer(marker);
    });

    // Fit bounds if we have places + user location
    if (places.length > 0 && userLocation) {
      const allPoints: L.LatLngExpression[] = [
        [userLocation.lat, userLocation.lng],
        ...places.map((p) => [p.lat, p.lng] as L.LatLngExpression),
      ];
      mapRef.current.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] });
    }
  }, [places, userLocation]);

  const fetchNearby = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setError(null);
    setFallbackMessage(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("nearby-mechanics", {
        body: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: parseInt(radius),
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setPlaces(data.places || []);
      if (data.fallback) {
        setFallbackMessage(data.message || "No mechanics found nearby.");
      }
      if ((data.places || []).length === 0) {
        toast.info("No mechanics found nearby. Try increasing the radius.");
      }
    } catch (e: any) {
      console.error("Fetch nearby error:", e);
      setError(e.message || "Failed to fetch nearby mechanics");
      toast.error("Failed to fetch nearby mechanics");
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius]);

  useEffect(() => {
    if (userLocation) fetchNearby();
  }, [userLocation, fetchNearby]);

  const openInGoogleMaps = (place: Place) => {
    const url = place.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const categoryColor = (cat: string) => {
    if (cat === "Tyre Shop") return "border-warning text-warning";
    if (cat === "Car Parts") return "border-accent text-accent-foreground";
    return "border-primary text-primary";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-emergency flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Nearby Mechanics</h2>
        </div>
        <Select value={radius} onValueChange={setRadius}>
          <SelectTrigger className="w-[130px] bg-secondary border-border text-foreground text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="5000">Within 5 km</SelectItem>
            <SelectItem value="8000">Within 8 km</SelectItem>
            <SelectItem value="10000">Within 10 km</SelectItem>
            <SelectItem value="20000">Within 20 km</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {fallbackMessage && !error && (
        <div className="p-3 rounded-lg bg-muted border border-border text-muted-foreground text-sm text-center">
          {fallbackMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
          <Button size="sm" variant="outline" onClick={detectLocation} className="ml-auto shrink-0 text-xs">
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Finding nearby mechanics...</span>
        </div>
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <List className="w-4 h-4 mr-1" /> List
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Map className="w-4 h-4 mr-1" /> Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-2">
                <AnimatePresence>
                  {places.length === 0 && !loading && (
                    <p className="text-muted-foreground text-sm text-center py-8">No mechanics found with current filters.</p>
                  )}
                  {places.map((place, i) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">{place.name}</h3>
                              {place.address && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{place.address}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColor(place.category)}`}>
                                  {place.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Navigation className="w-3 h-3" />
                                  {place.distance_km} km
                                </span>
                                {place.opening_hours && (
                                  <span className="text-[10px] text-muted-foreground">{place.opening_hours}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <Button size="sm" className="gradient-primary text-primary-foreground text-xs w-full" onClick={() => openInGoogleMaps(place)}>
                                <MapPin className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              {place.phone && (
                                <a href={`tel:${place.phone}`}>
                                  <Button size="sm" variant="outline" className="border-border text-foreground text-xs w-full">
                                    <Phone className="w-3 h-3 mr-1" />
                                    Call
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="map">
            {mapError ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm rounded-xl border border-border bg-card">
                <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                Map failed to load. Check network connection.
              </div>
            ) : (
              <div
                ref={mapContainerRef}
                className="rounded-xl overflow-hidden border border-border"
                style={{ height: 400, width: "100%" }}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default NearbyMechanics;
