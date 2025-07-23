import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const LocationMarker = ({ initialPosition, onSelect }) => {
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    if (initialPosition) {
      setPosition([initialPosition.lat, initialPosition.lng]);
    }
  }, [initialPosition]);

  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onSelect({ lat, lng });
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Your item will be available here</Popup>
    </Marker>
  ) : null;
};

const parseInitialLocation = (location) => {
  if (!location) return null;

  if (typeof location === "object" && location.lat && location.lng) {
    return location;
  }

  if (typeof location === "string") {
    const [lat, lng] = location.split(",").map((n) => parseFloat(n.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
};

const MapPicker = ({ initialLocation, onLocationSelect, onClose }) => {
  const parsedLocation = parseInitialLocation(initialLocation);

  return (
    <div className="mb-4 relative h-[400px] rounded-md overflow-hidden">
      <MapContainer
        center={parsedLocation || [27.7172, 85.324]} // Kathmandu fallback
        zoom={parsedLocation ? 15 : 13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker
          initialPosition={parsedLocation}
          onSelect={onLocationSelect}
        />
      </MapContainer>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-gray-100 text-lg font-bold z-[1000]"
        aria-label="Close map"
      >
        ×
      </button>
    </div>
  );
};

export default MapPicker;
