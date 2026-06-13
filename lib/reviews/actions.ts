"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePilot, requireVerifiedPassenger } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReviewActionState = {
  error?: string;
  success?: string;
};

const uuidSchema = z.string().uuid();

function isValidUuid(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

function parseRating(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n >= 1 && n <= 5 ? n : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const i = Math.trunc(n);
    return i >= 1 && i <= 5 ? i : null;
  }
  return null;
}

function normalizeComment(comment: unknown): string {
  if (typeof comment !== "string") return "";
  return comment.trim();
}

async function revealBookingReviews(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
): Promise<string | null> {
  const { error } = await admin.rpc("reveal_booking_reviews", {
    p_booking_id: bookingId,
  });
  return error?.message ?? null;
}

export async function submitPilotReview(
  bookingId: string,
  input: {
    communicationRating: unknown;
    accuracyRating: unknown;
    experienceRating: unknown;
    comment?: unknown;
  },
): Promise<ReviewActionState> {
  try {
    if (!isValidUuid(bookingId)) return { error: "Invalid ID" };
    const { user } = await requireVerifiedPassenger();
    const admin = createAdminClient();

    const { data: booking, error: bookingErr } = await admin
      .from("flight_booking_requests")
      .select(
        "id, status, passenger_user_id, review_deadline_at, flight_id, flights!inner(pilot_user_id)",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr) {
      return { error: bookingErr.message };
    }
    if (!booking) {
      return { error: "Booking not found." };
    }
    if (booking.passenger_user_id !== user.id) {
      return { error: "Not your booking." };
    }
    if (booking.status !== "completed") {
      return { error: "Flight is not completed yet." };
    }

    const deadlineAt = booking.review_deadline_at as string | null;
    if (!deadlineAt) {
      return { error: "Review deadline not set. Please try later." };
    }
    if (new Date().toISOString() > deadlineAt) {
      return { error: "Review period expired." };
    }

    const pilotId = (booking.flights as { pilot_user_id: string } | null)
      ?.pilot_user_id;
    if (!pilotId) return { error: "Pilot not found." };

    const communication = parseRating(input.communicationRating);
    const accuracy = parseRating(input.accuracyRating);
    const experience = parseRating(input.experienceRating);
    if (!communication || !accuracy || !experience) {
      return { error: "Please provide valid star ratings (1-5)." };
    }

    const rating = Math.min(
      5,
      Math.max(1, Math.round((communication + accuracy + experience) / 3)),
    );

    const commentTrimmed = normalizeComment(input.comment);
    const needsComment = [communication, accuracy, experience].some((r) => r <= 3);
    if (needsComment && commentTrimmed.length === 0) {
      return {
        error: "Comment is required when any category is rated 3 or below.",
      };
    }

    const commentToStore = commentTrimmed.length > 0 ? commentTrimmed : null;

    const { error: insertErr } = await admin.from("pilot_reviews").insert({
      booking_id: bookingId,
      pilot_user_id: pilotId,
      reviewer_user_id: user.id,
      rating,
      communication_rating: communication,
      accuracy_rating: accuracy,
      experience_rating: experience,
      comment: commentToStore,
      is_visible: false,
    });

    // Unique violation (one review per booking) means the user already submitted.
    if (insertErr) {
      if (insertErr.code === "23505") {
        return { error: "You already submitted — waiting for reveal." };
      }
      return { error: insertErr.message };
    }

    // Reveal if the other side already submitted.
    const { data: passengerReview } = await admin
      .from("passenger_reviews")
      .select("booking_id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (passengerReview) {
      const revealErr = await revealBookingReviews(admin, bookingId);
      if (revealErr) {
        return {
          error:
            "Review saved but could not be revealed yet. Please refresh shortly.",
        };
      }
    }

    // Update cached SSR pages.
    revalidatePath("/passenger/reviews");
    revalidatePath(`/passenger/reviews/${bookingId}`);
    revalidatePath(`/pilots/${pilotId}`);
    revalidatePath("/pilot/earnings");
    revalidatePath("/pilot/reviews");
    revalidatePath(`/flights/${booking.flight_id}`);
    revalidatePath("/flights");

    return { success: "Review submitted." };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Failed to submit pilot review.",
    };
  }
}

