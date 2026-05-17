import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationPickerProps {
  address: string;
  onAddressChange: (address: string) => void;
  onLocationDetected: (data: LocationData) => void;
  id?: string;
  required?: boolean;
}

const LocationPicker = ({
  address,
  onAddressChange,
  onLocationDetected,
  id,
  required,
}: LocationPickerProps) => {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { "User-Agent": "RoadBuddy/1.0" } }
        );
        const data = await res.json();
        const addr = data.address || {};
        const parts = [
          addr.road,
          addr.neighbourhood || addr.suburb,
          addr.city || addr.town || addr.village,
          addr.state,
          addr.postcode,
        ].filter(Boolean);
        const fullAddress = parts.join(", ");
        onAddressChange(fullAddress);
        onLocationDetected({ latitude: lat, longitude: lng, address: fullAddress });
      } catch {
        onAddressChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        onLocationDetected({ latitude: lat, longitude: lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }
    },
    [onAddressChange, onLocationDetected]
  );

  const initMap = useCallback(
    (lat: number, lng: number) => {
      if (!mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.setView([lat, lng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        return;
      }

      const map = L.map(mapRef.current).setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      marker.bindPopup("Partner Garage Location").openPopup();

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      mapInstance.current = map;
      markerRef.current = marker;

      setTimeout(() => map.invalidateSize(), 100);
    },
    [reverseGeocode]
  );

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const detectLocation = async () => {
    setDetecting(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setDetecting(false);
      return;
    }

    const timeout = setTimeout(() => {
      setError("Location detection timed out. Please enter address manually.");
      setDetecting(false);
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeout);
        const { latitude: lat, longitude: lng } = position.coords;
        setCoords({ lat, lng });
        await reverseGeocode(lat, lng);
        initMap(lat, lng);
        setDetecting(false);
      },
      (err) => {
        clearTimeout(timeout);
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Enable location to auto detect garage location.");
        } else {
          setError("Could not detect location. Please enter address manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <Input
        id={id}
        required={required}
        placeholder="Full address of your garage"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="button"
        variant="outline"
        onClick={detectLocation}
        disabled={detecting}
        className="w-full border-primary/30 text-primary hover:bg-primary/10"
      >
        {detecting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4 mr-2" />
        )}
        {detecting ? "Detecting Location..." : "Detect Shop Location"}
      </Button>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      {coords && (
        <div
          ref={mapRef}
          className="w-full h-48 rounded-lg border border-border overflow-hidden"
          style={{ zIndex: 0 }}
        />
      )}

      {coords && (
        <p className="text-xs text-muted-foreground">
          📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} — Drag marker to adjust
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
