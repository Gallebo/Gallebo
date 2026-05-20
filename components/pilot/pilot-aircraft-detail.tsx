"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteAircraftAction,
  deleteAircraftPhotoAction,
  updateAircraftAction,
  uploadAircraftPhotoFormAction,
} from "@/lib/aircraft/actions";
import { publicStorageUrl } from "@/lib/storage/public-url";
import type { Tables } from "@/types/database";

const BUCKET = "aircraft-photos";

type AircraftPhoto = Pick<Tables<"aircraft_photos">, "id" | "storage_path" | "position">;

export type AircraftDetail = Tables<"aircraft"> & {
  aircraft_photos: AircraftPhoto[] | null;
};

export function PilotAircraftDetail({ aircraft }: { aircraft: AircraftDetail }) {
  const router = useRouter();
  const [updateState, updateFormAction] = useActionState(updateAircraftAction, {});
  const [uploadState, uploadFormAction] = useActionState(uploadAircraftPhotoFormAction, {});

  const [photoPending, startPhoto] = useTransition();
  const [craftPending, startCraft] = useTransition();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const photos = [...(aircraft.aircraft_photos ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  useEffect(() => {
    if (updateState.success || uploadState.success) {
      router.refresh();
    }
  }, [updateState.success, uploadState.success, router]);

  return (
    <div className="max-w-3xl space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <form action={updateFormAction} className="space-y-4">
          <input type="hidden" name="aircraftId" value={aircraft.id} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="model">
              Model
            </label>
            <Input
              id="model"
              name="model"
              defaultValue={aircraft.model}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="registration">
              Registration
            </label>
            <Input
              id="registration"
              name="registration"
              defaultValue={aircraft.registration}
              className="font-mono uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="seats">
              Seats
            </label>
            <Input
              id="seats"
              name="seats"
              type="number"
              min={2}
              max={6}
              defaultValue={aircraft.seats}
              required
            />
          </div>
          {updateState.error ? (
            <p className="text-sm text-destructive">{updateState.error}</p>
          ) : null}
          {updateState.success ? (
            <p className="text-sm text-green-600">{updateState.success}</p>
          ) : null}
          <Button type="submit">Save</Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Photos</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="space-y-2 overflow-hidden rounded-md border">
              <div className="relative aspect-[4/3]">
                <Image
                  src={publicStorageUrl(BUCKET, p.storage_path)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="200px"
                  unoptimized
                />
              </div>
              <div className="p-2 pt-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive"
                  disabled={photoPending}
                  onClick={() => {
                    setMutationError(null);
                    startPhoto(async () => {
                      const result = await deleteAircraftPhotoAction(p.id);
                      if (result.error) {
                        setMutationError(result.error);
                      }
                      router.refresh();
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        <form action={uploadFormAction} className="max-w-md space-y-3">
          <input type="hidden" name="aircraftId" value={aircraft.id} />
          <input type="file" name="file" accept="image/jpeg,image/png" required />
          {uploadState.error ? (
            <p className="text-sm text-destructive">{uploadState.error}</p>
          ) : null}
          {uploadState.success ? (
            <p className="text-sm text-green-600">{uploadState.success}</p>
          ) : null}
          <SubmitButton label="Add photo" />
        </form>
      </section>

      <section className="border-t pt-8">
        <h2 className="text-lg font-semibold text-destructive">Delete aircraft</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Removes photos and aircraft record. Allowed when no active bookings (Phase&nbsp;4).
        </p>
        <Button
          type="button"
          variant="destructive"
          disabled={craftPending}
          onClick={() => {
            setMutationError(null);
            startCraft(async () => {
              const result = await deleteAircraftAction(aircraft.id);
              if (result.error) {
                setMutationError(result.error);
                return;
              }
              router.replace("/pilot/aircraft");
            });
          }}
        >
          Delete this aircraft
        </Button>
      </section>

      {mutationError ? (
        <p className="text-sm text-destructive">{mutationError}</p>
      ) : null}
    </div>
  );
}
