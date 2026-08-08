"use client";

import dynamic from "next/dynamic";
import type { SampleProperty } from "@/lib/data/sampleData";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 rounded-xl animate-pulse" />,
});

interface PropertiesMapViewProps {
  properties: SampleProperty[];
}

export default function PropertiesMapView({ properties }: PropertiesMapViewProps) {
  // Calculate center from all properties
  const validProperties = properties.filter((p) => p.lat && p.lng);
  if (validProperties.length === 0) {
    return (
      <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">No properties with location data</p>
      </div>
    );
  }

  const centerLat = validProperties.reduce((sum, p) => sum + p.lat, 0) / validProperties.length;
  const centerLng = validProperties.reduce((sum, p) => sum + p.lng, 0) / validProperties.length;

  return (
    <PropertyMap
      lat={centerLat}
      lng={centerLng}
      title="Properties"
      zoom={10}
      height="500px"
      properties={validProperties}
      showMultiple
    />
  );
}
