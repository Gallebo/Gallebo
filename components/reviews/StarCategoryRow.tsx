"use client";

import * as React from "react";

type StarCategoryRowProps = {
  label: string;
  description?: string;
  rating: number | null;
  onChange?: (rating: number) => void;
};

export function StarCategoryRow({
  label,
  description,
  rating,
  onChange,
}: StarCategoryRowProps) {
  const value = rating ?? 0;
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === "function";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex gap-0.5">
        {stars.map((s) => {
          const active = s <= value;

          if (!interactive) {
            return (
              <span key={s} className="text-[18px]" style={{ color: active ? "var(--sun)" : "var(--line)" }}>
                ★
              </span>
            );
          }

          return (
            <button
              key={s}
              type="button"
              aria-label={`${label}: ${s} star`}
              onClick={() => onChange?.(s)}
              className="text-[18px] leading-none"
              style={{
                color: active ? "var(--sun)" : "var(--line)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}

