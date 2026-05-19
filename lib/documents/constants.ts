import type { DocumentType } from "@/lib/types/profile";

export const BUCKET_BY_TYPE: Record<DocumentType, string> = {
  id_card: "identity-documents",
  ppl_license: "pilot-documents",
  medical_certificate: "pilot-documents",
  airfield_operating_license: "airfield-documents",
};
