"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { aircraftFormSchema, aircraftPhotoReorderSchema } from "@/lib/aircraft/schemas";
import { requirePilot } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export type AircraftActionState = {
  error?: string;
  success?: string;
  aircraftId?: string;
};

const BUCKET = "aircraft-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);

async function assertOwnAircraft(supabase: Awaited<ReturnType<typeof createClient>>, aircraftId: string) {
  const { user } = await requirePilot();
  const { data, error } = await supabase
    .from("aircraft")
    .select("id")
    .eq("id", aircraftId)
    .eq("pilot_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Aircraft not found");
  }

  return { user };
}

export async function addAircraftAction(
  _prev: AircraftActionState,
  formData: FormData,
): Promise<AircraftActionState> {
  try {
    const { user } = await requirePilot();
    const parsed = aircraftFormSchema.safeParse({
      model: formData.get("model"),
      registration: formData.get("registration"),
      seats: formData.get("seats"),
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const files = formData
      .getAll("photos")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length < 1) {
      return { error: "At least one photo is required" };
    }

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return { error: "Photos must be JPEG or PNG" };
      }
      if (file.size > MAX_PHOTO_BYTES) {
        return { error: "Each photo must be under 5MB" };
      }
    }

    const supabase = await createClient();

    const { data: row, error: insertErr } = await supabase
      .from("aircraft")
      .insert({
        pilot_user_id: user.id,
        model: parsed.data.model,
        registration: parsed.data.registration,
        seats: parsed.data.seats,
      })
      .select("id")
      .single();

    if (insertErr || !row) {
      const msg = insertErr?.message ?? "Failed to create aircraft";
      if (insertErr?.code === "23505") {
        return { error: "That registration is already in use" };
      }
      return { error: msg };
    }

    const aircraftId = row.id;

    try {
      let position = 0;
      for (const file of files) {
        const ext = file.type === "image/png" ? "png" : "jpg";
        const storagePath = `${aircraftId}/${randomUUID()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { error: photoInsertError } = await supabase
          .from("aircraft_photos")
          .insert({
            aircraft_id: aircraftId,
            storage_path: storagePath,
            position,
          });

        if (photoInsertError) {
          throw new Error(photoInsertError.message);
        }

        position += 1;
      }
    } catch (cleanupErr) {
      const { data: photoRows } = await supabase
        .from("aircraft_photos")
        .select("storage_path")
        .eq("aircraft_id", aircraftId);

      const toRemove = photoRows?.map((p) => p.storage_path) ?? [];
      if (toRemove.length > 0) {
        await supabase.storage.from(BUCKET).remove(toRemove);
      }

      await supabase.from("aircraft").delete().eq("id", aircraftId);

      return {
        error:
          cleanupErr instanceof Error
            ? cleanupErr.message
            : "Upload failed — aircraft not saved",
      };
    }

    revalidatePath("/pilot/aircraft");
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Aircraft added", aircraftId };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to add aircraft",
    };
  }
}

export async function updateAircraftAction(
  _prev: AircraftActionState,
  formData: FormData,
): Promise<AircraftActionState> {
  try {
    const supabase = await createClient();
    const aircraftId = String(formData.get("aircraftId") ?? "");
    if (!aircraftId) {
      return { error: "Missing aircraft id" };
    }

    const { user } = await assertOwnAircraft(supabase, aircraftId);

    const parsed = aircraftFormSchema.safeParse({
      model: formData.get("model"),
      registration: formData.get("registration"),
      seats: formData.get("seats"),
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const { error } = await supabase
      .from("aircraft")
      .update({
        model: parsed.data.model,
        registration: parsed.data.registration,
        seats: parsed.data.seats,
      })
      .eq("id", aircraftId);

    if (error) {
      if (error.code === "23505") {
        return { error: "That registration is already in use" };
      }
      return { error: error.message };
    }

    revalidatePath("/pilot/aircraft");
    revalidatePath(`/pilot/aircraft/${aircraftId}`);
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Aircraft updated" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to update aircraft",
    };
  }
}

export async function deleteAircraftAction(aircraftId: string): Promise<AircraftActionState> {
  try {
    const supabase = await createClient();
    const { user } = await assertOwnAircraft(supabase, aircraftId);

    const { data: photos } = await supabase
      .from("aircraft_photos")
      .select("storage_path")
      .eq("aircraft_id", aircraftId);

    const paths = photos?.map((p) => p.storage_path) ?? [];
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }

    const { error } = await supabase.from("aircraft").delete().eq("id", aircraftId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/pilot/aircraft");
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Aircraft removed" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete aircraft",
    };
  }
}

export async function uploadAircraftPhotoAction(
  formData: FormData,
): Promise<AircraftActionState> {
  try {
    const supabase = await createClient();
    const aircraftId = String(formData.get("aircraftId") ?? "");
    if (!aircraftId) {
      return { error: "Missing aircraft id" };
    }

    const { user } = await assertOwnAircraft(supabase, aircraftId);

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "No file provided" };
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return { error: "File must be JPEG or PNG" };
    }

    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "File must be under 5MB" };
    }

    const { data: existing } = await supabase
      .from("aircraft_photos")
      .select("position")
      .eq("aircraft_id", aircraftId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = (existing?.[0]?.position ?? -1) + 1;
    const ext = file.type === "image/png" ? "png" : "jpg";
    const storagePath = `${aircraftId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { error: insertError } = await supabase.from("aircraft_photos").insert({
      aircraft_id: aircraftId,
      storage_path: storagePath,
      position: nextPos,
    });

    if (insertError) {
      return { error: insertError.message };
    }

    revalidatePath("/pilot/aircraft");
    revalidatePath(`/pilot/aircraft/${aircraftId}`);
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Photo added" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to upload photo",
    };
  }
}

export async function deleteAircraftPhotoAction(photoId: string): Promise<AircraftActionState> {
  try {
    const supabase = await createClient();

    const { data: photo, error: fetchError } = await supabase
      .from("aircraft_photos")
      .select("id, storage_path, aircraft_id")
      .eq("id", photoId)
      .single();

    if (fetchError || !photo) {
      return { error: "Photo not found" };
    }

    const { user } = await assertOwnAircraft(supabase, photo.aircraft_id);

    const { count } = await supabase
      .from("aircraft_photos")
      .select("id", { count: "exact", head: true })
      .eq("aircraft_id", photo.aircraft_id);

    if ((count ?? 0) <= 1) {
      return { error: "Each aircraft must keep at least one photo" };
    }

    await supabase.storage.from(BUCKET).remove([photo.storage_path]);

    const { error } = await supabase.from("aircraft_photos").delete().eq("id", photoId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/pilot/aircraft");
    revalidatePath(`/pilot/aircraft/${photo.aircraft_id}`);
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Photo deleted" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete photo",
    };
  }
}

export async function reorderAircraftPhotosAction(
  _prev: AircraftActionState,
  formData: FormData,
): Promise<AircraftActionState> {
  try {
    const supabase = await createClient();
    const aircraftId = String(formData.get("aircraftId") ?? "");
    const raw = formData.get("orderedIds");
    if (!aircraftId || typeof raw !== "string") {
      return { error: "Invalid reorder payload" };
    }

    let parsedIds: string[];
    try {
      const json = JSON.parse(raw) as unknown;
      const p = aircraftPhotoReorderSchema.safeParse({ orderedIds: json });
      if (!p.success) {
        return { error: "Invalid order" };
      }
      parsedIds = p.data.orderedIds;
    } catch {
      return { error: "Invalid order JSON" };
    }

    const { user } = await assertOwnAircraft(supabase, aircraftId);

    const { data: rows, error: listError } = await supabase
      .from("aircraft_photos")
      .select("id")
      .eq("aircraft_id", aircraftId);

    if (listError || !rows) {
      return { error: listError?.message ?? "Failed to load photos" };
    }

    const validIds = new Set(rows.map((r) => r.id));
    if (parsedIds.length !== validIds.size) {
      return { error: "Order must include every photo" };
    }
    for (const id of parsedIds) {
      if (!validIds.has(id)) {
        return { error: "Unknown photo in order" };
      }
    }

    let pos = 0;
    for (const id of parsedIds) {
      const { error } = await supabase
        .from("aircraft_photos")
        .update({ position: pos })
        .eq("id", id)
        .eq("aircraft_id", aircraftId);

      if (error) {
        return { error: error.message };
      }
      pos += 1;
    }

    revalidatePath("/pilot/aircraft");
    revalidatePath(`/pilot/aircraft/${aircraftId}`);
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Order updated" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to reorder photos",
    };
  }
}

export async function uploadAircraftPhotoFormAction(
  _prev: AircraftActionState,
  formData: FormData,
): Promise<AircraftActionState> {
  return uploadAircraftPhotoAction(formData);
}
