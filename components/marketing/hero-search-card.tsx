"use client";

import { MapPin, Search, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function HeroSearchCard({ className }: { className?: string }) {
  const [location, setLocation] = useState("");
  const [passengers, setPassengers] = useState("1");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Faza 4+: navigate to flight search results
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-6 shadow-card sm:p-8",
        "ring-1 ring-black/5 backdrop-blur-sm",
        className
      )}
    >
      <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Share the cost of a private flight with a local pilot
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Discover sightseeing and cross-country flights across Europe. EASA
        cost-sharing — no profit for pilots.
      </p>

      <form
        onSubmit={handleSearch}
        className="mt-6 flex flex-col gap-3 md:flex-row md:items-stretch"
      >
        <div className="relative flex-1">
          <MapPin
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="City or region"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-11 pl-10"
            aria-label="Location"
          />
        </div>
        <div className="relative w-full md:w-40">
          <Users
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="number"
            min={1}
            max={5}
            placeholder="Passengers"
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
            className="h-11 pl-10"
            aria-label="Number of passengers"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-11 bg-gradient-to-r from-accent to-accent/80 px-6 font-semibold text-accent-foreground hover:opacity-95 md:min-w-[140px]"
        >
          <Search className="size-4" aria-hidden />
          Search
        </Button>
      </form>
    </div>
  );
}
