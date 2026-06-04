import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createAdminClient } from "../_shared/supabase.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);
  if (aBuf.length !== bBuf.length) return false;
  let diff = 0;
  for (let i = 0; i < aBuf.length; i++) {
    diff |= aBuf[i] ^ bBuf[i];
  }
  return diff === 0;
}

async function computeHmacHex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return toHex(mac);
}

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [
        k,
        shortenFloats(v),
      ]),
    );
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data);
  }
  return data;
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as object).sort().reduce((acc, key) => {
      (acc as Record<string, unknown>)[key] = sortKeys(
        (obj as Record<string, unknown>)[key],
      );
      return acc;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

function isTimestampFresh(timestampHeader: string): boolean {
  const ts = parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= 300;
}

async function verifySignatureV2(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  timestampHeader: string,
  secret: string,
): Promise<boolean> {
  if (!isTimestampFresh(timestampHeader)) return false;

  const canonical = JSON.stringify(sortKeys(shortenFloats(jsonBody)));
  const expected = await computeHmacHex(canonical, secret);
  return timingSafeEqualStrings(expected, signatureHeader);
}

async function verifySignatureSimple(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  timestampHeader: string,
  secret: string,
): Promise<boolean> {
  if (!isTimestampFresh(timestampHeader)) return false;

  const canonical = [
    jsonBody.timestamp ?? "",
    jsonBody.session_id ?? "",
    jsonBody.status ?? "",
    jsonBody.webhook_type ?? "",
  ].join(":");
  const expected = await computeHmacHex(String(canonical), secret);
  return timingSafeEqualStrings(expected, signatureHeader);
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const rawBody = await req.text();

  const secret = Deno.env.get("DIDIT_WEBHOOK_SECRET");
  if (!secret) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 503,
      headers: JSON_HEADERS,
    });
  }

  const timestamp = req.headers.get("x-timestamp");
  const signatureV2 = req.headers.get("x-signature-v2");
  const signatureSimple = req.headers.get("x-signature-simple");

  if (!timestamp) {
    return new Response(JSON.stringify({ error: "Missing required headers" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const body = JSON.parse(rawBody) as Record<string, unknown>;

  let valid = false;
  if (signatureV2) {
    valid = await verifySignatureV2(body, signatureV2, timestamp, secret);
  }
  if (!valid && signatureSimple) {
    valid = await verifySignatureSimple(body, signatureSimple, timestamp, secret);
  }
  if (!valid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const sessionId = body.session_id as string | undefined;
  const userId = (body.vendor_data ?? body.user_id) as string | undefined;
  const status = String(body.status ?? "").toLowerCase();

  if (!sessionId || !userId) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const admin = createAdminClient();

  await admin
    .from("verification_requests")
    .update({ didit_status: status })
    .eq("didit_session_id", sessionId);

  const approved =
    status === "approved" || status === "verified" || status === "passed";

  if (approved) {
    await admin
      .from("verification_requests")
      .update({ auto_approved: true })
      .eq("didit_session_id", sessionId);

    const { data: vr } = await admin
      .from("verification_requests")
      .select("requested_role")
      .eq("didit_session_id", sessionId)
      .maybeSingle();

    const role = vr?.requested_role ?? "passenger";

    if (role === "pilot") {
      const { data: pilotProfile } = await admin
        .from("pilot_profiles")
        .select("onboarding_draft")
        .eq("user_id", userId)
        .maybeSingle();

      const rawDraft = pilotProfile?.onboarding_draft;
      const draft =
        rawDraft && typeof rawDraft === "object" && !Array.isArray(rawDraft)
          ? { ...(rawDraft as Record<string, unknown>) }
          : {};

      await admin.from("pilot_profiles").upsert({
        user_id: userId,
        onboarding_step: 3,
        onboarding_draft: { ...draft, diditKycApproved: true },
      });

      await admin
        .from("profiles")
        .update({ role: "pilot" })
        .eq("id", userId);
    } else {
      await admin
        .from("profiles")
        .update({ status: "verified", role: "passenger" })
        .eq("id", userId);
    }
  }

  await admin.from("notification_queue").insert({
    user_id: userId,
    type: "kyc_result",
    payload: { sessionId, status, approved },
  });

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
});
