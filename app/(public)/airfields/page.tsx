import { AirfieldsListingLazy } from "@/components/airfield/public/airfields-listing-lazy";
import { getAllAirfields } from "@/lib/airfields/queries";

export const metadata = {
  title: "Airfields - Gallebo",
  description:
    "Browse all airfields available on Gallebo across Croatia, Italy and Slovenia.",
};

export default async function AirfieldsPage() {
  const airfields = await getAllAirfields();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Airfields
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse general aviation airfields across Croatia, Italy and Slovenia.
          Search by name or ICAO, filter by country, and open any airfield for
          flights and details.
        </p>
      </div>
      <AirfieldsListingLazy airfields={airfields} />
    </div>
  );
}
