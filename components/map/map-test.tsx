"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

import { getPublicEnv, isMapTilerConfigured } from "@/lib/env";

const DEFAULT_CENTER: [number, number] = [15.9819, 45.815]; // Zagreb
const DEFAULT_ZOOM = 8;

export function MapTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    if (!isMapTilerConfigured()) {
      return;
    }

    const key = getPublicEnv().NEXT_PUBLIC_MAPTILER_API_KEY!;
    const style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  if (!isMapTilerConfigured()) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        MapTiler is not configured. Add{" "}
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5">
          NEXT_PUBLIC_MAPTILER_API_KEY
        </code>{" "}
        to <code className="mx-1 rounded bg-muted px-1.5 py-0.5">.env.local</code>.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[400px] w-full overflow-hidden rounded-lg border border-border shadow-card"
      role="region"
      aria-label="MapLibre test map centered on Zagreb"
    />
  );
}
