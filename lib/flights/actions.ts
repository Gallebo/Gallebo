"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

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
import { insertSystemMessage } from "@/lib/chat/system";
import { inAppCopyForType } from "@/lib/notifications/copy";
import { queueUserNotification } from "@/lib/notifications/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isValidDraftPhotoPath,
  sanitizeFlightDraftForTransport,
  sanitizePhotoPathsForPublish,
} from "@/lib/flights/sanitize-draft";
import { rethrowIfNextRedirect } from "@/lib/navigation/redirect-error";
import { createBookingRefund } from "@/lib/stripe/refund";
import type { Json } from "@/types/database";

export type FlightActionState = {
  error?: string;
  success?: string;
  flightId?: string;
  priceWarning?: string | null;
  avgRoutePrice?: number | null;
  draft?: FlightDraft;
};

async function notifyPassengerBookingEvent(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  type: string,
  payload: Json,
): Promise<void> {
  const payloadObj = (payload ?? {}) as Record<string, unknown>;
  const copy = inAppCopyForType(type, payloadObj);
  await queueUserNotification(
    admin,
    userId,
    type,
    payload,
    copy
      ? {
          title: copy.title,
          body: copy.body,
          bookingId:
            typeof payloadObj.bookingId === "string"
              ? payloadObj.bookingId
              : undefined,
          flightId:
            typeof payloadObj.flightId === "string"
              ? payloadObj.flightId
              : undefined,
        }
      : undefined,
  );
}

async function notifyAdminFlightCancelRefundFailed(
  admin: ReturnType<typeof createAdminClient>,
  pilotUserId: string,
  payload: { flightId: string; bookingId: string; error: string },
): Promise<void> {
  const { error } = await admin.from("notification_queue").insert({
    user_id: pilotUserId,
    type: "flight_cancel_refund_failed",
    payload,
  });
  if (error) {
    console.error(
      "[cancelFlightAction] admin refund-fail notify:",
      error.message,
    );
  }
}

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

export async function loadFlightDraftAction(): Promise<{
  step: number;
  draft: FlightDraft;
  error?: string;
}> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();
    const { data: draftRow, error } = await supabase
      .from("flight_publish_drafts")
      .select("step, draft")
      .eq("pilot_user_id", user.id)
      .maybeSingle();

    if (error) return { step: 1, draft: {}, error: error.message };

    const raw = draftRow?.draft;
    const sanitized = sanitizeFlightDraftForTransport(raw);
    const step =
      typeof draftRow?.step === "number" && draftRow.step >= 1
        ? Math.min(12, Math.floor(draftRow.step))
        : 1;

    const rawJson = JSON.stringify(raw ?? {});
    const sanitizedJson = JSON.stringify(sanitized);
    if (rawJson.length > sanitizedJson.length) {
      await supabase.from("flight_publish_drafts").upsert({
        pilot_user_id: user.id,
        step,
        draft: sanitized as Json,
        updated_at: new Date().toISOString(),
      });
    }

    return { step, draft: sanitized };
  } catch (e) {
    return {
      step: 1,
      draft: {},
      error: e instanceof Error ? e.message : "Failed to load draft",
    };
  }
}

