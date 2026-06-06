"use client";

import maplibregl from "maplibre-gl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import "maplibre-gl/dist/maplibre-gl.css";

import { Input } from "@/components/ui/input";
import { getPublicEnv, isMapTilerConfigured } from "@/lib/env";
import type { AirfieldSummary } from "@/lib/airfields/queries";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER: [number, number] = [15.9819, 45.815];
const DEFAULT_ZOOM = 6;

const COUNTRY_OPTIONS = [
  { code: "all", label: "All countries" },
  { code: "HR", label: "Croatia" },
  { code: "IT", label: "Italy" },
  { code: "SI", label: "Slovenia" },
] as const;

const COUNTRY_LABELS: Record<string, string> = {
  HR: "Croatia",
  IT: "Italy",
  SI: "Slovenia",
};

type CountryFilter = (typeof COUNTRY_OPTIONS)[number]["code"];

function matchesSearch(airfield: AirfieldSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    airfield.name.toLowerCase().includes(q) ||
    airfield.icao_code.toLowerCase().includes(q) ||
    (airfield.city?.toLowerCase().includes(q) ?? false)
  );
}

export function AirfieldsListing({
  airfields,
  className,
}: {
  airfields: AirfieldSummary[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<CountryFilter>("all");

  const filteredAirfields = useMemo(() => {
    return airfields.filter((af) => {
      if (country !== "all" && af.country !== country) return false;
      return matchesSearch(af, query);
    });
  }, [airfields, country, query]);

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

      const cityLine = af.city ? `<div style="font-size:12px;color:#666;margin:2px 0">${af.city}</div>` : "";
      const popupHtml = `
        <div style="min-width:180px;padding:4px 0">
          <strong>${af.name}</strong>
          <div style="font-size:12px;color:#666;margin:4px 0">${af.icao_code}</div>
          ${cityLine}
          <a href="/airfields/${af.icao_code.toLowerCase()}" style="display:inline-block;margin-top:8px;font-size:12px;color:#2563eb">View profile →</a>
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

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, city or ICAO…"
            className="pl-9"
            aria-label="Search airfields"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setCountry(code)}
              className={cn(
                "rounded-full border px-3.5 py-2.5 text-sm transition-colors",
                country === code
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isMapTilerConfigured() ? (
        <div
          ref={containerRef}
          className="h-[420px] w-full overflow-hidden rounded-lg border border-border shadow-card sm:h-[500px]"
          role="region"
          aria-label="Airfields map"
        />
      ) : (
        <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground sm:h-[500px]">
          MapTiler is not configured. Add{" "}
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5">
            NEXT_PUBLIC_MAPTILER_API_KEY
          </code>{" "}
          to <code className="mx-1 rounded bg-muted px-1.5 py-0.5">.env.local</code>.
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Showing {filteredAirfields.length} of {airfields.length} airfield
        {airfields.length === 1 ? "" : "s"}
      </p>

      {filteredAirfields.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAirfields.map((af) => (
            <li key={af.icao_code}>
              <Link
                href={`/airfields/${af.icao_code.toLowerCase()}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="font-semibold leading-snug tracking-tight group-hover:text-primary">
                    {af.name}
                  </h2>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium">
                    {af.icao_code}
                  </span>
                </div>
                <p className="mt-auto text-sm text-muted-foreground">
                  {[af.city, COUNTRY_LABELS[af.country] ?? af.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No airfields match your search. Try a different name, city or ICAO code.
        </p>
      )}
    </div>
  );
}
