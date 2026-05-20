import type { Tables } from "@/types/database";

export type AircraftPhotoRow = Pick<
  Tables<"aircraft_photos">,
  "id" | "storage_path" | "position"
>;

export type AircraftWithPhotos = Tables<"aircraft"> & {
  aircraft_photos: AircraftPhotoRow[] | null;
};
