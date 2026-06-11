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
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>You're verified — welcome to Gallebo.</p><p>Your account is ready. <a href="https://gallebo.app/flights">Browse open flights</a> and book your first seat.</p></body></html>`;
}

function renderRejection(name: string, reason: string): string {
  const n = escapeHtml(name);
  const r = escapeHtml(reason);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your verification wasn't approved this time.</p><p>Reason: ${r}</p><p>You can submit a new request from your <a href="https://gallebo.app/dashboard">dashboard</a>.</p></body></html>`;
}

function renderAirfieldApproved(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your airfield access is <strong>approved</strong>.</p><p>You can now manage your airfield profile, photos, and notices on Gallebo. <a href="https://gallebo.app/airfield">Open your airfield dashboard</a>.</p></body></html>`;
}

function renderAirfieldRejected(name: string, reason: string): string {
  const n = escapeHtml(name);
  const r = escapeHtml(reason);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your airfield access request wasn't approved.</p><p>Reason: ${r}</p><p>You can submit a new request from your <a href="https://gallebo.app/dashboard">dashboard</a>.</p></body></html>`;
}

function renderSuspended(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your pilot account has been <strong>suspended</strong>.</p><p>This is usually caused by expired documents. Upload your renewed documents in Gallebo to restore full access.</p><p><a href="https://gallebo.app/onboarding/pilot">Upload documents</a></p></body></html>`;
}

function renderKycResult(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your identity is verified — you now have full access to Gallebo.</p><p><a href="https://gallebo.app/flights">Browse open flights</a></p></body></html>`;
}

function renderKycRejection(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your identity verification wasn't successful.</p><p>Please <a href="mailto:support@gallebo.app">contact support</a> and we'll help you resolve it.</p></body></html>`;
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
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>The pilot cancelled flight <strong>${escapeHtml(flightId)}</strong>. Your refund will be processed automatically within 5 business days.</p><p><a href="https://gallebo.app/flights">Browse other flights</a></p></body></html>`;
}

function renderBookingRequestReceived(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>You have a new booking request for flight <strong>${escapeHtml(flightId)}</strong>.</p><p>Accept or decline within 48 hours — after that, the request expires automatically.</p><p><a href="https://gallebo.app/pilot/bookings">Review the request</a></p></body></html>`;
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
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>The pilot couldn't accept your request for flight <strong>${escapeHtml(flightId)}</strong> this time.</p><p>There are other flights waiting. <a href="https://gallebo.app/flights">Browse open seats</a></p></body></html>`;
}

function renderBookingExpired(name: string, flightId: string, reason: string): string {
  const n = escapeHtml(name);
  const r = escapeHtml(reason);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your seat reservation for flight <strong>${escapeHtml(flightId)}</strong> has expired (${r}).</p><p>Your payment has not been charged. <a href="https://gallebo.app/flights">Find another flight</a></p></body></html>`;
}

function renderPaymentConfirmed(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your seat on flight <strong>${escapeHtml(flightId)}</strong> is confirmed. Payment received.</p><p>Your contact details with the pilot are now unlocked in your booking. We'll send a reminder 24 hours before departure.</p><p><a href="https://gallebo.app/dashboard/bookings">View booking</a></p></body></html>`;
}

function renderFlightCompleted(name: string, flightId: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Flight <strong>${escapeHtml(flightId)}</strong> is complete. Hope it was a great one.</p><p>Leave a review — it helps other passengers choose great pilots.</p><p><a href="https://gallebo.app/dashboard/bookings">Leave a review</a></p></body></html>`;
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
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>A flight you've been waiting for just opened up. Seats fill fast.</p><p><a href="https://gallebo.app/flights/${escapeHtml(flightId)}">View the flight →</a></p></body></html>`;
}

function renderFlightAlertExpiryWarning(name: string): string {
  const n = escapeHtml(name);
  return `<!DOCTYPE html><html><body><p>Hello ${n},</p><p>Your route alert expires tomorrow. Renew it in one tap to keep getting notified when pilots post matching flights.</p><p><a href="https://gallebo.app/passenger/alerts">Renew alert</a></p></body></html>`;
}

