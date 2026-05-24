"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function FlightsResultsToolbar({
  count,
  metaLine,
}: {
  count: number;
  metaLine: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const sort = sp.get("sort") ?? "date";

  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2
          className="text-[1.75rem] font-medium tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          {count} flight{count === 1 ? "" : "s"} available
        </h2>
        <p
          className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--ink-3)" }}
        >
          {metaLine}
        </p>
      </div>

      <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
        <span className="font-medium">Sort:</span>
        <select
          value={sort}
          onChange={(e) => {
            const params = new URLSearchParams(sp.toString());
            params.set("sort", e.target.value);
            startTransition(() => {
              router.push(`/flights?${params.toString()}`, { scroll: false });
            });
          }}
          className="rounded-lg border bg-transparent px-3 py-2 text-[13px] font-medium outline-none"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          <option value="date">Departure date</option>
          <option value="price">Price</option>
          <option value="rating">Pilot rating</option>
        </select>
      </label>
    </div>
  );
}
