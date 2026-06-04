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
const ROUTES_LAYER_ID = "flights-routes-line";
const ROUTES_SOURCE_ID = "flights-routes";

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
  const geojsonRef = useRef<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

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

  geojsonRef.current = geojson;

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

    let disposed = false;

    const onClick = (
      e: maplibregl.MapMouseEvent & {
        features?: maplibregl.MapGeoJSONFeature[];
      },
    ) => {
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
    };

    const onMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const setupLayers = () => {
      if (disposed || !mapRef.current) return;

      if (!map.getSource(ROUTES_SOURCE_ID)) {
        map.addSource(ROUTES_SOURCE_ID, {
          type: "geojson",
          data: geojsonRef.current,
        });

        map.addLayer({
          id: ROUTES_LAYER_ID,
          type: "line",
          source: ROUTES_SOURCE_ID,
          paint: {
            "line-color": "#c9a227",
            "line-width": 3,
            "line-opacity": 0.85,
          },
        });

        map.on("click", ROUTES_LAYER_ID, onClick);
        map.on("mouseenter", ROUTES_LAYER_ID, onMouseEnter);
        map.on("mouseleave", ROUTES_LAYER_ID, onMouseLeave);
      }
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("load", setupLayers);
    }

    return () => {
      disposed = true;
      popupRef.current?.remove();
      popupRef.current = null;

      if (map.getLayer(ROUTES_LAYER_ID)) {
        map.off("click", ROUTES_LAYER_ID, onClick);
        map.off("mouseenter", ROUTES_LAYER_ID, onMouseEnter);
        map.off("mouseleave", ROUTES_LAYER_ID, onMouseLeave);
      }

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyData = () => {
      const src = map.getSource(ROUTES_SOURCE_ID) as
        | maplibregl.GeoJSONSource
        | undefined;
      if (src) {
        src.setData(geojson);
      }
    };

    if (map.isStyleLoaded() && map.getSource(ROUTES_SOURCE_ID)) {
      applyData();
      return;
    }

    map.once("load", applyData);
    return () => {
      map.off("load", applyData);
    };
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
