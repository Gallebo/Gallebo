import { notFound } from "next/navigation";

import {
  PilotAircraftDetail,
  type AircraftDetail,
} from "@/components/pilot/pilot-aircraft-detail";
import type { AircraftWithPhotos } from "@/lib/aircraft/types";
import { requirePilot } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit aircraft — Gallebo" };

export default async function EditAircraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: aircraft } = await supabase
    .from("aircraft")
    .select(
      `
      *,
      aircraft_photos (
        id,
        storage_path,
        position
      )
    `,
    )
    .eq("id", id)
    .eq("pilot_user_id", user.id)
    .single();

  if (!aircraft) {
    notFound();
  }

  const typed = aircraft as unknown as AircraftWithPhotos;
  const photos = [...(typed.aircraft_photos ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const detail: AircraftDetail = {
    ...typed,
    aircraft_photos: photos,
  };

  return <PilotAircraftDetail aircraft={detail} />;
}
