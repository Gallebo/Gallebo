"use server";

import { revalidatePath } from "next/cache";

import { createAlertSchema } from "@/lib/alerts/schemas";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export type AlertActionState = {
  error?: string;
  success?: string;
};

export async function createAlertAction(
  _prev: AlertActionState,
  formData: FormData,
): Promise<AlertActionState> {
  try {
    const { user } = await requireVerifiedPassenger();

    const parsed = createAlertSchema.safeParse({
      departureMode: formData.get("departureMode"),
      arrivalMode: formData.get("arrivalMode"),
      departureAirfieldId: formData.get("departureAirfieldId") || undefined,
      departureCountry: formData.get("departureCountry") || undefined,
      arrivalAirfieldId: formData.get("arrivalAirfieldId") || undefined,
      arrivalCountry: formData.get("arrivalCountry") || undefined,
      dateFrom: formData.get("dateFrom"),
      dateTo: formData.get("dateTo"),
      flightType: formData.get("flightType") || "all",
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid alert data",
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const { error } = await supabase.from("flight_alerts").insert({
      passenger_user_id: user.id,
      departure_airfield_id:
        data.departureMode === "airfield" ? data.departureAirfieldId! : null,
      departure_country:
        data.departureMode === "country" ? data.departureCountry! : null,
      arrival_airfield_id:
        data.arrivalMode === "airfield" ? data.arrivalAirfieldId! : null,
      arrival_country:
        data.arrivalMode === "country" ? data.arrivalCountry! : null,
      date_from: data.dateFrom,
      date_to: data.dateTo,
      flight_type: data.flightType === "all" ? null : data.flightType,
    });

    if (error) return { error: error.message };

    revalidatePath("/passenger/alerts");
    return { success: "Alert created — we'll notify you when a matching flight is published." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to create alert",
    };
  }
}

export async function extendAlertAction(alertId: string): Promise<AlertActionState> {
  try {
    await requireVerifiedPassenger();
    const supabase = await createClient();

    const { error } = await supabase.rpc("extend_flight_alert", {
      p_alert_id: alertId,
    });

    if (error) return { error: error.message };

    revalidatePath("/passenger/alerts");
    return { success: "Alert extended for 15 more days." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to extend alert",
    };
  }
}

export async function deleteAlertAction(alertId: string): Promise<AlertActionState> {
  try {
    await requireVerifiedPassenger();
    const supabase = await createClient();

    const { error } = await supabase.rpc("deactivate_flight_alert", {
      p_alert_id: alertId,
    });

    if (error) return { error: error.message };

    revalidatePath("/passenger/alerts");
    return { success: "Alert removed." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete alert",
    };
  }
}

/** Pilot-only: waiting passengers for route when publishing */
export async function getPilotWaitingPassengersCountAction(input: {
  departureAirfieldId: string;
  arrivalAirfieldId: string;
  flightDate: string;
  flightType?: string;
}): Promise<{ count: number }> {
  try {
    const { requirePilot } = await import("@/lib/auth/rbac");
    await requirePilot();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "count_waiting_passengers_for_route",
      {
        p_departure: input.departureAirfieldId,
        p_arrival: input.arrivalAirfieldId,
        p_date: input.flightDate,
        p_flight_type: input.flightType ?? null,
      },
    );

    if (error) {
      console.error("[getPilotWaitingPassengersCountAction]", error.message);
      return { count: 0 };
    }

    return { count: Number(data ?? 0) };
  } catch {
    return { count: 0 };
  }
}
