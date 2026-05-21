import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAdminClient } from "../_shared/supabase.ts";
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
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[process-notifications] fetch error:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const notification of notifications ?? []) {
    const userResult = await supabase.auth.admin.getUserById(notification.user_id);
    const email = userResult.data.user?.email;

    if (!email) {
      console.warn(`[process-notifications] no email for user ${notification.user_id}`);
      failed += 1;
      continue;
    }

    const payload = notification.payload as Record<string, unknown>;

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", notification.user_id)
      .single();

    const displayName =
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : email.split("@")[0];

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

      default:
        console.warn(`[process-notifications] unknown type: ${notification.type}`);
        failed += 1;
        continue;
    }

    const result = await sendEmail({ to: email, subject, html });

    if (result.ok) {
      await supabase
        .from("notification_queue")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", notification.id);
      sent += 1;
    } else {
      console.error(`[process-notifications] send failed for ${notification.id}:`, result.error);
      failed += 1;
    }
  }

  console.log(`[process-notifications] done: sent=${sent} failed=${failed}`);
  return new Response(JSON.stringify({ ok: true, sent, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
