"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePilot, requireUser, getProfile } from "@/lib/auth/rbac";
import {
  ALLOWED_FLIGHT_PHOTO_MIME,
  FLIGHT_PHOTOS_BUCKET,
  MAX_PHOTO_BYTES,
  MIN_FLIGHT_PHOTOS,
} from "@/lib/flights/constants";
import { checkRoutePriceDeviation } from "@/lib/flights/pricing";
import {
  computePricePerPassenger,
  publishFlightSchema,
  type FlightDraft,
} from "@/lib/flights/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type FlightActionState = {
  error?: string;
  success?: string;
  flightId?: string;
  priceWarning?: string | null;
  avgRoutePrice?: number | null;
};

async function notifyAdminsPriceDeviation(
  flightId: string,
  pilotId: string,
  payload: Record<string, unknown>,
) {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  for (const a of admins ?? []) {
    await admin.from("notification_queue").insert({
      user_id: a.id,
      type: "flight_price_deviation",
      payload: { flightId, pilotUserId: pilotId, ...payload },
    });
  }
}

export async function saveFlightDraftAction(
  step: number,
  draft: FlightDraft,
): Promise<FlightActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();

    const { error } = await supabase.from("flight_publish_drafts").upsert({
      pilot_user_id: user.id,
      step,
      draft: draft as Json,
      updated_at: new Date().toISOString(),
    });

    if (error) return { error: error.message };
    return { success: "Draft saved" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to save draft",
    };
  }
}

export async function uploadFlightDraftPhotoAction(
  formData: FormData,
): Promise<FlightActionState & { path?: string }> {
  try {
    const { user } = await requirePilot();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "No file provided" };
    }
    if (!ALLOWED_FLIGHT_PHOTO_MIME.has(file.type)) {
      return { error: "Use JPEG, PNG, or WebP" };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "File must be under 5MB" };
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const storagePath = `${user.id}/draft/${randomUUID()}.${ext}`;
    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(FLIGHT_PHOTOS_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (error) return { error: error.message };
    return { success: "Photo uploaded", path: storagePath };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Upload failed",
    };
  }
}

export async function previewPublishPricingAction(
  draft: FlightDraft,
): Promise<FlightActionState> {
  try {
    await requirePilot();
    if (
      !draft.departureAirfieldId ||
      !draft.arrivalAirfieldId ||
      !draft.flightType ||
      !draft.totalCostEur ||
      !draft.passengerSeats
    ) {
      return { error: "Complete route, cost, and seats first" };
    }

    const price = computePricePerPassenger(
      draft.totalCostEur,
      draft.passengerSeats,
    );

    const check = await checkRoutePriceDeviation(
      draft.departureAirfieldId,
      draft.arrivalAirfieldId,
      draft.flightType,
      price,
    );

    return {
      success: "ok",
      priceWarning: check.warningMessage,
      avgRoutePrice: check.avgPrice,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Pricing check failed",
    };
  }
}