function renderPilotUpgradeSubmitted(
  passengerName: string,
  requestId: string,
): string {
  const name = escapeHtml(passengerName);
  const id = escapeHtml(requestId);
  return `<!DOCTYPE html><html><body><p>A verified passenger submitted a <strong>pilot upgrade</strong> request.</p><p>Passenger: <strong>${name}</strong></p><p><a href="https://gallebo.app/admin/verifications/${id}">Review in admin</a></p></body></html>`;
}

function notificationDeepLink(
  type: string,
  payload: Record<string, unknown>,
): string {
  const bookingId = payload.bookingId;
  const flightId = payload.flightId;
  const requestId = payload.requestId;
  if (type === "pilot_upgrade_submitted" && typeof requestId === "string") {
    return `https://gallebo.app/admin/verifications/${requestId}`;
  }
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
        subject = "You're verified — welcome to Gallebo";
        html = renderApproval(displayName);
        break;

      case "verification_rejected":
        subject = "Action needed: your verification wasn't approved";
        html = renderRejection(displayName, String(payload.reason ?? ""));
        break;

      case "airfield_approved":
        subject = "Airfield access approved — you're ready";
        html = renderAirfieldApproved(displayName);
        break;

      case "airfield_rejected":
        subject = "Your airfield access request wasn't approved";
        html = renderAirfieldRejected(displayName, String(payload.reason ?? ""));
        break;

      case "pilot_suspended":
        subject = "Your pilot account has been suspended";
        html = renderSuspended(displayName);
        break;

      case "kyc_result":
        if (payload.approved !== true) {
          subject = "Identity verification unsuccessful — we can help";
          html = renderKycRejection(displayName);
        } else {
          subject = "Identity verified — you're all set";
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
        subject = "Flight cancelled — your refund is on the way";
        html = renderFlightCancelled(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "booking_request_received": {
        subject = "New booking request — respond within 48 hours";
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
        subject = "Your booking wasn't accepted — other flights are open";
        html = renderBookingRejected(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "booking_expired_no_response": {
        subject = "Your seat reservation expired";
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
        subject = "How was your flight? Leave a review";
        html = renderFlightCompleted(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "booking_cancelled_by_pilot": {
        subject = "Flight cancelled by pilot — refund incoming";
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
        subject = "Tomorrow: your flight departs in about 24 hours";
        html = renderFlightReminder24h(
          displayName,
          String(payload.flightId ?? ""),
          String(payload.flightDate ?? ""),
          String(payload.departureTime ?? "").slice(0, 5),
        );
        break;
      }

      case "flight_alert_match": {
        subject = "A flight you've been waiting for just opened up";
        html = renderFlightAlertMatch(
          displayName,
          String(payload.flightId ?? ""),
        );
        break;
      }

      case "flight_alert_expiry_warning": {
        subject = "Your route alert expires tomorrow — renew in one tap";
        html = renderFlightAlertExpiryWarning(displayName);
        break;
      }

      case "pilot_upgrade_submitted": {
        subject = "Gallebo: pilot upgrade request pending review";
        html = renderPilotUpgradeSubmitted(
          displayName,
          String(payload.requestId ?? ""),
        );
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

    const isAdminPilotUpgrade = notification.type === "pilot_upgrade_submitted";
    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "admin@test.ai";
    const recipientEmail = isAdminPilotUpgrade ? adminEmail : email;

    let emailOk = false;

    if (isAdminPilotUpgrade || emailEnabled) {
      if (!recipientEmail) {
        console.warn(
          `[process-notifications] no email for user ${notification.user_id}`,
        );
        await markNotificationFailed(supabase, notification.id, true);
        failed += 1;
        continue;
      }

      const emailLimit = await checkRateLimit(
        `email:${isAdminPilotUpgrade ? "admin" : notification.user_id}`,
        10,
        3600,
      );
      if (!emailLimit.allowed) {
        console.log(
          `[process-notifications] email rate limit, deferring notification.id=${notification.id}`,
        );
        emailOk = false;
      } else {
      const result = await sendEmail({ to: recipientEmail, subject, html });
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

    if (pushEnabled && !isAdminPilotUpgrade) {
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
