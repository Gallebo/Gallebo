import type { FlightListItem } from "@/lib/flights/types";

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in nautical miles. */
export function distanceNm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * Math.asin(Math.sqrt(x)) * 3440.065);
}

export function estimateDurationMinutes(nm: number): number {
  return Math.max(15, Math.round((nm / 95) * 60));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function airfieldCityName(name: string): string {
  return name.split(" - ")[0]?.split("(")[0]?.trim() ?? name;
}

export function flightRouteMeta(flight: FlightListItem): {
  title: string;
  codes: string;
  distanceNm: number | null;
  durationLabel: string | null;
} {
  const dep = flight.departure_airfield;
  const arr = flight.arrival_airfield;

  if (!dep || !arr) {
    return {
      title: "Route TBD",
      codes: "—",
      distanceNm: null,
      durationLabel: null,
    };
  }

  const depCity = airfieldCityName(dep.name);
  const arrCity = airfieldCityName(arr.name);

  let title: string;
  let codes: string;

  if (flight.flight_type === "panoramic") {
    title = `${depCity} — scenic loop`;
    codes = dep.icao_code;
  } else {
    title = `${depCity} → ${arrCity}`;
    codes = `${dep.icao_code} · ${arr.icao_code}`;
  }

  let nm: number | null = null;
  if (
    dep.latitude != null &&
    dep.longitude != null &&
    arr.latitude != null &&
    arr.longitude != null
  ) {
    nm =
      flight.flight_type === "panoramic"
        ? Math.max(20, Math.round(distanceNm(dep, arr) * 0.35))
        : distanceNm(dep, arr);
  }

  const durationLabel = nm !== null ? formatDuration(estimateDurationMinutes(nm)) : null;

  return { title, codes, distanceNm: nm, durationLabel };
}

export function flightTypeBadge(
  type: FlightListItem["flight_type"],
): { label: string; variant: "scenic" | "transfer" } {
  if (type === "one_way") {
    return { label: "Transfer", variant: "transfer" };
  }
  if (type === "excursion") {
    return { label: "Excursion", variant: "scenic" };
  }
  return { label: "Scenic", variant: "scenic" };
}
