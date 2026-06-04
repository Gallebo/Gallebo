"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export type AirfieldOption = {
  id: string;
  label: string;
  icao_code: string;
};

export function AirfieldCombobox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AirfieldOption | null;
  onChange: (opt: AirfieldOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<AirfieldOption[]>([]);
  const inputValue = value?.label ?? query;
  const searchQuery = value ? "" : query.trim();

  useEffect(() => {
    if (searchQuery.length < 2) {
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("airfields")
        .select("id, name, icao_code")
        .eq("status", "active")
        .or(`name.ilike.%${searchQuery}%,icao_code.ilike.%${searchQuery}%`)
        .limit(12);

      if (cancelled) return;

      setOptions(
        (data ?? []).map((a) => ({
          id: a.id,
          icao_code: a.icao_code,
          label: `${a.name} (${a.icao_code})`,
        })),
      );
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={inputValue}
        onChange={(e) => {
          const next = e.target.value;
          if (value) onChange(null);
          setQuery(next);
          if (next.trim().length < 2) setOptions([]);
        }}
        placeholder="Search by name or ICAO"
        autoComplete="off"
      />
      {options.length > 0 ? (
        <ul className="max-h-40 overflow-auto rounded-md border bg-card text-sm">
          {options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  onChange(opt);
                  setQuery("");
                  setOptions([]);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
