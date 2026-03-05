const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

async function tryOverpass(latitude: number, longitude: number, radius: number): Promise<any[] | null> {
  const q = `[out:json][timeout:15];(node["amenity"="car_repair"](around:${radius},${latitude},${longitude});node["shop"="tyres"](around:${radius},${latitude},${longitude});node["shop"="car_parts"](around:${radius},${latitude},${longitude}););out body;`;
  const encoded = encodeURIComponent(q);

  const servers = [
    `https://overpass-api.de/api/interpreter?data=${encoded}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encoded}`,
  ];

  for (const url of servers) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000);
      console.log(`Trying: ${url.split("?")[0]}`);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      
      if (!res.ok) {
        console.warn(`${url.split("?")[0]} returned ${res.status}`);
        await res.text(); // consume body
        continue;
      }
      const json = await res.json();
      console.log(`Overpass success, elements: ${json?.elements?.length ?? 0}`);
      return json.elements || [];
    } catch (e) {
      console.warn(`${url.split("?")[0]} failed: ${e instanceof Error ? e.message : e}`);
    }
  }
  return null;
}

async function tryNominatim(latitude: number, longitude: number, radiusKm: number): Promise<any[] | null> {
  try {
    const viewbox = [
      longitude - radiusKm / 111,
      latitude + radiusKm / 111,
      longitude + radiusKm / 111,
      latitude - radiusKm / 111,
    ].join(",");

    const url = `https://nominatim.openstreetmap.org/search?q=car+repair+mechanic&format=json&viewbox=${viewbox}&bounded=1&limit=20&addressdetails=1`;
    console.log("Trying Nominatim fallback");
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "RoadBuddy/1.0" },
    });
    clearTimeout(id);

    if (!res.ok) {
      console.warn(`Nominatim returned ${res.status}`);
      await res.text();
      return null;
    }

    const results = await res.json();
    console.log(`Nominatim success, results: ${results?.length ?? 0}`);
    
    return results.map((r: any) => ({
      type: "node",
      id: r.place_id,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      tags: {
        name: r.display_name?.split(",")[0] || "Mechanic",
        amenity: "car_repair",
        "addr:street": r.address?.road || null,
        "addr:city": r.address?.city || r.address?.town || r.address?.village || null,
      },
    }));
  } catch (e) {
    console.warn(`Nominatim failed: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

Deno.serve(async (req) => {
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

    // Try Overpass first, then Nominatim as fallback
    let elements = await tryOverpass(latitude, longitude, radius);
    let fallbackSource = false;

    if (!elements) {
      elements = await tryNominatim(latitude, longitude, radius / 1000);
      fallbackSource = true;
    }

    if (!elements) {
      return new Response(
        JSON.stringify({
          places: [],
          fallback: true,
          message: "Map servers are temporarily unavailable. Please try again in a moment.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const places = elements
      .map((el: any) => {
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
      })
      .filter(Boolean);

    places.sort((a: any, b: any) => a.distance_km - b.distance_km);

    return new Response(
      JSON.stringify({
        places,
        fallback: places.length === 0 || fallbackSource,
        message: places.length === 0
          ? "No mechanics found nearby. Try increasing the radius."
          : fallbackSource
          ? "Showing approximate results."
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("nearby-mechanics error:", e);
    return new Response(
      JSON.stringify({
        places: [],
        fallback: true,
        error: e instanceof Error ? e.message : "Unknown error",
        message: "Something went wrong. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
