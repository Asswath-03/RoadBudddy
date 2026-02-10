import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 10000, type = "car_repair", openNow } = await req.json();
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY not configured");

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: "latitude and longitude required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search multiple relevant types
    const searchTypes = [
      "car_repair",
      "car_dealer",
      "gas_station",
    ];

    const keywords = [
      "mechanic",
      "tyre puncture",
      "towing service",
      "roadside assistance",
      "battery jumpstart",
    ];

    // Do two searches: by type and by keyword for broader results
    const typeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=car_repair&key=${GOOGLE_MAPS_API_KEY}${openNow ? "&opennow" : ""}`;
    
    const keywordUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=mechanic+towing+roadside+assistance&key=${GOOGLE_MAPS_API_KEY}${openNow ? "&opennow" : ""}`;

    const [typeRes, keywordRes] = await Promise.all([
      fetch(typeUrl),
      fetch(keywordUrl),
    ]);

    const [typeData, keywordData] = await Promise.all([
      typeRes.json(),
      keywordRes.json(),
    ]);

    // Merge and deduplicate by place_id
    const allResults = [...(typeData.results || []), ...(keywordData.results || [])];
    const seen = new Set<string>();
    const unique = allResults.filter((r: any) => {
      if (seen.has(r.place_id)) return false;
      seen.add(r.place_id);
      return true;
    });

    // Calculate distance and format
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
        address: place.vicinity,
        rating: place.rating || null,
        user_ratings_total: place.user_ratings_total || 0,
        is_open: place.opening_hours?.open_now ?? null,
        distance_km: Math.round(distance * 10) / 10,
        lat: lat2,
        lng: lng2,
        types: place.types,
        photo_ref: place.photos?.[0]?.photo_reference || null,
      };
    });

    // Sort by distance
    places.sort((a: any, b: any) => a.distance_km - b.distance_km);

    return new Response(JSON.stringify({ places }), {
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
