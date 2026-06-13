-- Latest open verification request per user (admin KYC queue dedup).
CREATE OR REPLACE VIEW open_verification_requests_deduped AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  requested_role,
  created_at,
  submitted_at,
  didit_status,
  auto_approved,
  reviewed_at,
  rejection_reason
FROM verification_requests
WHERE reviewed_at IS NULL
ORDER BY user_id, created_at DESC;
