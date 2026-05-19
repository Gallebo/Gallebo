export function renderRejectionEmail(params: {
  displayName: string;
  reason: string;
}): string {
  const name = escapeHtml(params.displayName);
  const reason = escapeHtml(params.reason);
  return `<!DOCTYPE html><html><body><p>Hello ${name},</p><p>Your Gallebo verification request was <strong>not approved</strong>.</p><p>Reason: ${reason}</p><p>You may submit a new request from your dashboard.</p></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
