import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { AircraftWithPhotos } from "@/lib/aircraft/types";
import { requirePilot } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import { publicStorageUrl } from "@/lib/storage/public-url";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Aircraft — Gallebo" };

const BUCKET = "aircraft-photos";

export default async function PilotAircraftListPage() {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: rawRows } = await supabase
    .from("aircraft")
    .select("id, model, registration, seats, aircraft_photos ( id, storage_path, position )")
    .eq("pilot_user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (rawRows ?? []) as AircraftWithPhotos[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Registered aircraft appear on your public profile.
        </p>
        <Link
          href="/pilot/aircraft/new"
          className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
        >
          Add aircraft
        </Link>
      </div>

      {rows.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2">
          {rows.map((a) => {
            const pics = [...(a.aircraft_photos ?? [])].sort(
              (p, q) => (p.position ?? 0) - (q.position ?? 0),
            );
            const primary = pics[0];
            const url = primary
              ? publicStorageUrl(BUCKET, primary.storage_path)
              : null;
            return (
              <li key={a.id} className="overflow-hidden rounded-lg border">
                <Link
                  href={`/pilot/aircraft/${a.id}`}
                  className="relative block aspect-[16/10] bg-muted"
                >
                  {url ? (
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width:640px) 100vw, 50vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </Link>
                <div className="space-y-1 p-4">
                  <p className="font-medium">{a.model}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {a.registration}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.seats} seats</p>
                  <Link
                    href={`/pilot/aircraft/${a.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No aircraft yet.</p>
      )}
    </div>
  );
}
