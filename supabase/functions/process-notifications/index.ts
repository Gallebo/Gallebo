import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { sendPushToUser } from "../_shared/push.ts";
import { sendEmail } from "../_shared/resend.ts";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderApproval(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your Gallebo verification request was <strong>approved</strong>.</p><p>You can sign in and continue using the platform.</p></body></html>`;
}

function renderRejection(name: string, reason: string): string {
  const n = escapeHtml(name);
  const r = escapeHtml(reason);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your Gallebo verification request was <strong>not approved</strong>.</p><p>Reason: ${r}</p><p>You may submit a new request from your dashboard.</p></body></html>`;
}

function renderAirfieldApproved(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your airfield access request has been <strong>approved</strong>.</p><p>You can now access the airfield services on Gallebo.</p></body></html>`;
}

function renderAirfieldRejected(name: string, reason: string): string {
  const n = escapeHtml(name);
  const r = escapeHtml(reason);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your airfield access request was <strong>not approved</strong>.</p><p>Reason: ${r}</p><p>You may submit a new request from your dashboard.</p></body></html>`;
}

function renderSuspended(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your Gallebo pilot account has been <strong>suspended</strong>.</p><p>This is typically due to expired documents. Please upload renewed documents to restore access.</p></body></html>`;
}

function renderKycResult(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your Gallebo identity verification (KYC) was <strong>approved</strong>.</p><p>You now have full access to the platform.</p></body></html>`;
}

function renderKycRejection(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your Gallebo identity verification (KYC) was <strong>not approved</strong>.</p><p>Please contact support for more information.</p></body></html>`;
}

function renderExpiryWarning(name: string, days: number, label: string): string {
  const n = escapeHtml(name);
  const l = escapeHtml(label);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your <strong>${l}</strong> expires in <strong>${days}</strong> day(s). Please upload renewed documents in Gallebo to stay verified.</p></body></html>`;
}

function renderFlightPriceDeviation(
  name: string,
  flightId: string,
  price: string,
  avg: string,
): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>A pilot published flight <strong>${escapeHtml(flightId)}</strong> with a per-passenger price of <strong>€${escapeHtml(price)}</strong>, which differs significantly from the route average (€${escapeHtml(avg)}).</p><p>Please review in the admin dashboard.</p></body></html>`;
}

function renderFlightCancelled(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>The flight you requested (<strong>${escapeHtml(flightId)}</strong>) has been <strong>cancelled</strong> by the pilot.</p><p>You can browse other available flights on Gallebo.</p></body></html>`;
}

function renderBookingRequestReceived(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>You have a new <strong>booking request</strong> for flight <strong>${escapeHtml(flightId)}</strong>.</p><p>Please accept or reject within 48 hours in your pilot dashboard.</p></body></html>`;
}

function renderBookingAccepted(
  name: string,
  flightId: string,
  amount: string,
  expires: string,
): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your booking for flight <strong>${escapeHtml(flightId)}</strong> was <strong>accepted</strong>.</p><p>Pay <strong>€${escapeHtml(amount)}</strong> (incl. 4% platform fee) within 30 minutes: <a href="https://gallebo.app/dashboard/bookings">My bookings</a>.</p><p>Payment deadline: ${escapeHtml(expires)}</p></body></html>`;
}

function renderBookingRejected(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your booking request for flight <strong>${escapeHtml(flightId)}</strong> was <strong>not accepted</strong> by the pilot.</p></body></html>`;
}

function renderBookingExpired(name: string, flightId: string, reason: string): string {
  const n = escapeHtml(name);
  const r = escapeHtml(reason);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your booking for flight <strong>${escapeHtml(flightId)}</strong> has <strong>expired</strong> (${r}).</p></body></html>`;
}

function renderPaymentConfirmed(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Payment for flight <strong>${escapeHtml(flightId)}</strong> is <strong>confirmed</strong>. Your seat is booked.</p></body></html>`;
}

function renderFlightCompleted(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Flight <strong>${escapeHtml(flightId)}</strong> was marked <strong>completed</strong>. Thank you for flying with Gallebo.</p></body></html>`;
}

function renderBookingCancelledByPilot(
  name: string,
  flightId: string,
  refundFull: boolean,
): string {
  const n = escapeHtml(name);
  const refund = refundFull
    ? "A full refund will be processed."
    : "See your booking for refund details.";
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your booking for flight <strong>${escapeHtml(flightId)}</strong> was <strong>cancelled by the pilot</strong>. ${refund}</p></body></html>`;
}

function renderBookingCancelledByPassenger(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>A passenger cancelled their booking for flight <strong>${escapeHtml(flightId)}</strong>.</p></body></html>`;
}

