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

/** Estimate travel time in minutes assuming avg 30 km/h city speed */
function estimateTravelMinutes(distanceKm: number): number {
  return Math.round((distanceKm / 30) * 60);
}

async function tryOverpass(latitude: number, longitude: number, radius: number): Promise<any[] | null> {
  // Query nodes, ways AND relations so we don't miss OSM entries that are mapped as areas.
  // `out center` ensures way/relation elements get a representative lat/lon via the `center` field.
  const q = `[out:json][timeout:25];(
    node["amenity"="car_repair"](around:${radius},${latitude},${longitude});
    way["amenity"="car_repair"](around:${radius},${latitude},${longitude});
    relation["amenity"="car_repair"](around:${radius},${latitude},${longitude});
    node["shop"="tyres"](around:${radius},${latitude},${longitude});
    way["shop"="tyres"](around:${radius},${latitude},${longitude});
    node["shop"="car_parts"](around:${radius},${latitude},${longitude});
    way["shop"="car_parts"](around:${radius},${latitude},${longitude});
    node["amenity"="fuel"](around:${radius},${latitude},${longitude});
    node["shop"="automotive"](around:${radius},${latitude},${longitude});
  );out center body;`;

  const encoded = encodeURIComponent(q);

  const servers = [
    `https://overpass-api.de/api/interpreter?data=${encoded}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encoded}`,
    `https://overpass.openstreetmap.ru/api/interpreter?data=${encoded}`,
  ];

  for (const url of servers) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 25000);
      const baseUrl = url.split("?")[0];
      console.log(`[Overpass] Trying: ${baseUrl}`);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);

      if (!res.ok) {
        console.warn(`[Overpass] ${baseUrl} returned ${res.status}`);
        await res.text(); // consume body
        continue;
      }
      const json = await res.json();
      const count = json?.elements?.length ?? 0;
      console.log(`[Overpass] Success from ${baseUrl}, elements: ${count}`);
      return json.elements || [];
    } catch (e) {
      console.warn(`[Overpass] Failed: ${e instanceof Error ? e.message : e}`);
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

    // Increased limit to 50 results; try broad search terms
    const terms = ["car+repair+mechanic", "car+workshop", "tyre+shop+mechanic"];
    const allResults: any[] = [];

    for (const term of terms) {
      const url = `https://nominatim.openstreetmap.org/search?q=${term}&format=json&viewbox=${viewbox}&bounded=1&limit=50&addressdetails=1`;
      console.log(`[Nominatim] Trying term: ${term}`);

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "RoadBuddy/1.0 (roadside-assistance-app)" },
        });
        clearTimeout(id);

        if (res.ok) {
          const results = await res.json();
          console.log(`[Nominatim] Term "${term}" returned ${results?.length ?? 0} results`);
          allResults.push(...(results || []));
        } else {
          clearTimeout(id);
          await res.text();
        }
      } catch (e) {
        clearTimeout(id);
        console.warn(`[Nominatim] Term "${term}" failed: ${e instanceof Error ? e.message : e}`);
      }
    }

    if (allResults.length === 0) return null;

    // Deduplicate by place_id
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (seen.has(String(r.place_id))) return false;
      seen.add(String(r.place_id));
      return true;
    });

    console.log(`[Nominatim] Total unique results: ${unique.length}`);

    return unique.map((r: any) => ({
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
    console.warn(`[Nominatim] Failed: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { latitude, longitude, radius = 15000 } = body;

    console.log(`[Request] lat=${latitude}, lng=${longitude}, radius=${radius}m`);

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce a minimum radius of 10 km and maximum of 30 km for best results
    const effectiveRadius = Math.min(Math.max(Number(radius), 10000), 30000);
    console.log(`[Request] Effective radius: ${effectiveRadius}m`);

    // Try Overpass first (most comprehensive OSM data), then Nominatim as fallback
    let elements = await tryOverpass(latitude, longitude, effectiveRadius);
    let fallbackSource = false;

    if (!elements || elements.length === 0) {
      console.log("[Fallback] Overpass returned no results, trying Nominatim...");
      elements = await tryNominatim(latitude, longitude, effectiveRadius / 1000);
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

    console.log(`[Processing] Raw elements before filtering: ${elements.length}`);

    const places = elements
      .map((el: any) => {
        // Support nodes (lat/lon directly) and ways/relations (lat/lon via center)
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (lat == null || lng == null) return null;

        const tags = el.tags || {};
        const name = tags.name || tags["name:en"] || tags["name:hi"] || null;

        // Skip unnamed entries as they add noise (unless it's a fuel station we want to include)
        if (!name) return null;

        const distance_km = Math.round(haversine(latitude, longitude, lat, lng) * 10) / 10;
        const travel_minutes = estimateTravelMinutes(distance_km);

        let category = "Car Repair";
        if (tags.shop === "tyres") category = "Tyre Shop";
        else if (tags.shop === "car_parts") category = "Car Parts";
        else if (tags.amenity === "fuel") category = "Fuel Station";
        else if (tags.shop === "automotive") category = "Auto Shop";

        return {
          id: String(el.id),
          name,
          category,
          address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]]
            .filter(Boolean)
            .join(", ") || null,
          phone: tags.phone || tags["contact:phone"] || null,
          website: tags.website || tags["contact:website"] || null,
          opening_hours: tags.opening_hours || null,
          distance_km,
          travel_minutes,
          lat,
          lng,
        };
      })
      .filter(Boolean);

    // Sort by distance ascending (closest first)
    places.sort((a: any, b: any) => a.distance_km - b.distance_km);

    // Remove duplicate locations (same name + within 50 m of each other)
    const deduplicated: any[] = [];
    const seenNames = new Set<string>();
    for (const place of places) {
      const key = `${place.name?.toLowerCase().trim()}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        deduplicated.push(place);
      }
    }

    console.log(`[Result] Returning ${deduplicated.length} places (after dedup)`);

    return new Response(
      JSON.stringify({
        places: deduplicated,
        total: deduplicated.length,
        fallback: fallbackSource,
        message: deduplicated.length === 0
          ? "No mechanics found nearby. Try increasing the radius."
          : fallbackSource
            ? "Showing approximate results from backup data source."
            : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[Error] nearby-mechanics:", e);
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