export async function publishFlightAction(
  _prev: FlightActionState,
  formData: FormData,
): Promise<FlightActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();

    const photoPathsRaw = formData.get("photoPaths");
    let photoPaths: string[] = [];
    if (typeof photoPathsRaw === "string" && photoPathsRaw.length > 0) {
      try {
        photoPaths = JSON.parse(photoPathsRaw) as string[];
      } catch {
        return { error: "Invalid photo list" };
      }
    }

    if (photoPaths.length < MIN_FLIGHT_PHOTOS) {
      return { error: `At least ${MIN_FLIGHT_PHOTOS} photos are required` };
    }

    const parsed = publishFlightSchema.safeParse({
      flightType: formData.get("flightType"),
      aircraftId: formData.get("aircraftId") || undefined,
      rentedModel: formData.get("rentedModel") || undefined,
      rentedRegistration: formData.get("rentedRegistration") || undefined,
      rentedSeats: formData.get("rentedSeats") || undefined,
      departureAirfieldId: formData.get("departureAirfieldId"),
      arrivalAirfieldId: formData.get("arrivalAirfieldId"),
      flightDate: formData.get("flightDate"),
      departureTime: formData.get("departureTime"),
      totalCostEur: formData.get("totalCostEur"),
      passengerSeats: formData.get("passengerSeats"),
      description: formData.get("description"),
      communicationLanguage: formData.get("communicationLanguage"),
      returnNote: formData.get("returnNote") || undefined,
      pilotReturnDate: formData.get("pilotReturnDate") || undefined,
      costAcknowledged:
        formData.get("costAcknowledged") === "on" ? "on" : undefined,
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid flight data",
      };
    }

    const data = parsed.data;
    const pricePerPassenger = computePricePerPassenger(
      data.totalCostEur,
      data.passengerSeats,
    );

    const priceCheck = await checkRoutePriceDeviation(
      data.departureAirfieldId,
      data.arrivalAirfieldId,
      data.flightType,
      pricePerPassenger,
    );

    if (priceCheck.deviationFlag && data.costAcknowledged !== "on") {
      return {
        error: "Please confirm the cost-sharing declaration when price deviates from average",
        priceWarning: priceCheck.warningMessage,
        avgRoutePrice: priceCheck.avgPrice,
      };
    }

    const insertRow = {
      pilot_user_id: user.id,
      flight_type: data.flightType,
      status: "published" as const,
      departure_airfield_id: data.departureAirfieldId,
      arrival_airfield_id: data.arrivalAirfieldId,
      flight_date: data.flightDate,
      departure_time: data.departureTime,
      total_cost_eur: data.totalCostEur,
      price_per_passenger_eur: pricePerPassenger,
      passenger_seats: data.passengerSeats,
      description: data.description,
      communication_language: data.communicationLanguage,
      return_note:
        data.flightType === "one_way" && data.returnNote
          ? data.returnNote
          : null,
      pilot_return_date:
        data.flightType === "one_way" && data.pilotReturnDate
          ? data.pilotReturnDate
          : null,
      aircraft_id: data.aircraftId ?? null,
      rented_model: data.rentedModel ?? null,
      rented_registration: data.rentedRegistration ?? null,
      rented_seats: data.rentedSeats ?? null,
      route_avg_price_eur: priceCheck.avgPrice,
      price_deviation_flag: priceCheck.deviationFlag,
      published_at: new Date().toISOString(),
    };

    const { data: flight, error: flightError } = await supabase
      .from("flights")
      .insert(insertRow)
      .select("id")
      .single();

    if (flightError || !flight) {
      return { error: flightError?.message ?? "Failed to publish flight" };
    }

    let position = 0;
    for (const draftPath of photoPaths) {
      const filename = draftPath.split("/").pop() ?? `${randomUUID()}.jpg`;
      const destPath = `${flight.id}/${filename}`;

      const { error: moveError } = await supabase.storage
        .from(FLIGHT_PHOTOS_BUCKET)
        .move(draftPath, destPath);

      if (moveError) {
        const { data: blob } = await supabase.storage
          .from(FLIGHT_PHOTOS_BUCKET)
          .download(draftPath);
        if (blob) {
          const buf = Buffer.from(await blob.arrayBuffer());
          await supabase.storage
            .from(FLIGHT_PHOTOS_BUCKET)
            .upload(destPath, buf, { upsert: true });
          await supabase.storage.from(FLIGHT_PHOTOS_BUCKET).remove([draftPath]);
        } else {
          await supabase.from("flights").delete().eq("id", flight.id);
          return { error: moveError.message };
        }
      }

      const { error: photoErr } = await supabase.from("flight_photos").insert({
        flight_id: flight.id,
        storage_path: destPath,
        position,
      });

      if (photoErr) {
        await supabase.from("flights").delete().eq("id", flight.id);
        return { error: photoErr.message };
      }
      position += 1;
    }

    await supabase
      .from("flight_publish_drafts")
      .delete()
      .eq("pilot_user_id", user.id);

    if (priceCheck.deviationFlag) {
      await notifyAdminsPriceDeviation(flight.id, user.id, {
        pricePerPassenger,
        avgPrice: priceCheck.avgPrice,
        departureAirfieldId: data.departureAirfieldId,
        arrivalAirfieldId: data.arrivalAirfieldId,
      });
    }

    revalidatePath("/flights");
    revalidatePath("/flights/map");
    revalidatePath(`/flights/${flight.id}`);
    revalidatePath("/pilot/flights");
    revalidatePath(`/pilots/${user.id}`);

    redirect(`/pilot/flights?published=${flight.id}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") {
      throw e;
    }
    return {
      error: e instanceof Error ? e.message : "Failed to publish",
    };
  }
}

export async function cancelFlightAction(
  flightId: string,
): Promise<FlightActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();

    const { error } = await supabase
      .from("flights")
      .update({ status: "cancelled" })
      .eq("id", flightId)
      .eq("pilot_user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/flights");
    revalidatePath("/pilot/flights");
    return { success: "Flight cancelled" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to cancel",
    };
  }
}

export async function submitBookingRequestAction(
  flightId: string,
): Promise<FlightActionState> {
  try {
    const user = await requireUser();
    const profile = await getProfile();

    if (profile?.role !== "passenger" || profile.status !== "verified") {
      return { error: "Only verified passengers can request bookings" };
    }

    const supabase = await createClient();

    const { data: flight } = await supabase
      .from("flights")
      .select("id, passenger_seats, status, flight_date")
      .eq("id", flightId)
      .eq("status", "published")
      .maybeSingle();

    if (!flight) {
      return { error: "Flight not available" };
    }

    const { count } = await supabase
      .from("flight_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("flight_id", flightId)
      .eq("status", "pending");

    const pending = count ?? 0;
    if (pending >= flight.passenger_seats) {
      return { error: "No seats available on this flight" };
    }

    const { error } = await supabase.from("flight_booking_requests").insert({
      flight_id: flightId,
      passenger_user_id: user.id,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        return { error: "You already requested this flight" };
      }
      return { error: error.message };
    }

    revalidatePath(`/flights/${flightId}`);
    revalidatePath("/flights");
    return { success: "Booking request sent to the pilot" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to submit request",
    };
  }
}