function renderPayoutSent(name: string, amount: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>A payout of <strong>€${escapeHtml(amount)}</strong> was sent to your registered IBAN.</p></body></html>`;
}

function renderFlightReminder24h(
  name: string,
  flightId: string,
  flightDate: string,
  departureTime: string,
): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Reminder: your flight <strong>${escapeHtml(flightId)}</strong> on <strong>${escapeHtml(flightDate)}</strong> departs at <strong>${escapeHtml(departureTime)}</strong> (about 24 hours from now).</p><p><a href="https://gallebo.app/dashboard/bookings">View bookings</a></p></body></html>`;
}

function renderFlightAlertMatch(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>A pilot published a flight that matches your <strong>route alert</strong>.</p><p><a href="https://gallebo.app/flights/${escapeHtml(flightId)}">View flight</a></p></body></html>`;
}

function renderFlightAlertExpiryWarning(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your flight alert <strong>expires tomorrow</strong>.</p><p><a href="https://gallebo.app/passenger/alerts">Extend alert with one click</a></p></body></html>`;
}

function notificationDeepLink(
  type: string,
  payload: Record<string, unknown>,
): string {
  const bookingId = payload.bookingId;
  const flightId = payload.flightId;
  if (type === "flight_alert_expiry_warning") {
    return "https://gallebo.app/passenger/alerts";
  }
  if (typeof bookingId === "string") {
    return payload.role === "pilot"
      ? `https://gallebo.app/pilot/bookings#booking-${bookingId}`
      : `https://gallebo.app/dashboard/bookings#booking-${bookingId}`;
  }
  if (typeof flightId === "string") {
    return `https://gallebo.app/flights/${flightId}`;
  }
  return "https://gallebo.app/dashboard";
}

const MAX_NOTIFICATION_RETRIES = 3;

