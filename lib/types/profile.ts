import type { Enums, Tables } from "@/types/database";

export type UserStatus = Enums<"user_status">;
export type UserRole = Enums<"user_role">;
export type DocumentType = Enums<"document_type">;
export type DocReviewStatus = Enums<"doc_review_status">;

export type Profile = Tables<"profiles">;
export type ProfileSummary = Pick<
  Profile,
  "id" | "role" | "status" | "first_name" | "last_name"
>;
export type PilotProfile = Tables<"pilot_profiles">;
export type Document = Tables<"documents">;
export type VerificationRequest = Tables<"verification_requests">;
