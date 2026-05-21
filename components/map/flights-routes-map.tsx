"use client";

import maplibregl from "maplibre-gl";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

import { getPublicEnv, isMapTilerConfigured } from "@/lib/env";
import type { FlightListItem } from "@/lib/flights/types";
import { formatFlightRoute } from "@/lib/flights/utils";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER: [number, number] = [15.9819, 45.815];
const DEFAULT_ZOOM = 5;

export function FlightsRoutesMap({
  flights,
  className,
}: {
  flights: FlightListItem[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const geojson = useMemo(() => {
    const features: GeoJSON.Feature[] = [];
    for (const f of flights) {
      const dep = f.departure_airfield;
      const arr = f.arrival_airfield;
      if (!dep || !arr) continue;
      features.push({
        type: "Feature",
        properties: {
          id: f.id,
          title: formatFlightRoute(f),
          price: Number(f.price_per_passenger_eur).toFixed(0),
          date: f.flight_date,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [dep.longitude, dep.latitude],
            [arr.longitude, arr.latitude],
          ],
        },
      });
    }
    return { type: "FeatureCollection" as const, features };
  }, [flights]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !isMapTilerConfigured()) {
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

    map.on("load", () => {
      map.addSource("flights-routes", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "flights-routes-line",
        type: "line",
        source: "flights-routes",
        paint: {
          "line-color": "#c9a227",
          "line-width": 3,
          "line-opacity": 0.85,
        },
      });

      map.on("click", "flights-routes-line", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const props = feat.properties as {
          id?: string;
          title?: string;
          price?: string;
          date?: string;
        };
        if (!props.id) return;

        const html = `<div class="p-1 text-sm"><strong>${props.title ?? "Flight"}</strong><br/>${props.date ?? ""} · €${props.price ?? ""}/seat<br/><a href="/flights/${props.id}" class="text-primary underline">View</a></div>`;

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseenter", "flights-routes-line", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "flights-routes-line", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [geojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource("flights-routes") as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(geojson);
    }
  }, [geojson]);

  if (!isMapTilerConfigured()) {
    return (
      <p className="text-sm text-muted-foreground">
        Map unavailable — set NEXT_PUBLIC_MAPTILER_API_KEY.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        ref={containerRef}
        className="h-[min(70vh,560px)] w-full overflow-hidden rounded-xl border"
      />
      <p className="text-xs text-muted-foreground">
        {flights.length} route{flights.length === 1 ? "" : "s"} shown.{" "}
        <Link href="/flights" className="text-primary hover:underline">
          List view
        </Link>
      </p>
    </div>
  );
}
