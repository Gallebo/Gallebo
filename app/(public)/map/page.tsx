import { AirfieldsMapLazy } from "@/components/map/airfields-map-lazy";
import { getAllAirfields } from "@/lib/airfields/queries";

export const metadata = {
  title: "Airfields map — Gallebo",
  description: "Explore registered airfields across Europe on the Gallebo map.",
};

export default async function MapPage() {
  const airfields = await getAllAirfields();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight">
          Airfields map
        </h1>
        <p className="text-muted-foreground">
          Discover registered airfields, filter by services, and explore
          destinations across Europe.
        </p>
      </div>
      <AirfieldsMapLazy airfields={airfields} />
    </div>
  );
}