async function markNotificationFailed(
  supabase: ReturnType<typeof createAdminClient>,
  notificationId: string,
  immediate = false,
): Promise<void> {
  if (immediate) {
    await supabase
      .from("notification_queue")
      .update({
        retry_count: MAX_NOTIFICATION_RETRIES,
        failed_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
    return;
  }

  const { data: current } = await supabase
    .from("notification_queue")
    .select("retry_count")
    .eq("id", notificationId)
    .single();

  const retries = (current?.retry_count ?? 0) + 1;
  const update =
    retries >= MAX_NOTIFICATION_RETRIES
      ? { retry_count: retries, failed_at: new Date().toISOString() }
      : { retry_count: retries };

  await supabase.from("notification_queue").update(update).eq("id", notificationId);
}

serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createAdminClient();

  const { data: notifications, error } = await supabase
    .from("notification_queue")
    .select("*")
    .is("sent_at", null)
    .is("failed_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[process-notifications] fetch error:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!notifications?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0, failed: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userIds = [...new Set(notifications.map((n) => n.user_id))];

  const emailById = new Map<string, string | null>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data, error: userError } = await supabase.auth.admin.getUserById(id);
      if (userError) {
        console.error(
          `[process-notifications] getUserById failed for ${id}:`,
          userError.message,
        );
        emailById.set(id, null);
        return;
      }
      emailById.set(id, data.user?.email ?? null);
    }),
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: allSettings } = await supabase
    .from("user_notification_settings")
    .select("user_id, email_enabled, push_enabled")
    .in("user_id", userIds);

  const settingsByUser = new Map(
    (allSettings ?? []).map((s) => [s.user_id, s]),
  );

  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const email = emailById.get(notification.user_id) ?? null;
    const userSettings = settingsByUser.get(notification.user_id);
    const emailEnabled = userSettings?.email_enabled !== false;
    const pushEnabled = userSettings?.push_enabled !== false;

    const payload = notification.payload as Record<string, unknown>;

    const profile = profileById.get(notification.user_id);

    const displayName =
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : email
          ? email.split("@")[0]
          : "User";

    let subject = "Gallebo notification";
    let html = "";

    switch (notification.type) {
      case "verification_approved":
        subject = "Your Gallebo verification was approved";
        html = renderApproval(displayName);
        break;

      case "verification_rejected":
        subject = "Your Gallebo verification was not approved";
        html = renderRejection(displayName, String(payload.reason ?? ""));
        break;

      case "airfield_approved":
        subject = "Your airfield access request was approved";
        html = renderAirfieldApproved(displayName);
        break;

      case "airfield_rejected":
        subject = "Your airfield access request was not approved";
        html = renderAirfieldRejected(displayName, String(payload.reason ?? ""));
        break;

      case "pilot_suspended":
        subject = "Your Gallebo pilot account has been suspended";
        html = renderSuspended(displayName);
        break;

      case "kyc_result":
        if (payload.approved !== true) {
          subject = "Your Gallebo identity verification was not approved";
          html = renderKycRejection(displayName);
        } else {
          subject = "Your Gallebo identity verification was approved";
          html = renderKycResult(displayName);
        }
        break;

      case "expiry_warning_3d":
      case "expiry_warning_14d":
      case "expiry_warning_30d": {
        const days = Number(payload.days ?? 0);
        const docLabel = String(payload.documentLabel ?? "document");
        subject = `Gallebo: your ${docLabel} expires in ${days} day(s)`;
        html = renderExpiryWarning(displayName, days, docLabel);
        break;
      }

      case "flight_price_deviation": {
        subject = "Gallebo: flight price deviation alert";
        html = renderFlightPriceDeviation(
          displayName,
          String(payload.flightId ?? ""),
          String(payload.pricePerPassenger ?? ""),
          String(payload.avgPrice ?? ""),
        );
        break;
      }

      case "flight_cancelled": {
        subject = "Your flight booking request was cancelled";
        html = renderFlightCancelled(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "booking_request_received": {
        subject = "New booking request on Gallebo";
        html = renderBookingRequestReceived(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "booking_accepted": {
        subject = "Your booking was accepted — pay within 30 minutes";
        html = renderBookingAccepted(
          displayName,
          String(payload.flightId ?? ""),
          String(payload.passengerAmountEur ?? ""),
          payload.paymentExpiresAt
            ? new Date(String(payload.paymentExpiresAt)).toLocaleString()
            : "30 minutes",
        );
        break;
      }

      case "booking_rejected": {
        subject = "Your booking request was not accepted";
        html = renderBookingRejected(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "booking_expired_no_response": {
        subject = "Your booking has expired";
        html = renderBookingExpired(
          displayName,
          String(payload.flightId ?? ""),
          payload.reason === "payment_timeout"
            ? "payment not received in time"
            : "pilot did not respond in time",
        );
        break;
      }

      case "payment_confirmed": {
        subject = "Payment confirmed — your seat is booked";
        html = renderPaymentConfirmed(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "flight_completed": {
        subject = "Flight completed";
        html = renderFlightCompleted(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "booking_cancelled_by_pilot": {
        subject = "Your booking was cancelled by the pilot";
        html = renderBookingCancelledByPilot(
          displayName,
          String(payload.flightId ?? ""),
          payload.refundFull === true,
        );
        break;
      }

      case "booking_cancelled_by_passenger": {
        subject = "A passenger cancelled their booking";
        html = renderBookingCancelledByPassenger(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "payout_sent": {
        subject = "Payout sent to your IBAN";
        html = renderPayoutSent(
          displayName,
          String(payload.amountEur ?? ""),
        );
        break;
      }

      case "flight_reminder_24h": {
        subject = "Flight reminder — departs in about 24 hours";
        html = renderFlightReminder24h(
          displayName,
          String(payload.flightId ?? ""),
          String(payload.flightDate ?? ""),
          String(payload.departureTime ?? "").slice(0, 5),
        );
        break;
      }

      case "flight_alert_match": {
        subject = "A flight matching your alert was published";
        html = renderFlightAlertMatch(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "flight_alert_expiry_warning": {
        subject = "Your flight alert expires tomorrow";
        html = renderFlightAlertExpiryWarning(displayName);
        break;
      }

      default:
        console.warn(`[process-notifications] unknown type: ${notification.type}`);
        await markNotificationFailed(supabase, notification.id, true);
        failed += 1;
        continue;
    }

    const deepLink = notificationDeepLink(notification.type, payload);
    const pushBody =
      notification.type === "flight_reminder_24h"
        ? `Flight on ${String(payload.flightDate ?? "")} departs in about 24 hours.`
        : subject;

    let emailOk = false;

    if (emailEnabled) {
      if (!email) {
        console.warn(
          `[process-notifications] no email for user ${notification.user_id}`,
        );
        await markNotificationFailed(supabase, notification.id, true);
        failed += 1;
        continue;
      }

      const emailLimit = await checkRateLimit(
        `email:${notification.user_id}`,
        10,
        3600,
      );
      if (!emailLimit.allowed) {
        console.log(
          `[process-notifications] email rate limit, deferring notification.id=${notification.id}`,
        );
        emailOk = false;
      } else {
      const result = await sendEmail({ to: email, subject, html });
      emailOk = result.ok;
      if (!result.ok) {
        console.error(
          `[process-notifications] send failed for ${notification.id}:`,
          result.error,
        );
        await markNotificationFailed(supabase, notification.id);
        failed += 1;
        continue;
      }
      }
    } else {
      emailOk = true;
    }

    if (pushEnabled) {
      await sendPushToUser(supabase, notification.user_id, {
        title: subject,
        body: pushBody,
        url: deepLink,
      });
    }

    if (emailOk) {
      await supabase
        .from("notification_queue")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", notification.id);
      sent += 1;
    }
  }

  console.log(`[process-notifications] done: sent=${sent} failed=${failed}`);
  return new Response(JSON.stringify({ ok: true, sent, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
