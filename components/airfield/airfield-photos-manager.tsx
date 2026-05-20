"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import {
  deleteAirfieldPhotoAction,
  updatePhotoOrderAction,
  uploadAirfieldPhotoAction,
} from "@/lib/airfield/actions";
import type { AirfieldPhoto } from "@/lib/airfield/types";
import { getAirfieldPhotoPublicUrl } from "@/lib/airfield/utils";
import { Button } from "@/components/ui/button";

export function AirfieldPhotosManager({
  photos,
}: {
  photos: AirfieldPhoto[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.set("file", file);

    startTransition(async () => {
      const res = await uploadAirfieldPhotoAction(fd);
      if (!res.error) {
        router.refresh();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={pending}
          className="text-sm"
        />
        {pending ? (
          <p className="mt-2 text-sm text-muted-foreground">Uploading…</p>
        ) : null}
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => {
            const url = getAirfieldPhotoPublicUrl(photo.storage_path);
            return (
              <div
                key={photo.id}
                className="space-y-2 rounded-lg border p-3"
              >
                {url ? (
                  <div className="relative aspect-video overflow-hidden rounded-md">
                    <Image
                      src={url}
                      alt="Airfield photo"
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending || index === 0}
                    onClick={() => {
                      startTransition(async () => {
                        await updatePhotoOrderAction(photo.id, "up");
                        router.refresh();
                      });
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending || index === photos.length - 1}
                    onClick={() => {
                      startTransition(async () => {
                        await updatePhotoOrderAction(photo.id, "down");
                        router.refresh();
                      });
                    }}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteAirfieldPhotoAction(photo.id);
                        router.refresh();
                      });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
