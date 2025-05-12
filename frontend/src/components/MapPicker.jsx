import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix missing marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

function LocationMarker({ initialPosition, onSelect }) {
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    if (initialPosition) {
      setPosition([initialPosition.lat, initialPosition.lng]);
    }
  }, [initialPosition]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const newPosition = [lat, lng];
      setPosition(newPosition);
      onSelect({ lat, lng });
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Your item will be available here</Popup>
    </Marker>
  ) : null;
}

export default function MapPicker({
  initialLocation,
  onLocationSelect,
  onClose,
}) {
  // Safely parse initial location
  const parseInitialLocation = () => {
    if (!initialLocation) return null;

    // If it's already an object {lat, lng}, return it
    if (
      typeof initialLocation === "object" &&
      initialLocation.lat &&
      initialLocation.lng
    ) {
      return initialLocation;
    }

    // If it's a string, try to parse it
    if (typeof initialLocation === "string") {
      const parts = initialLocation.split(",");
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }

    return null;
  };

  const parsedInitialLocation = parseInitialLocation();

  return (
    <div className="mb-4 relative" style={{ height: "400px" }}>
      <MapContainer
        center={parsedInitialLocation || [27.7172, 85.324]} // Kathmandu as default
        zoom={parsedInitialLocation ? 15 : 13}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker
          initialPosition={parsedInitialLocation}
          onSelect={onLocationSelect}
        />
      </MapContainer>

      <div className="absolute top-2 right-2 z-[1000] flex gap-2">
        <button
          onClick={onClose}
          className="bg-white p-2 rounded shadow hover:bg-gray-100"
          title="Close map"
        >
          ×
        </button>
      </div>
    </div>
  );
}
