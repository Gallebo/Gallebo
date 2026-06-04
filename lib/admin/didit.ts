const DIDIT_APPROVED = new Set(["approved", "verified", "passed"]);

export function isDiditApproved(status: string | null | undefined): boolean {
  return DIDIT_APPROVED.has(String(status ?? "").toLowerCase());
}

export function formatDiditStatus(status: string | null | undefined): string {
  if (!status) return "Not started";
  return status.replace(/_/g, " ");
}

const PILOT_REVIEW_DOC_TYPES = new Set([
  "ppl_license",
  "lapl_license",
  "medical_certificate",
]);

export function isPilotProfessionalDocument(type: string): boolean {
  return PILOT_REVIEW_DOC_TYPES.has(type);
}

export function adminDocumentLinkLabel(type: string): string {
  if (type === "ppl_license") return "View ppl_license";
  if (type === "lapl_license") return "View lapl_license";
  if (type === "medical_certificate") return "View medical_certificate";
  return `View ${type}`;
}
