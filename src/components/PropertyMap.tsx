"use client";

import { useEffect, useRef } from "react";
import type { SampleProperty } from "@/lib/data/sampleData";

interface PropertyMapProps {
  lat: number;
  lng: number;
  title: string;
  zoom?: number;
  height?: string;
  properties?: SampleProperty[];
  showMultiple?: boolean;
}

export default function PropertyMap({
  lat,
  lng,
  title,
  zoom = 14,
  height = "300px",
  properties = [],
  showMultiple = false,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamic import of Leaflet
    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icon issue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Create custom icon
      const customIcon = L.divIcon({
        html: `<div style="background-color: #1a56db; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        className: "custom-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: false,
      }).setView([lat, lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      if (showMultiple && properties.length > 0) {
        // Show multiple markers
        const bounds = L.latLngBounds([]);
        properties.forEach((property) => {
          if (property.lat && property.lng) {
            const marker = L.marker([property.lat, property.lng], { icon: customIcon }).addTo(map);
            marker.bindPopup(`
              <div style="min-width: 150px;">
                <strong style="font-size: 12px;">${property.titleEn}</strong><br/>
                <span style="color: #1a56db; font-weight: bold;">£${property.price.toLocaleString()}</span>
              </div>
            `);
            bounds.extend([property.lat, property.lng]);
          }
        });
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } else {
        // Single marker
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`<strong>${title}</strong>`).openPopup();
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, title, zoom, properties, showMultiple]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden border border-gray-200 z-0"
    />
  );
}
