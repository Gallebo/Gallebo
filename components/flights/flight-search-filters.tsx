"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const PRICE_MIN = 38;
const PRICE_MAX = 298;
const PRICE_DEFAULT = 150;

type FilterCounts = {
  scenic: number;
  transfer: number;
};

function parseBool(sp: URLSearchParams, key: string, defaultValue: boolean): boolean {
  const v = sp.get(key);
  if (v === null) return defaultValue;
  return v === "1" || v === "true";
}

function SegmentGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p
        className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </p>
      <div
        className="flex flex-wrap gap-1 rounded-lg p-1"
        style={{ background: "var(--surface-alt)", border: "1px solid var(--line)" }}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors"
              style={{
                background: active ? "var(--primary-v2)" : "transparent",
                color: active ? "var(--primary-ink)" : "var(--ink-2)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FlightSearchFilters({
  matchCount,
  counts,
}: {
  matchCount: number;
  counts: FilterCounts;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const maxPrice = Number(sp.get("maxPrice") ?? PRICE_DEFAULT) || PRICE_DEFAULT;
  const minRating = sp.get("minRating") ?? "any";
  const minSeats = sp.get("minSeats") ?? "";
  const scenicOn = parseBool(sp, "scenic", true);
  const transferOn = parseBool(sp, "transfer", true);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      startTransition(() => {
        router.push(`/flights?${params.toString()}`, { scroll: false });
      });
    },
    [router, sp],
  );

  return (
    <aside className="space-y-6 lg:sticky lg:top-[88px] lg:self-start">
      {/* Price */}
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-3)" }}
          >
            Price per seat
          </p>
          <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            up to €{maxPrice}
          </span>
        </div>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={1}
          value={maxPrice}
          onChange={(e) => updateParams({ maxPrice: e.target.value })}
          className="w-full accent-[var(--primary-v2)]"
          aria-label="Maximum price per seat"
        />
        <div
          className="mt-1 flex justify-between text-[10px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--ink-3)" }}
        >
          <span>€{PRICE_MIN}</span>
          <span>€{PRICE_MAX}</span>
        </div>
      </div>

      <SegmentGroup
        label="Minimum rating"
        value={minRating}
        onChange={(v) => updateParams({ minRating: v === "any" ? null : v })}
        options={[
          { value: "any", label: "Any" },
          { value: "4", label: "4+" },
          { value: "4.5", label: "4.5+" },
          { value: "4.8", label: "4.8+" },
        ]}
      />

      {/* Flight type */}
      <div>
        <p
          className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--ink-3)" }}
        >
          Flight type
        </p>
        <div className="space-y-2">
          <FilterCheckbox
            label="Scenic / loop"
            count={counts.scenic}
            checked={scenicOn}
            onChange={(checked) => updateParams({ scenic: checked ? "1" : "0" })}
          />
          <FilterCheckbox
            label="Direct transfer"
            count={counts.transfer}
            checked={transferOn}
            onChange={(checked) => updateParams({ transfer: checked ? "1" : "0" })}
          />
        </div>
      </div>

      <SegmentGroup
        label="Min. seats available"
        value={minSeats || "any"}
        onChange={(v) => updateParams({ minSeats: v === "any" ? null : v })}
        options={[
          { value: "any", label: "Any" },
          { value: "1", label: "1+" },
          { value: "2", label: "2+" },
          { value: "3", label: "3+" },
        ]}
      />

      {/* Matching card */}
      <div
        className="rounded-xl px-5 py-6"
        style={{ background: "var(--inverse)", color: "var(--inverse-ink)" }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ opacity: 0.65 }}
        >
          Matching
        </p>
        <p
          className="mt-1 text-[2rem] font-medium leading-none tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {matchCount} flight{matchCount === 1 ? "" : "s"}
        </p>
        <p className="mt-3 text-[12px]" style={{ opacity: 0.7 }}>
          Filters update results live.
        </p>
      </div>
    </aside>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors"
      style={{
        borderColor: checked ? "var(--primary-v2)" : "var(--line)",
        background: checked ? "var(--primary-soft)" : "var(--surface)",
      }}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded border accent-[var(--primary-v2)]"
        />
        <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
          {label}
        </span>
      </span>
      <span
        className="text-[11px] font-semibold tabular-nums"
        style={{ color: "var(--ink-3)" }}
      >
        {count}
      </span>
    </label>
  );
}
