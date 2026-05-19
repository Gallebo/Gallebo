import { createAdminClient } from "@/lib/supabase/admin";
import { renderApprovalEmail } from "@/lib/resend/templates/approval";
import { renderExpiryWarningEmail } from "@/lib/resend/templates/expiry-warning";
import { renderRejectionEmail } from "@/lib/resend/templates/rejection";

export type EmailPayload = {
  to: string;
  subject: string;
  body: Record<string, unknown>;
  notificationId?: string;
};

async function logAndMarkSent(
  payload: EmailPayload,
  label: string,
  htmlPreview?: string
) {
  console.log(`[RESEND STUB] ${label}:`, payload, htmlPreview ?? "");

  if (payload.notificationId) {
    const admin = createAdminClient();
    await admin
      .from("notification_queue")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", payload.notificationId);
  }
}

export async function sendApprovalEmail(payload: EmailPayload) {
  const html = renderApprovalEmail({
    displayName: String(payload.body.displayName ?? "there"),
  });
  await logAndMarkSent(payload, "approval", html);
}

export async function sendRejectionEmail(payload: EmailPayload) {
  const html = renderRejectionEmail({
    displayName: String(payload.body.displayName ?? "there"),
    reason: String(payload.body.reason ?? ""),
  });
  await logAndMarkSent(payload, "rejection", html);
}

export async function sendExpiryWarning(payload: EmailPayload) {
  const html = renderExpiryWarningEmail({
    displayName: String(payload.body.displayName ?? "there"),
    daysRemaining: Number(payload.body.daysRemaining ?? 0),
    documentLabel: String(payload.body.documentLabel ?? "document"),
  });
  await logAndMarkSent(payload, "expiry_warning", html);
}
