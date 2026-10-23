-- Operator-only statement, NEVER a retry or automatic reconciliation.
-- Preconditions: exact Resend receipt/body/recipient checked, evidence recorded,
-- and an explicitly authorized intervention on the identified database.
-- $1 invitation UUID; $2 space UUID; $3/$4 exact timestamp snapshots (text,
-- retaining PostgreSQL microseconds). A zero-row result means STOP/re-read.
UPDATE space_invitations
SET delivery_status = 'sent',
    delivery_lease = NULL,
    lease_until = NULL,
    last_error = NULL
WHERE id = $1::uuid
  AND space_id = $2::uuid
  AND status = 'pending'
  AND delivery_status = 'uncertain'
  AND expires_at > now()
  AND (lease_until IS NULL OR lease_until < now())
  AND first_attempt_at = $3::timestamptz
  AND last_attempt_at = $4::timestamptz
RETURNING id;