export async function submitPassengerReview(
  bookingId: string,
  input: {
    accuracyRating: unknown;
    behaviorRating: unknown;
    weightAccuracyRating: unknown;
    comment?: unknown;
  },
): Promise<ReviewActionState> {
  try {
    if (!isValidUuid(bookingId)) return { error: "Invalid ID" };
    const { user } = await requirePilot();
    const admin = createAdminClient();

    const { data: booking, error: bookingErr } = await admin
      .from("flight_booking_requests")
      .select(
        "id, status, passenger_user_id, review_deadline_at, flight_id, flights!inner(pilot_user_id)",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr) {
      return { error: bookingErr.message };
    }
    if (!booking) {
      return { error: "Booking not found." };
    }

    const pilotId = (booking.flights as { pilot_user_id: string } | null)
      ?.pilot_user_id;
    if (!pilotId) return { error: "Pilot not found." };
    if (pilotId !== user.id) {
      return { error: "Not your flight/pilot booking." };
    }

    if (booking.status !== "completed") {
      return { error: "Flight is not completed yet." };
    }

    const deadlineAt = booking.review_deadline_at as string | null;
    if (!deadlineAt) {
      return { error: "Review deadline not set. Please try later." };
    }
    if (new Date().toISOString() > deadlineAt) {
      return { error: "Review period expired." };
    }

    const passengerId = booking.passenger_user_id as string;
    if (!passengerId) return { error: "Passenger not found." };

    const accuracy = parseRating(input.accuracyRating);
    const behavior = parseRating(input.behaviorRating);
    const weightAccuracy = parseRating(input.weightAccuracyRating);
    if (!accuracy || !behavior || !weightAccuracy) {
      return { error: "Please provide valid star ratings (1-5)." };
    }

    const rating = Math.min(
      5,
      Math.max(1, Math.round((accuracy + behavior + weightAccuracy) / 3)),
    );

    const commentTrimmed = normalizeComment(input.comment);
    const needsComment = [accuracy, behavior, weightAccuracy].some((r) => r <= 3);
    if (needsComment && commentTrimmed.length === 0) {
      return {
        error: "Comment is required when any category is rated 3 or below.",
      };
    }

    const commentToStore = commentTrimmed.length > 0 ? commentTrimmed : null;

    const { error: insertErr } = await admin.from("passenger_reviews").insert({
      booking_id: bookingId,
      pilot_user_id: user.id,
      passenger_user_id: passengerId,
      accuracy_rating: accuracy,
      behavior_rating: behavior,
      weight_accuracy_rating: weightAccuracy,
      rating,
      comment: commentToStore,
      is_visible: false,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return { error: "You already submitted — waiting for reveal." };
      }
      return { error: insertErr.message };
    }

    // Reveal if the passenger already submitted their pilot review.
    const { data: pilotReview } = await admin
      .from("pilot_reviews")
      .select("booking_id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (pilotReview) {
      const revealErr = await revealBookingReviews(admin, bookingId);
      if (revealErr) {
        return {
          error:
            "Review saved but could not be revealed yet. Please refresh shortly.",
        };
      }
    }

    revalidatePath("/pilot/earnings");
    revalidatePath("/pilot/reviews");
    revalidatePath(`/pilot/bookings/${bookingId}/review`);
    revalidatePath(`/pilots/${user.id}`);
    revalidatePath("/passenger/reviews");
    revalidatePath("/passenger/profile");
    revalidatePath(`/flights/${booking.flight_id}`);
    revalidatePath("/flights");

    return { success: "Review submitted." };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Failed to submit passenger review.",
    };
  }
}

