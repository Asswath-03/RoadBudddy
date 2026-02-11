import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache (5 min TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(lat: number, lng: number, radius: number, openNow: boolean): string {
  // Round to ~100m precision for cache hits
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radius},${openNow}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 8000, openNow = false } = await req.json();
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache
    const cacheKey = getCacheKey(latitude, longitude, radius, openNow);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build proper Google Places Nearby Search URLs with keyword param
    const baseParams = `location=${latitude},${longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}${openNow ? "&opennow" : ""}`;
    const typeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${baseParams}&type=car_repair&keyword=mechanic|car+repair|tyre+puncture|towing`;
    const keywordUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${baseParams}&keyword=roadside+assistance|towing+service|battery+jumpstart`;

    const [typeRes, keywordRes] = await Promise.all([
      fetch(typeUrl),
      fetch(keywordUrl),
    ]);

    const [typeData, keywordData] = await Promise.all([
      typeRes.json(),
      keywordRes.json(),
    ]);

    // Log API status for debugging
    if (typeData.status !== "OK" && typeData.status !== "ZERO_RESULTS") {
      console.error("Google Places type search error:", typeData.status, typeData.error_message);
    }
    if (keywordData.status !== "OK" && keywordData.status !== "ZERO_RESULTS") {
      console.error("Google Places keyword search error:", keywordData.status, keywordData.error_message);
    }

    // Merge and deduplicate by place_id
    const allResults = [...(typeData.results || []), ...(keywordData.results || [])];
    const seen = new Set<string>();
    const unique = allResults.filter((r: any) => {
      if (seen.has(r.place_id)) return false;
      seen.add(r.place_id);
      return true;
    });

    // Calculate distance using Haversine formula and format
    const places = unique.map((place: any) => {
      const lat2 = place.geometry.location.lat;
      const lng2 = place.geometry.location.lng;
      const R = 6371;
      const dLat = ((lat2 - latitude) * Math.PI) / 180;
      const dLng = ((lng2 - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return {
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || "",
        rating: place.rating || null,
        user_ratings_total: place.user_ratings_total || 0,
        is_open: place.opening_hours?.open_now ?? null,
        distance_km: Math.round(distance * 10) / 10,
        lat: lat2,
        lng: lng2,
        types: place.types || [],
        photo_ref: place.photos?.[0]?.photo_reference || null,
      };
    });

    // Sort by distance
    places.sort((a: any, b: any) => a.distance_km - b.distance_km);

    const result = {
      places,
      fallback: places.length === 0,
      message: places.length === 0
        ? "No registered partners nearby. Showing Google-listed shops."
        : null,
    };

    // Store in cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nearby-mechanics error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
