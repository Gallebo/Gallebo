"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

import { getPublicEnv, isMapTilerConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

export function AirfieldMiniMap({
  latitude,
  longitude,
  name,
  className,
}: {
  latitude: number;
  longitude: number;
  name: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !isMapTilerConfigured()) {
      return;
    }

    const key = getPublicEnv().NEXT_PUBLIC_MAPTILER_API_KEY!;
    const style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [longitude, latitude],
      zoom: 12,
      interactive: false,
    });

    markerRef.current = new maplibregl.Marker({ color: "#c9a227" })
      .setLngLat([longitude, latitude])
      .addTo(map);

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  if (!isMapTilerConfigured()) {
    return (
      <div
        className={cn(
          "flex h-[240px] items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground",
          className
        )}
      >
        Map unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-[240px] w-full overflow-hidden rounded-lg border border-border",
        className
      )}
      role="img"
      aria-label={`Map showing ${name}`}
    />
  );
}
