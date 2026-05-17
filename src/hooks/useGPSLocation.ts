import { useState, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const MAX_ACCURACY_METERS = 100;
const MAX_RETRIES = 2;
const GPS_TIMEOUT_MS = 15000;

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
export type LocSource = "gps" | "manual" | null;

export type GPSPhase =
  | "idle"
  | "getting"       // "Getting precise GPS location…"
  | "improving"     // "Improving GPS accuracy…" (retry)
  | "geocoding"     // reverse geocoding
  | "done"
  | "error";

export interface GPSError {
  code: number;   // 1=PERMISSION_DENIED 2=UNAVAILABLE 3=TIMEOUT 0=UNSUPPORTED
  message: string;
}

/** Structured address components for detailed display */
export interface AddressParts {
  street: string | null;       // road / route name
  houseNumber: string | null;
  subLocality: string | null;  // neighbourhood / suburb / quarter
  locality: string | null;     // city / town / village
  district: string | null;     // county / district
  state: string | null;
  postcode: string | null;
  landmark: string | null;     // nearby amenity / building name
}

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy: number;
  address?: string;              // formatted full street-level address
  addressParts?: AddressParts;   // structured components
}

/* ─────────────────────────────────────────────────────────────────────────────
   Debug logger
───────────────────────────────────────────────────────────────────────────── */
function gpsLog(tag: string, msg: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  if (data) {
    console.groupCollapsed(`[RoadBuddy GPS ${tag}] ${ts}`);
    console.log(msg);
    console.table(data);
    console.groupEnd();
  } else {
    console.log(`[RoadBuddy GPS ${tag}] ${ts} — ${msg}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   GPS attempt
───────────────────────────────────────────────────────────────────────────── */
function attemptGPS(attempt: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 0, message: "Geolocation is not supported by this browser." } as GPSError);
      return;
    }

    gpsLog("→", `Attempt #${attempt} starting`, {
      enableHighAccuracy: true,
      timeout: GPS_TIMEOUT_MS,
      maximumAge: 0,
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords;
        gpsLog("✅", `Attempt #${attempt} success`, {
          latitude,
          longitude,
          "accuracy (m)": accuracy,
          altitude: altitude ?? "n/a",
          speed: speed ?? "n/a",
          heading: heading ?? "n/a",
          provider: accuracy <= 20 ? "GPS chip" : accuracy <= 100 ? "WiFi/Cell-assisted" : "Cell tower / IP",
          accepted: accuracy <= MAX_ACCURACY_METERS,
        });
        resolve(pos);
      },
      (err) => {
        gpsLog("❌", `Attempt #${attempt} failed — code:${err.code}`, {
          code: err.code,
          message: err.message,
          "1=PERMISSION_DENIED": err.code === 1,
          "2=UNAVAILABLE": err.code === 2,
          "3=TIMEOUT": err.code === 3,
        });
        reject({ code: err.code, message: err.message } as GPSError);
      },
      {
        enableHighAccuracy: true,
        timeout: GPS_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reverse geocode — street-level detail via Nominatim (zoom=18)
   
   Strategy:
   1. Request zoom=18 for maximum street-level precision
   2. Extract all granular address fields from the `address` object
   3. Build a human-friendly street-level string prioritising:
      route → sublocality/neighbourhood → locality
   4. Cache-bust with timestamp to prevent stale results
───────────────────────────────────────────────────────────────────────────── */
export interface ReverseGeocodeResult {
  formatted: string;
  parts: AddressParts;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const noCacheSuffix = `&_t=${Date.now()}`;

  try {
    gpsLog("🗺", "Reverse geocoding (street-level)…", { lat, lng });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18&namedetails=1${noCacheSuffix}`,
      {
        headers: { "User-Agent": "RoadBuddy/1.0 (roadside-assistance-app)" },
        cache: "no-store",
      }
    );
    const data = await res.json();
    const addr = data.address || {};

    gpsLog("🗺", "Raw Nominatim address fields", addr);

    // ── Extract structured parts ────────────────────────────────────
    const parts: AddressParts = {
      street: addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || addr.trunk || addr.highway || null,
      houseNumber: addr.house_number || null,
      subLocality:
        addr.neighbourhood || addr.suburb || addr.quarter ||
        addr.residential || addr.hamlet || addr.isolated_dwelling || null,
      locality:
        addr.city || addr.town || addr.village ||
        addr.municipality || addr.city_district || null,
      district: addr.county || addr.state_district || null,
      state: addr.state || null,
      postcode: addr.postcode || null,
      landmark:
        addr.amenity || addr.building || addr.shop ||
        addr.tourism || addr.leisure || addr.office || null,
    };

    // ── Build formatted street-level address ────────────────────────
    //    Priority: street + house number, sublocality, locality, postcode
    const streetPart = parts.houseNumber && parts.street
      ? `${parts.houseNumber}, ${parts.street}`
      : parts.street;

    const segments = [
      streetPart,
      // If no street, use landmark as fallback
      !streetPart && parts.landmark ? `Near ${parts.landmark}` : null,
      parts.subLocality,
      parts.locality,
      parts.district && parts.district !== parts.locality ? parts.district : null,
      parts.postcode,
    ].filter(Boolean);

    let formatted: string;
    if (segments.length >= 2) {
      formatted = segments.join(", ");
    } else if (segments.length === 1) {
      // Very sparse — append state for context
      formatted = parts.state ? `${segments[0]}, ${parts.state}` : segments[0]!;
    } else {
      // Absolutely nothing — fall back to Nominatim display_name
      formatted = data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    gpsLog("🗺", `Geocoded: "${formatted}"`, {
      street: parts.street,
      subLocality: parts.subLocality,
      locality: parts.locality,
      landmark: parts.landmark,
      postcode: parts.postcode,
      fallbackUsed: segments.length === 0,
    });

    return { formatted, parts };
  } catch (e) {
    gpsLog("🗺", "Reverse geocode failed, using raw coords");
    return {
      formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      parts: {
        street: null,
        houseNumber: null,
        subLocality: null,
        locality: null,
        district: null,
        state: null,
        postcode: null,
        landmark: null,
      },
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Forward geocode — search address text → coords  (for "Refine Location")
───────────────────────────────────────────────────────────────────────────── */
export async function forwardGeocode(
  query: string
): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&_t=${Date.now()}`,
      {
        headers: { "User-Agent": "RoadBuddy/1.0 (roadside-assistance-app)" },
        cache: "no-store",
      }
    );
    const results = await res.json();
    if (!results.length) return null;
    const r = results[0];
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), display: r.display_name };
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hook
───────────────────────────────────────────────────────────────────────────── */
export function useGPSLocation() {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [locSource, setLocSource] = useState<LocSource>(null);
  const [phase, setPhase] = useState<GPSPhase>("idle");
  const [gpsError, setGpsError] = useState<GPSError | null>(null);
  const [needsManualEntry, setNeedsManualEntry] = useState(false);
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  // Controls "Refine Location" modal
  const [showRefineModal, setShowRefineModal] = useState(false);

  /* ── Save a confirmed location ───────────────────────────────────── */
  const applyLocation = useCallback(
    async (lat: number, lng: number, accuracy: number, source: LocSource) => {
      setPhase("geocoding");
      const { formatted, parts } = await reverseGeocode(lat, lng);
      setLocation({ lat, lng, accuracy, address: formatted, addressParts: parts });
      setLocSource(source);
      setGpsError(null);
      setNeedsManualEntry(false);
      setShowRefineModal(false);
      setLiveAccuracy(null);
      setPhase("done");
    },
    []
  );

  /* ── Main detection with retry loop ─────────────────────────────── */
  const detectLocation = useCallback(async () => {
    setPhase("getting");
    setGpsError(null);
    setNeedsManualEntry(false);
    setLiveAccuracy(null);

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      if (attempt > 1) setPhase("improving");

      try {
        const pos = await attemptGPS(attempt);
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setLiveAccuracy(accuracy);

        if (accuracy <= MAX_ACCURACY_METERS) {
          await applyLocation(lat, lng, accuracy, "gps");
          return;
        }

        if (attempt <= MAX_RETRIES) {
          gpsLog(
            "⚠️",
            `Accuracy ${accuracy.toFixed(0)}m exceeds ${MAX_ACCURACY_METERS}m threshold → retrying (${attempt}/${MAX_RETRIES})`
          );
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        gpsLog(
          "⚠️",
          `All ${MAX_RETRIES} retries done. Best accuracy: ${accuracy.toFixed(0)}m — accepting anyway.`
        );
        await applyLocation(lat, lng, accuracy, "gps");
        return;

      } catch (err: any) {
        const code: number = err?.code ?? -1;

        if (code === 1) {
          setGpsError({
            code: 1,
            message: "Location permission was denied. Please allow location access in your browser settings, or enter your coordinates manually.",
          });
          setNeedsManualEntry(true);
          setPhase("error");
          setLiveAccuracy(null);
          return;
        }

        if (attempt > MAX_RETRIES) {
          const messages: Record<number, string> = {
            2: "GPS or network location is unavailable on this device. Please enter your location manually.",
            3: `GPS timed out after ${GPS_TIMEOUT_MS / 1000}s. Move outdoors for better signal, then try again.`,
            0: "Geolocation is not supported by your browser.",
          };
          setGpsError({
            code,
            message: messages[code] ?? "Unable to detect your location. Please enter it manually.",
          });
          setNeedsManualEntry(true);
          setPhase("error");
          setLiveAccuracy(null);
          return;
        }

        gpsLog("⚠️", `Attempt #${attempt} transient error (code ${code}), retrying…`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }, [applyLocation]);

  /* ── Manual location entry ───────────────────────────────────────── */
  const applyManualLocation = useCallback(
    async (lat: number, lng: number) => {
      setPhase("geocoding");
      setNeedsManualEntry(false);
      await applyLocation(lat, lng, 0, "manual");
    },
    [applyLocation]
  );

  /* ── Refine location (from draggable pin or address search) ─────── */
  const applyRefinedLocation = useCallback(
    async (lat: number, lng: number) => {
      setPhase("geocoding");
      const { formatted, parts } = await reverseGeocode(lat, lng);
      setLocation((prev) => ({
        lat,
        lng,
        accuracy: prev?.accuracy ?? 0,
        address: formatted,
        addressParts: parts,
      }));
      setShowRefineModal(false);
      setPhase("done");
    },
    []
  );

  /* ── Computed loading label ──────────────────────────────────────── */
  const loadingLabel: string | null =
    phase === "getting"
      ? "Getting precise GPS location…"
      : phase === "improving"
        ? liveAccuracy !== null
          ? `Improving GPS accuracy… (currently ±${Math.round(liveAccuracy)}m)`
          : "Improving GPS accuracy…"
        : phase === "geocoding"
          ? "Detecting your street address…"
          : null;

  const locating = phase === "getting" || phase === "improving" || phase === "geocoding";

  return {
    location,
    locSource,
    locating,
    loadingLabel,
    phase,
    liveAccuracy,
    gpsError,
    needsManualEntry,
    setNeedsManualEntry,
    showRefineModal,
    setShowRefineModal,
    detectLocation,
    applyManualLocation,
    applyRefinedLocation,
  };
}
