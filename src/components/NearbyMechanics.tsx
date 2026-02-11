import { useState, useEffect, useCallback } from "react";
import { MapPin, Star, Phone, Navigation, List, Map, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Place {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  user_ratings_total: number;
  is_open: boolean | null;
  distance_km: number;
  lat: number;
  lng: number;
  types: string[];
  photo_ref: string | null;
}

const NearbyMechanics = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState("8000");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [minRating, setMinRating] = useState("0");

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
          openNow: openNowOnly,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setPlaces(data.places || []);
      if (data.fallback) {
        setFallbackMessage(data.message || "No registered partners nearby. Showing Google-listed shops.");
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
  }, [userLocation, radius, openNowOnly]);

  useEffect(() => {
    if (userLocation) fetchNearby();
  }, [userLocation, fetchNearby]);

  const filteredPlaces = places.filter((p) => {
    if (minRating !== "0" && (p.rating === null || p.rating < parseFloat(minRating))) return false;
    return true;
  });

  const getDirectionsUrl = (place: Place) =>
    `https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${place.lat},${place.lng}`;

  const getCallUrl = (place: Place) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-emergency flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Nearby Mechanics</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="w-[120px] bg-secondary border-border text-foreground text-sm">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="0">All ratings</SelectItem>
              <SelectItem value="3">3+ ★</SelectItem>
              <SelectItem value="4">4+ ★</SelectItem>
              <SelectItem value="4.5">4.5+ ★</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={openNowOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setOpenNowOnly(!openNowOnly)}
            className={openNowOnly ? "gradient-primary text-primary-foreground" : "border-border text-foreground"}
          >
            Open Now
          </Button>
        </div>
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
                  {filteredPlaces.length === 0 && !loading && (
                    <p className="text-muted-foreground text-sm text-center py-8">No mechanics found with current filters.</p>
                  )}
                  {filteredPlaces.map((place, i) => (
                    <motion.div
                      key={place.place_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">{place.name}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{place.address}</p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {place.rating && (
                                  <span className="flex items-center gap-1 text-xs">
                                    <Star className="w-3 h-3 text-warning fill-warning" />
                                    <span className="text-foreground font-medium">{place.rating}</span>
                                    <span className="text-muted-foreground">({place.user_ratings_total})</span>
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Navigation className="w-3 h-3" />
                                  {place.distance_km} km
                                </span>
                                {place.is_open !== null && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${
                                      place.is_open
                                        ? "border-success text-success"
                                        : "border-destructive text-destructive"
                                    }`}
                                  >
                                    {place.is_open ? "Open" : "Closed"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <a href={getDirectionsUrl(place)} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" className="gradient-primary text-primary-foreground text-xs w-full">
                                  <Navigation className="w-3 h-3 mr-1" />
                                  Directions
                                </Button>
                              </a>
                              <a href={getCallUrl(place)} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="border-border text-foreground text-xs w-full">
                                  <Phone className="w-3 h-3 mr-1" />
                                  Contact
                                </Button>
                              </a>
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
            {userLocation && (
              <div className="rounded-xl overflow-hidden border border-border">
                <iframe
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=car+repair+mechanic+towing&ll=${userLocation.lat},${userLocation.lng}&z=13&output=embed`}
                  title="Nearby Mechanics Map"
                />
                <p className="text-xs text-muted-foreground p-3 text-center">
                  📍 Showing mechanic shops near your location. Use the list view for detailed info.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default NearbyMechanics;
