"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

const POPULAR_ROUTES = [
  { label: "ZAGREB → SPLIT", fromIcao: "LDZA", toIcao: "LDSP" },
  { label: "VENICE → DUBROVNIK", fromIcao: "LIPZ", toIcao: "LDDU" },
  { label: "LJUBLJANA → PULA", fromIcao: "LJLJ", toIcao: "LDPL" },
  { label: "PULA → VENICE", fromIcao: "LDPL", toIcao: "LIPZ" },
  { label: "ORTISEI → MURTER", fromIcao: "LIDT", toIcao: "LDSD" },
] as const;

type AirfieldOption = {
  id: string;
  name: string;
  icao_code: string;
};

function findByIcao(airfields: AirfieldOption[], icao: string) {
  return airfields.find((a) => a.icao_code.toUpperCase() === icao.toUpperCase());
}

function formatDateRange(from?: string, to?: string): string {
  if (!from && !to) return "";
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  };
  if (from && to && from !== to) return `${fmt(from)} — ${fmt(to)}`;
  if (from) return fmt(from);
  return to ? fmt(to) : "";
}

export function FlightsSearchHero({
  airfields,
}: {
  airfields: AirfieldOption[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const popularLinks = useMemo(() => {
    return POPULAR_ROUTES.map((route) => {
      const from = findByIcao(airfields, route.fromIcao);
      const to = findByIcao(airfields, route.toIcao);
      const params = new URLSearchParams();
      if (from) params.set("from", from.id);
      if (to) params.set("to", to.id);
      return { ...route, href: `/flights?${params.toString()}` };
    });
  }, [airfields]);

  const pushSearch = (fd: FormData) => {
    const params = new URLSearchParams(sp.toString());
    const from = fd.get("from");
    const to = fd.get("to");
    const dateFrom = fd.get("dateFrom");
    const dateTo = fd.get("dateTo");

    if (typeof from === "string") {
      if (from) params.set("from", from);
      else params.delete("from");
    }
    if (typeof to === "string") {
      if (to) params.set("to", to);
      else params.delete("to");
    }
    if (typeof dateFrom === "string") {
      if (dateFrom) params.set("dateFrom", dateFrom);
      else params.delete("dateFrom");
    }
    if (typeof dateTo === "string") {
      if (dateTo) params.set("dateTo", dateTo);
      else params.delete("dateTo");
    }

    startTransition(() => {
      router.push(`/flights?${params.toString()}`);
    });
  };

  const dateLabel = formatDateRange(
    sp.get("dateFrom") ?? undefined,
    sp.get("dateTo") ?? undefined,
  );

  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: "var(--line)", background: "var(--bg)" }}
    >
      {/* Map texture + ICAO markers */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-35">
        <div
          className="absolute inset-0 gallebo-map-grid"
          style={{ opacity: 0.35 }}
        />
        {[
          { code: "LDZA", top: "18%", left: "12%" },
          { code: "LJLJ", top: "28%", left: "38%" },
          { code: "LDPL", top: "42%", left: "22%" },
          { code: "LIPZ", top: "34%", right: "28%" },
          { code: "LDDU", top: "58%", right: "14%" },
        ].map((m) => (
          <span
            key={m.code}
            className="absolute text-[10px] font-semibold tracking-[0.14em]"
            style={{
              top: m.top,
              left: m.left,
              right: m.right,
              color: "var(--ink-3)",
              opacity: 0.7,
            }}
          >
            {m.code}
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-12 lg:pt-14">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-3)" }}
        >
          Find a flight
        </p>
        <h1
          className="mb-8 max-w-2xl text-[clamp(2.25rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          Where shall we fly today?
        </h1>

        <form
          className="flex flex-col gap-0 overflow-hidden rounded-xl border shadow-md lg:flex-row"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-md)",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            pushSearch(new FormData(e.currentTarget));
          }}
        >
          <div className="grid flex-1 sm:grid-cols-3">
            <label className="flex flex-col gap-1 border-b px-4 py-3 sm:border-b-0 sm:border-r lg:px-5" style={{ borderColor: "var(--line)" }}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--ink-3)" }}>
                From
              </span>
              <div className="flex items-center gap-2">
                <LocationPin />
                <select
                  name="from"
                  defaultValue={sp.get("from") ?? ""}
                  className="w-full appearance-none bg-transparent text-[15px] font-medium outline-none"
                  style={{ color: "var(--ink)" }}
                >
                  <option value="">Anywhere</option>
                  {airfields.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.icao_code})
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="flex flex-col gap-1 border-b px-4 py-3 sm:border-b-0 sm:border-r lg:px-5" style={{ borderColor: "var(--line)" }}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--ink-3)" }}>
                To
              </span>
              <div className="flex items-center gap-2">
                <LocationPin />
                <select
                  name="to"
                  defaultValue={sp.get("to") ?? ""}
                  className="w-full appearance-none bg-transparent text-[15px] font-medium outline-none"
                  style={{ color: "var(--ink)" }}
                >
                  <option value="">Anywhere</option>
                  {airfields.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.icao_code})
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="flex flex-col gap-1 px-4 py-3 lg:px-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--ink-3)" }}>
                Date
              </span>
              <div className="flex items-center gap-2">
                <CalendarIcon />
                <div className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                  <input
                    type="date"
                    name="dateFrom"
                    defaultValue={sp.get("dateFrom") ?? ""}
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    aria-label="From date"
                  />
                  <span style={{ color: "var(--ink-3)" }}>—</span>
                  <input
                    type="date"
                    name="dateTo"
                    defaultValue={sp.get("dateTo") ?? ""}
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    aria-label="To date"
                  />
                </div>
              </div>
              {dateLabel ? (
                <span className="sr-only">Selected range: {dateLabel}</span>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            className="btn-v2-primary flex items-center justify-center gap-2 px-8 py-4 text-[15px] font-semibold lg:min-w-[148px] lg:py-0"
          >
            <SearchIcon />
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-3)" }}
          >
            Popular:
          </span>
          {popularLinks.map((route) => (
            <Link
              key={route.label}
              href={route.href}
              className="rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors hover:border-[var(--primary-v2)]"
              style={{
                borderColor: "var(--line)",
                background: "var(--surface)",
                color: "var(--ink-2)",
                textDecoration: "none",
              }}
            >
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocationPin() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}
