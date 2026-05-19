export function renderExpiryWarningEmail(params: {
  displayName: string;
  daysRemaining: number;
  documentLabel: string;
}): string {
  const name = escapeHtml(params.displayName);
  const label = escapeHtml(params.documentLabel);
  return `<!DOCTYPE html><html><body><p>Hello ${name},</p><p>Your <strong>${label}</strong> expires in <strong>${params.daysRemaining}</strong> day(s). Please upload renewed documents in Gallebo to stay verified.</p></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
