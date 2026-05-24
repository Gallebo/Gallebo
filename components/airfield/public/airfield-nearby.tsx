interface NearbyPlace {
  name: string;
  type: string;
  distanceKm: number;
  driveMin: number;
  colorClass?: string;
}

interface AirfieldNearbyProps {
  airfieldName: string;
  places?: NearbyPlace[];
}

const DEFAULT_GRADIENT_COLORS = [
  "linear-gradient(135deg, #8B7D6B 0%, #A89880 100%)",
  "linear-gradient(135deg, #6B8B9E 0%, #4A6D7C 100%)",
  "linear-gradient(135deg, #7B9E6B 0%, #5C7A4A 100%)",
  "linear-gradient(135deg, #7B6B8B 0%, #5C4A6D 100%)",
];

export function AirfieldNearby({ airfieldName, places }: AirfieldNearbyProps) {
  const displayName = airfieldName.replace(/\s+airfield$/i, "").trim();

  const defaultPlaces: NearbyPlace[] = [
    { name: "Coastal town", type: "25 min drive", distanceKm: 12, driveMin: 25 },
    { name: "Island archipelago", type: "40 min drive + ferry", distanceKm: 24, driveMin: 40 },
    { name: "Estuary", type: "12 min drive", distanceKm: 6, driveMin: 12 },
    { name: "Historic site", type: "50 min drive", distanceKm: 38, driveMin: 50 },
  ];

  const items = (places ?? defaultPlaces).slice(0, 4);

  return (
    <section className="py-16" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--ink-3)" }}
          >
            Nearby
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--ink)",
              margin: "0 0 6px",
            }}
          >
            Around {displayName}.
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>
            Worth landing for. Distances are by road from the airfield gate.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((place, i) => (
            <div
              key={place.name}
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: DEFAULT_GRADIENT_COLORS[i % DEFAULT_GRADIENT_COLORS.length],
                aspectRatio: "3/4",
                minHeight: 180,
              }}
            >
              {/* Distance badge */}
              <div
                className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
              >
                {place.distanceKm} KM
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p
                  className="text-[12px] font-medium text-white/70"
                  style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  {place.type}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold text-white leading-tight">
                  {place.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
