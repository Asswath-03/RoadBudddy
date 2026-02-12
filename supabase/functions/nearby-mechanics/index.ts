import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(lat: number, lng: number, radius: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radius}`;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 8000 } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = getCacheKey(latitude, longitude, radius);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Overpass QL query for car repair, tyre shops, and car parts
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node["amenity"="car_repair"](around:${radius},${latitude},${longitude});
        node["shop"="tyres"](around:${radius},${latitude},${longitude});
        node["shop"="car_parts"](around:${radius},${latitude},${longitude});
        way["amenity"="car_repair"](around:${radius},${latitude},${longitude});
        way["shop"="tyres"](around:${radius},${latitude},${longitude});
        way["shop"="car_parts"](around:${radius},${latitude},${longitude});
      );
      out center body;
    `;

    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const res = await fetch(overpassUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!res.ok) {
      throw new Error(`Overpass API returned ${res.status}`);
    }

    const data = await res.json();

    const places = (data.elements || []).map((el: any) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) return null;

      const tags = el.tags || {};
      const name = tags.name || tags["name:en"] || "Unnamed Shop";
      const distance_km = Math.round(haversine(latitude, longitude, lat, lng) * 10) / 10;

      let category = "Car Repair";
      if (tags.shop === "tyres") category = "Tyre Shop";
      else if (tags.shop === "car_parts") category = "Car Parts";

      return {
        id: String(el.id),
        name,
        category,
        address: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || null,
        phone: tags.phone || tags["contact:phone"] || null,
        website: tags.website || tags["contact:website"] || null,
        opening_hours: tags.opening_hours || null,
        distance_km,
        lat,
        lng,
      };
    }).filter(Boolean);

    places.sort((a: any, b: any) => a.distance_km - b.distance_km);

    const result = {
      places,
      fallback: places.length === 0,
      message: places.length === 0
        ? "No mechanics found nearby on OpenStreetMap. Try increasing the radius."
        : null,
    };

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
