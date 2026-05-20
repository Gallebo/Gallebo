"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import {
  createEventSchema,
  createNoticeSchema,
  updateAirfieldProfileSchema,
  updateEventSchema,
} from "@/lib/airfield/schemas";
import { requireUser } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export type AirfieldActionState = { error?: string; success?: string };

const AIRFIELD_PHOTOS_BUCKET = "airfield-photos";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

async function getOperatorAirfield() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: airfield, error } = await supabase
    .from("airfields")
    .select("*")
    .eq("operator_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!airfield) {
    throw new Error("No airfield assigned to your account");
  }

  return { user, airfield, supabase };
}

export async function updateAirfieldProfileAction(
  _prev: AirfieldActionState,
  formData: FormData
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const parsed = updateAirfieldProfileSchema.safeParse({
      name: formData.get("name"),
      contact_email: formData.get("contact_email"),
      contact_phone: formData.get("contact_phone"),
      working_hours: formData.get("working_hours"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      country: formData.get("country"),
      has_fuel: formData.get("has_fuel"),
      has_hangar: formData.get("has_hangar"),
      has_rental: formData.get("has_rental"),
      description: formData.get("description"),
      destination_info: formData.get("destination_info"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const data = parsed.data;

    const { error } = await supabase.rpc("update_airfield_as_operator", {
      p_airfield_id: airfield.id,
      p_name: data.name,
      p_contact_email: data.contact_email || null,
      p_contact_phone: data.contact_phone || null,
      p_working_hours: data.working_hours || null,
      p_latitude: data.latitude,
      p_longitude: data.longitude,
      p_country: data.country,
      p_has_fuel: data.has_fuel,
      p_has_hangar: data.has_hangar,
      p_has_rental: data.has_rental,
      p_description: data.description || null,
      p_destination_info: data.destination_info || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/airfield");
    revalidatePath("/airfield/edit");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    revalidatePath("/map");
    return { success: "Profile updated" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}

export async function uploadAirfieldPhotoAction(
  formData: FormData
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { error: "No file provided" };
    }

    if (!ALLOWED_PHOTO_MIME.has(file.type)) {
      return { error: "File must be JPEG, PNG, or WebP" };
    }

    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "File must be under 10MB" };
    }

    const { data: existingPhotos } = await supabase
      .from("airfield_photos")
      .select("sort_order")
      .eq("airfield_id", airfield.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existingPhotos?.[0]?.sort_order ?? -1) + 1;
    const objectId = randomUUID();
    const storagePath = `${airfield.id}/${objectId}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(AIRFIELD_PHOTOS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { error: insertError } = await supabase.from("airfield_photos").insert({
      airfield_id: airfield.id,
      storage_path: storagePath,
      sort_order: nextOrder,
    });

    if (insertError) {
      return { error: insertError.message };
    }

    revalidatePath("/airfield/photos");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Photo uploaded" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to upload photo",
    };
  }
}

export async function deleteAirfieldPhotoAction(
  photoId: string
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const { data: photo, error: fetchError } = await supabase
      .from("airfield_photos")
      .select("storage_path")
      .eq("id", photoId)
      .eq("airfield_id", airfield.id)
      .single();

    if (fetchError || !photo) {
      return { error: "Photo not found" };
    }

    await supabase.storage
      .from(AIRFIELD_PHOTOS_BUCKET)
      .remove([photo.storage_path]);

    const { error } = await supabase
      .from("airfield_photos")
      .delete()
      .eq("id", photoId)
      .eq("airfield_id", airfield.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/airfield/photos");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Photo deleted" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete photo",
    };
  }
}

export async function updatePhotoOrderAction(
  photoId: string,
  direction: "up" | "down"
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const { data: photos, error: listError } = await supabase
      .from("airfield_photos")
      .select("id, sort_order")
      .eq("airfield_id", airfield.id)
      .order("sort_order", { ascending: true });

    if (listError || !photos) {
      return { error: listError?.message ?? "Failed to load photos" };
    }

    const index = photos.findIndex((p) => p.id === photoId);
    if (index === -1) {
      return { error: "Photo not found" };
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= photos.length) {
      return { success: "Order unchanged" };
    }

    const current = photos[index];
    const swap = photos[swapIndex];

    if (!current || !swap) {
      return { error: "Photo not found" };
    }

    const { error: swapErr } = await supabase.rpc("swap_airfield_photo_order", {
      p_id_a: current.id,
      p_order_a: current.sort_order,
      p_id_b: swap.id,
      p_order_b: swap.sort_order,
    });

    if (swapErr) {
      return { error: swapErr.message };
    }

    revalidatePath("/airfield/photos");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Order updated" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to reorder photos",
    };
  }
}

export async function createNoticeAction(
  _prev: AirfieldActionState,
  formData: FormData
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const parsed = createNoticeSchema.safeParse({
      body: formData.get("body"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid notice" };
    }

    const { error } = await supabase.from("airfield_notices").insert({
      airfield_id: airfield.id,
      body: parsed.data.body,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/airfield/notices");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Notice published" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to publish notice",
    };
  }
}

export async function deleteNoticeAction(
  noticeId: string
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const { error } = await supabase
      .from("airfield_notices")
      .delete()
      .eq("id", noticeId)
      .eq("airfield_id", airfield.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/airfield/notices");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Notice deleted" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete notice",
    };
  }
}

export async function createEventAction(
  _prev: AirfieldActionState,
  formData: FormData
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const parsed = createEventSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      event_date: formData.get("event_date"),
      link: formData.get("link"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid event" };
    }

    const { error } = await supabase.from("airfield_events").insert({
      airfield_id: airfield.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_date: parsed.data.event_date,
      link: parsed.data.link || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/airfield/events");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Event created" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create event",
    };
  }
}

export async function updateEventAction(
  eventId: string,
  _prev: AirfieldActionState,
  formData: FormData
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const parsed = updateEventSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      event_date: formData.get("event_date"),
      link: formData.get("link"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid event" };
    }

    const { error } = await supabase
      .from("airfield_events")
      .update({
        title: parsed.data.title,
        description: parsed.data.description || null,
        event_date: parsed.data.event_date,
        link: parsed.data.link || null,
      })
      .eq("id", eventId)
      .eq("airfield_id", airfield.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/airfield/events");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Event updated" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update event",
    };
  }
}

export async function deleteEventAction(
  eventId: string
): Promise<AirfieldActionState> {
  try {
    const { airfield, supabase } = await getOperatorAirfield();

    const { error } = await supabase
      .from("airfield_events")
      .delete()
      .eq("id", eventId)
      .eq("airfield_id", airfield.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/airfield/events");
    revalidatePath(`/airfields/${airfield.icao_code}`);
    return { success: "Event deleted" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete event",
    };
  }
}