export async function saveFlightDraftAction(
  step: number,
  draft: FlightDraft,
): Promise<FlightActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();
    const safeDraft = sanitizeFlightDraftForTransport(draft);
    const safeStep = Math.min(12, Math.max(1, Math.floor(step)));

    const { error } = await supabase.from("flight_publish_drafts").upsert({
      pilot_user_id: user.id,
      step: safeStep,
      draft: safeDraft as Json,
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

export async function removeFlightDraftPhotoAction(
  storagePath: string,
): Promise<FlightActionState> {
  try {
    const { user } = await requirePilot();
    const path = storagePath.trim();
    if (!isValidDraftPhotoPath(user.id, path)) {
      return { error: "Invalid photo" };
    }

    const supabase = await createClient();
    const { error: storageError } = await supabase.storage
      .from(FLIGHT_PHOTOS_BUCKET)
      .remove([path]);
    if (storageError) return { error: storageError.message };

    const { data: draftRow } = await supabase
      .from("flight_publish_drafts")
      .select("step, draft")
      .eq("pilot_user_id", user.id)
      .maybeSingle();

    const currentDraft = sanitizeFlightDraftForTransport(draftRow?.draft);
    const photoPaths = (currentDraft.photoPaths ?? []).filter((p) => p !== path);
    const nextDraft: FlightDraft = { ...currentDraft, photoPaths };
    const step =
      typeof draftRow?.step === "number" && draftRow.step >= 1
        ? Math.min(12, Math.floor(draftRow.step))
        : 8;

    const { error } = await supabase.from("flight_publish_drafts").upsert({
      pilot_user_id: user.id,
      step,
      draft: nextDraft as Json,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };

    return { success: "Photo removed", draft: nextDraft };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to remove photo",
    };
  }
}

export async function clearFlightPublishDraftAction(): Promise<FlightActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();

    const { data: draftRow } = await supabase
      .from("flight_publish_drafts")
      .select("draft")
      .eq("pilot_user_id", user.id)
      .maybeSingle();

    const pathsToRemove = new Set<string>(
      sanitizeFlightDraftForTransport(draftRow?.draft).photoPaths ?? [],
    );

    const { data: listed } = await supabase.storage
      .from(FLIGHT_PHOTOS_BUCKET)
      .list(`${user.id}/draft`);

    for (const item of listed ?? []) {
      if (item.name) {
        pathsToRemove.add(`${user.id}/draft/${item.name}`);
      }
    }

    if (pathsToRemove.size > 0) {
      const { error: storageError } = await supabase.storage
        .from(FLIGHT_PHOTOS_BUCKET)
        .remove([...pathsToRemove]);
      if (storageError) return { error: storageError.message };
    }

    const { error } = await supabase
      .from("flight_publish_drafts")
      .delete()
      .eq("pilot_user_id", user.id);

    if (error) return { error: error.message };
    return { success: "Draft discarded" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to discard draft",
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
    const adminSupabase = createAdminClient();

    const { data: pilotProfile } = await supabase
      .from("pilot_profiles")
      .select("stripe_onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!pilotProfile?.stripe_onboarding_complete) {
      return {
        error: "Please set up your payout account before publishing a flight.",
      };
    }

    const photoPathsRaw = formData.get("photoPaths");
    let photoPaths: string[] = [];
    if (typeof photoPathsRaw === "string" && photoPathsRaw.length > 0) {
      try {
        photoPaths = sanitizePhotoPathsForPublish(JSON.parse(photoPathsRaw));
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
      airworthinessDeclared:
        formData.get("airworthinessDeclared") === "on" ? "on" : undefined,
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
      airworthiness_declared_at: new Date().toISOString(),
    };

    const { data: flight, error: flightError } = await supabase
      .from("flights")
      .insert(insertRow)
      .select("id")
      .single();

    if (flightError || !flight) {
      console.error(
        "FLIGHTS INSERT ERROR:",
        flightError?.message,
        flightError?.code,
      );
      return { error: flightError?.message ?? "Failed to publish flight" };
    }
    console.log("[flights] flight published");

    const movedPaths: string[] = [];

    const rollback = async (errMsg: string): Promise<FlightActionState> => {
      await supabase.from("flights").delete().eq("id", flight.id);
      if (movedPaths.length > 0) {
        await adminSupabase.storage
          .from(FLIGHT_PHOTOS_BUCKET)
          .remove(movedPaths);
      }
      return { error: errMsg };
    };

    let position = 0;
    for (const draftPath of photoPaths) {
      const filename = draftPath.split("/").pop() ?? `${randomUUID()}.jpg`;
      const destPath = `${flight.id}/${filename}`;

      const { error: moveError } = await adminSupabase.storage
        .from(FLIGHT_PHOTOS_BUCKET)
        .move(draftPath, destPath);

      if (moveError) {
        console.error(
          "STORAGE MOVE ERROR:",
          moveError.message,
          "path:",
          draftPath,
          "->",
          destPath,
        );
        const { data: blob } = await adminSupabase.storage
          .from(FLIGHT_PHOTOS_BUCKET)
          .download(draftPath);
        if (!blob) {
          console.error(
            "STORAGE DOWNLOAD ERROR (fallback): no blob for path:",
            draftPath,
          );
          return rollback(moveError.message);
        }
        const buf = Buffer.from(await blob.arrayBuffer());
        const contentType = blob.type || "image/jpeg";
        const { error: uploadError } = await adminSupabase.storage
          .from(FLIGHT_PHOTOS_BUCKET)
          .upload(destPath, buf, { upsert: true, contentType });
        if (uploadError) {
          console.error(
            "STORAGE UPLOAD ERROR:",
            uploadError.message,
            "path:",
            destPath,
          );
          return rollback(uploadError.message);
        }
        console.log("[flights] storage upload ok");
        await adminSupabase.storage
          .from(FLIGHT_PHOTOS_BUCKET)
          .remove([draftPath]);
      } else {
        console.log("[flights] storage move ok");
      }

      movedPaths.push(destPath);

      const { error: photoErr } = await supabase.from("flight_photos").insert({
        flight_id: flight.id,
        storage_path: destPath,
        position,
      });

      if (photoErr) {
        console.error(
          "FLIGHT_PHOTOS INSERT ERROR:",
          photoErr.message,
          photoErr.code,
        );
        return rollback(photoErr.message);
      }
      console.log("[flights] photo inserted");
      position += 1;
    }

    const { error: draftDeleteErr } = await supabase
      .from("flight_publish_drafts")
      .delete()
      .eq("pilot_user_id", user.id);

    if (draftDeleteErr) {
      console.error("DRAFT DELETE ERROR:", draftDeleteErr.message);
    } else {
      console.log("FLIGHT_PUBLISH_DRAFT DELETE OK");
    }

    if (priceCheck.deviationFlag) {
      await notifyAdminsPriceDeviation(flight.id, user.id, {
        pricePerPassenger,
        avgPrice: priceCheck.avgPrice,
        departureAirfieldId: data.departureAirfieldId,
        arrivalAirfieldId: data.arrivalAirfieldId,
      });
    }

    try {
      const admin = createAdminClient();
      const { data: alertMatches, error: matchError } = await admin.rpc(
        "match_alerts_for_flight",
        { p_flight_id: flight.id },
      );
      if (matchError) {
        console.error(
          "[publishFlightAction] match_alerts_for_flight:",
          matchError.message,
        );
      } else {
        const notified = new Set<string>();
        const matches = Array.isArray(alertMatches) ? alertMatches : [];
        const notifyTasks = matches
          .filter((match) => {
            if (notified.has(match.passenger_user_id)) return false;
            notified.add(match.passenger_user_id);
            return true;
          })
          .map((match) => {
            const payload = {
              flightId: flight.id,
              departureAirfieldId: data.departureAirfieldId,
              arrivalAirfieldId: data.arrivalAirfieldId,
            } as Json;
            const copy = inAppCopyForType(
              "flight_alert_match",
              payload as Record<string, unknown>,
            );
            return queueUserNotification(
              admin,
              match.passenger_user_id,
              "flight_alert_match",
              payload,
              copy
                ? {
                    title: copy.title,
                    body: copy.body,
                    flightId: flight.id,
                  }
                : undefined,
            );
          });

        const results = await Promise.allSettled(notifyTasks);
        for (const result of results) {
          if (result.status === "rejected") {
            console.error(
              "[publishFlightAction] flight_alert_match notify failed:",
              result.reason,
            );
          }
        }
      }
    } catch (alertErr) {
      console.error("[publishFlightAction] alert matching failed:", alertErr);
    }

    revalidatePath("/flights");
    revalidatePath("/flights/map");
    revalidatePath("/", "layout");
    revalidatePath(`/flights/${flight.id}`);
    revalidatePath("/pilot/flights");
    revalidatePath(`/pilots/${user.id}`);

    console.log("[flights] publish complete");
    return { success: "published", flightId: flight.id };
  } catch (e) {
    rethrowIfNextRedirect(e);
    console.error("PUBLISH FLIGHT UNCAUGHT ERROR:", e);
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

    const { data: flight } = await supabase
      .from("flights")
      .select("id, status, cancellation_locked_at")
      .eq("id", flightId)
      .eq("pilot_user_id", user.id)
      .maybeSingle();

    if (!flight) return { error: "Flight not found" };
    if (flight.status !== "published") {
      return { error: "Only published flights can be cancelled" };
    }
    if (flight.cancellation_locked_at) {
      return {
        error:
          "Cancellation is blocked pending support review. Our team has been notified.",
      };
    }

    const admin = createAdminClient();
    const { data: activeBookings } = await admin
      .from("flight_booking_requests")
      .select(
        "passenger_user_id, id, status, payment_intent_id, passenger_amount_eur",
      )
      .eq("flight_id", flightId)
      .in("status", ["pending", "accepted", "confirmed"]);

    const refundByBookingId = new Map<string, string>();

    for (const b of activeBookings ?? []) {
      if (b.status === "confirmed" && b.payment_intent_id) {
        const refundResult = await createBookingRefund(
          b.payment_intent_id,
          `flight_cancel:${b.id}`,
        );
        if ("error" in refundResult) {
          await admin
            .from("flights")
            .update({
              cancellation_locked_at: new Date().toISOString(),
              cancellation_lock_reason: "refund_failed",
            })
            .eq("id", flightId);

          await notifyAdminFlightCancelRefundFailed(admin, user.id, {
            flightId,
            bookingId: b.id,
            error: refundResult.error,
          });

          revalidatePath("/pilot/flights");
          revalidatePath(`/flights/${flightId}`);

          return {
            error:
              "Refund failed. Flight locked — our team has been notified.",
          };
        }
        refundByBookingId.set(b.id, refundResult.refundId);
      }
    }

    const now = new Date().toISOString();

    for (const b of activeBookings ?? []) {
      const refundId = refundByBookingId.get(b.id);
      const isPaidConfirmed = b.status === "confirmed";

      await admin
        .from("flight_booking_requests")
        .update({
          status: "cancelled",
          cancelled_at: now,
          cancelled_by: user.id,
          payout_status: "not_applicable",
          ...(refundId ? { refund_id: refundId, refunded_at: now } : {}),
        })
        .eq("id", b.id);

      await insertSystemMessage(b.id, "Let je otkazan.");

      await notifyPassengerBookingEvent(admin, b.passenger_user_id, "booking_cancelled_by_pilot", {
        flightId,
        bookingId: b.id,
        refundFull: isPaidConfirmed,
      });
    }

    const { error } = await admin
      .from("flights")
      .update({ status: "cancelled" })
      .eq("id", flightId)
      .eq("pilot_user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/flights");
    revalidatePath(`/flights/${flightId}`);
    revalidatePath("/pilot/flights");
    revalidatePath("/pilot/bookings");
    revalidatePath("/passenger/bookings");
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

    const { count: activeBookings } = await supabase
      .from("flight_booking_requests")
      .select("*", { count: "exact", head: true })
      .eq("passenger_user_id", user.id)
      .in("status", ["pending", "accepted", "confirmed"]);

    if ((activeBookings ?? 0) >= 3) {
      return {
        error: "Možeš imati najviše 3 aktivna zahtjeva za booking.",
      };
    }

    let bookingId: string | null = null;

    const { data: inserted, error } = await supabase
      .from("flight_booking_requests")
      .insert({
        flight_id: flightId,
        passenger_user_id: user.id,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

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
          if (updateErr.message.includes("Maximum 3 active booking")) {
            return {
              error: "Možeš imati najviše 3 aktivna zahtjeva za booking.",
            };
          }
          return { error: updateErr.message };
        }
        if (!reactivated) {
          return { error: "You already have a pending request for this flight" };
        }
        bookingId = reactivated.id;
      } else {
        if (error.message.includes("Maximum 3 active booking")) {
          return {
            error: "Možeš imati najviše 3 aktivna zahtjeva za booking.",
          };
        }
        return { error: error.message };
      }
    } else {
      bookingId = inserted?.id ?? null;
    }

    const admin = createAdminClient();
    const { data: flightRow } = await admin
      .from("flights")
      .select("pilot_user_id")
      .eq("id", flightId)
      .single();

    if (flightRow?.pilot_user_id && bookingId) {
      await insertSystemMessage(
        bookingId,
        "Zahtjev za booking je poslan pilotu.",
      );

      const payload = {
        flightId,
        bookingId,
        passengerUserId: user.id,
      } as Json;
      const copy = inAppCopyForType("booking_request_received", payload as Record<string, unknown>);
      await queueUserNotification(
        admin,
        flightRow.pilot_user_id,
        "booking_request_received",
        payload,
        copy
          ? {
              title: copy.title,
              body: copy.body,
              bookingId,
              flightId,
            }
          : undefined,
      );
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
