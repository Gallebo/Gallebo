"use client";

import maplibregl from "maplibre-gl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fuel, Plane, Warehouse, Search } from "lucide-react";

import "maplibre-gl/dist/maplibre-gl.css";

import { getPublicEnv, isMapTilerConfigured } from "@/lib/env";
import type { AirfieldMapMarker } from "@/lib/airfield/types";
import { formatServiceLabels } from "@/lib/airfield/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER: [number, number] = [15.9819, 45.815];
const DEFAULT_ZOOM = 6;

type ServiceFilter = {
  fuel: boolean;
  hangar: boolean;
  rental: boolean;
};

type GeocodingFeature = {
  center: [number, number];
  place_name: string;
};

export function AirfieldsMap({
  airfields,
  className,
}: {
  airfields: AirfieldMapMarker[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceFilter>({
    fuel: false,
    hangar: false,
    rental: false,
  });

  const filteredAirfields = useMemo(() => {
    return airfields.filter((af) => {
      if (filters.fuel && !af.has_fuel) return false;
      if (filters.hangar && !af.has_hangar) return false;
      if (filters.rental && !af.has_rental) return false;
      return true;
    });
  }, [airfields, filters]);

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

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const af of filteredAirfields) {
      if (af.latitude === 0 && af.longitude === 0) continue;

      const services = formatServiceLabels(af);
      const popupHtml = `
        <div style="min-width:180px;padding:4px 0">
          <strong>${af.name}</strong>
          <div style="font-size:12px;color:#666;margin:4px 0">${af.icao_code}</div>
          ${
            services.length
              ? `<div style="font-size:12px">${services.join(" · ")}</div>`
              : "<div style='font-size:12px;color:#999'>No services listed</div>"
          }
          <a href="/airfields/${af.icao_code}" style="display:inline-block;margin-top:8px;font-size:12px;color:#2563eb">View profile →</a>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 16 }).setHTML(popupHtml);
      const marker = new maplibregl.Marker({ color: "#c9a227" })
        .setLngLat([af.longitude, af.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [filteredAirfields]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError(null);

    if (!query.trim()) return;

    const key = getPublicEnv().NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!key) {
      setSearchError("MapTiler is not configured");
      return;
    }

    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query.trim())}.json?key=${key}&limit=1`
      );

      if (!res.ok) {
        setSearchError("Search failed");
        return;
      }

      const data = (await res.json()) as { features?: GeocodingFeature[] };
      const feature = data.features?.[0];

      if (!feature) {
        setSearchError("No results found");
        return;
      }

      mapRef.current?.flyTo({
        center: feature.center,
        zoom: 9,
        essential: true,
      });
    } catch {
      setSearchError("Search failed");
    }
  }

  if (!isMapTilerConfigured()) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        MapTiler is not configured. Add{" "}
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5">
          NEXT_PUBLIC_MAPTILER_API_KEY
        </code>{" "}
        to <code className="mx-1 rounded bg-muted px-1.5 py-0.5">.env.local</code>.
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or region…"
            className="max-w-md"
          />
          <Button type="submit" variant="default">
            <Search className="mr-2 size-4" />
            Search
          </Button>
        </form>
        <div className="flex flex-wrap gap-3 text-sm">
          <FilterToggle
            label="Fuel"
            icon={<Fuel className="size-4" />}
            checked={filters.fuel}
            onChange={(v) => setFilters((f) => ({ ...f, fuel: v }))}
          />
          <FilterToggle
            label="Hangar"
            icon={<Warehouse className="size-4" />}
            checked={filters.hangar}
            onChange={(v) => setFilters((f) => ({ ...f, hangar: v }))}
          />
          <FilterToggle
            label="Rental"
            icon={<Plane className="size-4" />}
            checked={filters.rental}
            onChange={(v) => setFilters((f) => ({ ...f, rental: v }))}
          />
        </div>
      </div>

      {searchError ? (
        <p className="text-sm text-destructive">{searchError}</p>
      ) : null}

      <div
        ref={containerRef}
        className="h-[500px] w-full overflow-hidden rounded-lg border border-border shadow-card"
        role="region"
        aria-label="Airfields map"
      />
      <p className="text-sm text-muted-foreground">
        Showing {filteredAirfields.length} airfield
        {filteredAirfields.length === 1 ? "" : "s"}.{" "}
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}

function FilterToggle({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 has-checked:border-primary has-checked:bg-primary/5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      {icon}
      {label}
    </label>
  );
}
