"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FlightSearchFilters({
  airfields,
}: {
  airfields: { id: string; name: string; icao_code: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  return (
    <form
      className="space-y-4 rounded-lg border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          if (typeof v === "string" && v.length > 0) params.set(k, v);
        }
        router.push(`/flights?${params.toString()}`);
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Input
          name="location"
          defaultValue={sp.get("location") ?? ""}
          placeholder="City or region"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">From airfield</label>
        <select
          name="from"
          className="w-full rounded-md border px-3 py-2 text-sm"
          defaultValue={sp.get("from") ?? ""}
        >
          <option value="">Any</option>
          {airfields.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.icao_code})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">To airfield</label>
        <select
          name="to"
          className="w-full rounded-md border px-3 py-2 text-sm"
          defaultValue={sp.get("to") ?? ""}
        >
          <option value="">Any</option>
          {airfields.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.icao_code})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">From date</label>
          <Input type="date" name="dateFrom" defaultValue={sp.get("dateFrom") ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To date</label>
          <Input type="date" name="dateTo" defaultValue={sp.get("dateTo") ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Flight type</label>
        <select
          name="type"
          className="w-full rounded-md border px-3 py-2 text-sm"
          defaultValue={sp.get("type") ?? ""}
        >
          <option value="">Any</option>
          <option value="panoramic">Panoramic</option>
          <option value="excursion">Excursion</option>
          <option value="one_way">One-way</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Min seats</label>
          <Input
            type="number"
            name="minSeats"
            min={1}
            max={5}
            defaultValue={sp.get("minSeats") ?? ""}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Max €/seat</label>
          <Input
            type="number"
            name="maxPrice"
            min={1}
            defaultValue={sp.get("maxPrice") ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Sort</label>
        <select
          name="sort"
          className="w-full rounded-md border px-3 py-2 text-sm"
          defaultValue={sp.get("sort") ?? "date"}
        >
          <option value="date">Date</option>
          <option value="price">Price</option>
          <option value="rating">Pilot rating</option>
        </select>
      </div>
      <Button type="submit" className="w-full">
        Search
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => router.push("/flights")}
      >
        Clear
      </Button>
    </form>
  );
}
