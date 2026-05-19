/** Stub HTML for future React Email / Resend — do not send until domain is verified. */
export function renderApprovalEmail(params: { displayName: string }): string {
  const name = escapeHtml(params.displayName);
  return `<!DOCTYPE html><html><body><p>Hello ${name},</p><p>Your Gallebo verification request was <strong>approved</strong>.</p><p>You can sign in and continue using the platform.</p></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
