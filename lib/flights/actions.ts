"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePilot, requireUser, getProfile } from "@/lib/auth/rbac";
import {
  ALLOWED_FLIGHT_PHOTO_MIME,
  FLIGHT_PHOTOS_BUCKET,
  MAX_PHOTO_BYTES,
  MAX_FLIGHT_PHOTOS,
  MIN_FLIGHT_PHOTOS,
} from "@/lib/flights/constants";
import { checkRoutePriceDeviation } from "@/lib/flights/pricing";
import {
  computePricePerPassenger,
  publishFlightSchema,
  type FlightDraft,
} from "@/lib/flights/schemas";
import { rethrowIfNextRedirect } from "@/lib/navigation/redirect-error";
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
    const { error } = await admin.from("notification_queue").insert({
      user_id: a.id,
      type: "flight_price_deviation",
      payload: { flightId, pilotUserId: pilotId, ...payload },
    });
    if (error) {
      console.error("[notifyAdminsPriceDeviation]", error.message);
    }
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

    const supabase = await createClient();
    const { data: draftRow } = await supabase
      .from("flight_publish_drafts")
      .select("draft")
      .eq("pilot_user_id", user.id)
      .maybeSingle();

    const existingCount =
      (draftRow?.draft as FlightDraft | null)?.photoPaths?.length ?? 0;
    if (existingCount >= MAX_FLIGHT_PHOTOS) {
      return { error: `Maximum ${MAX_FLIGHT_PHOTOS} photos allowed` };
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const storagePath = `${user.id}/draft/${randomUUID()}.${ext}`;
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
    if (photoPaths.length > MAX_FLIGHT_PHOTOS) {
      return { error: `Maximum ${MAX_FLIGHT_PHOTOS} photos allowed` };
    }

    for (const p of photoPaths) {
      if (p.includes("..") || !p.startsWith(`${user.id}/draft/`)) {
        return { error: "Invalid photo path" };
      }
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

    if (data.aircraftId) {
      const { data: ac } = await supabase
        .from("aircraft")
        .select("seats")
        .eq("id", data.aircraftId)
        .eq("pilot_user_id", user.id)
        .maybeSingle();

      if (!ac) {
        return { error: "Aircraft not found" };
      }
      if (data.passengerSeats > ac.seats - 1) {
        return {
          error: `Passenger seats cannot exceed ${ac.seats - 1} for this aircraft`,
        };
      }
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

    const movedPaths: string[] = [];

    const rollback = async (errMsg: string): Promise<FlightActionState> => {
      await supabase.from("flights").delete().eq("id", flight.id);
      if (movedPaths.length > 0) {
        const admin = createAdminClient();
        await admin.storage.from(FLIGHT_PHOTOS_BUCKET).remove(movedPaths);
      }
      return { error: errMsg };
    };

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
        if (!blob) {
          return rollback(moveError.message);
        }
        const buf = Buffer.from(await blob.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from(FLIGHT_PHOTOS_BUCKET)
          .upload(destPath, buf, { upsert: true });
        if (uploadError) {
          return rollback(uploadError.message);
        }
        await supabase.storage.from(FLIGHT_PHOTOS_BUCKET).remove([draftPath]);
      }

      movedPaths.push(destPath);

      const { error: photoErr } = await supabase.from("flight_photos").insert({
        flight_id: flight.id,
        storage_path: destPath,
        position,
      });

      if (photoErr) {
        return rollback(photoErr.message);
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
    rethrowIfNextRedirect(e);
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

    const { data, error } = await supabase
      .from("flights")
      .update({ status: "cancelled" })
      .eq("id", flightId)
      .eq("pilot_user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Flight not found or already cancelled" };

    const admin = createAdminClient();
    const { data: activeBookings } = await admin
      .from("flight_booking_requests")
      .select(
        "passenger_user_id, id, status, payment_intent_id, passenger_amount_eur",
      )
      .eq("flight_id", flightId)
      .in("status", ["pending", "accepted", "confirmed"]);

    if (activeBookings?.length) {
      const { createBookingRefund } = await import("@/lib/stripe/refund");
      const now = new Date().toISOString();

      for (const b of activeBookings) {
        if (b.status === "confirmed" && b.payment_intent_id) {
          const refundResult = await createBookingRefund(
            b.payment_intent_id,
            `flight_cancel:${b.id}`,
          );
          if (!("error" in refundResult)) {
            await admin
              .from("flight_booking_requests")
              .update({
                status: "cancelled",
                cancelled_at: now,
                refund_id: refundResult.refundId,
                refunded_at: now,
              })
              .eq("id", b.id);
          } else {
            await admin
              .from("flight_booking_requests")
              .update({ status: "cancelled", cancelled_at: now })
              .eq("id", b.id);
          }
        } else {
          await admin
            .from("flight_booking_requests")
            .update({ status: "cancelled", cancelled_at: now })
            .eq("id", b.id);
        }

        const { error: notifyErr } = await admin.from("notification_queue").insert({
          user_id: b.passenger_user_id,
          type: "booking_cancelled_by_pilot",
          payload: { flightId, bookingId: b.id, refundFull: true },
        });
        if (notifyErr) {
          console.error("[cancelFlightAction] notify passenger:", notifyErr.message);
        }
      }
    }

    revalidatePath("/flights");
    revalidatePath(`/flights/${flightId}`);
    revalidatePath("/pilot/flights");
    revalidatePath(`/pilots/${user.id}`);
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

    const today = new Date().toISOString().slice(0, 10);
    const { data: flight } = await supabase
      .from("flights")
      .select("id, passenger_seats, status, flight_date")
      .eq("id", flightId)
      .eq("status", "published")
      .gte("flight_date", today)
      .maybeSingle();

    if (!flight) {
      return { error: "Flight not available or has already departed" };
    }

    const { data: availableRow } = await supabase
      .from("flights_with_available_seats")
      .select("available_seats")
      .eq("id", flightId)
      .maybeSingle();

    const available = availableRow?.available_seats ?? 0;
    if (available <= 0) {
      return { error: "No seats available on this flight" };
    }

    const { error } = await supabase.from("flight_booking_requests").insert({
      flight_id: flightId,
      passenger_user_id: user.id,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        const { data: reactivated, error: updateErr } = await supabase
          .from("flight_booking_requests")
          .update({ status: "pending" })
          .eq("flight_id", flightId)
          .eq("passenger_user_id", user.id)
          .eq("status", "cancelled")
          .select("id")
          .maybeSingle();

        if (updateErr) {
          if (
            updateErr.code === "P0001" ||
            updateErr.message.includes("No seats available")
          ) {
            return { error: "No seats available on this flight" };
          }
          return { error: updateErr.message };
        }
        if (!reactivated) {
          return { error: "You already have a pending request for this flight" };
        }
      } else {
        return { error: error.message };
      }
    }

    const admin = createAdminClient();
    const { data: flightRow } = await admin
      .from("flights")
      .select("pilot_user_id")
      .eq("id", flightId)
      .single();

    if (flightRow?.pilot_user_id) {
      await admin.from("notification_queue").insert({
        user_id: flightRow.pilot_user_id,
        type: "booking_request_received",
        payload: { flightId, passengerUserId: user.id },
      });
    }

    revalidatePath(`/flights/${flightId}`);
    revalidatePath("/flights");
    revalidatePath("/pilot/bookings");
    return { success: "Booking request sent to the pilot" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to submit request",
    };
  }
}
