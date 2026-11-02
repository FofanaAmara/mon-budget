-- Invitations grant no access until explicit verified-recipient acceptance.
ALTER TABLE user_display_profiles ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
CREATE TABLE space_invitations (
  id uuid PRIMARY KEY,
  space_id uuid NOT NULL REFERENCES financial_spaces(id),
  recipient_email text NOT NULL CHECK(recipient_email=lower(btrim(recipient_email))),
  invited_by text NOT NULL,
  token_nonce text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  origin text NOT NULL,
  space_name_snapshot text NOT NULL,
  inviter_name_snapshot text NOT NULL,
  mail_from text NOT NULL,
  template_version integer NOT NULL DEFAULT 1 CHECK(template_version=1),
  first_attempt_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','expired')),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
  responded_by text,
  responded_at timestamptz,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending','sending','sent','failed','uncertain')),
  delivery_lease uuid,
  lease_until timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(space_id,invited_by) REFERENCES space_memberships(space_id,user_id),
  CHECK((status IN ('accepted','declined'))=(responded_by IS NOT NULL AND responded_at IS NOT NULL))
);
CREATE UNIQUE INDEX space_invitations_pending_email ON space_invitations(space_id,recipient_email) WHERE status='pending';
CREATE INDEX space_invitations_recipient ON space_invitations(recipient_email,status,expires_at);
CREATE INDEX space_invitations_sender_rate ON space_invitations(invited_by,created_at);
CREATE TABLE space_invitation_delivery_attempts (
  id uuid PRIMARY KEY,
  invitation_id uuid NOT NULL REFERENCES space_invitations(id),
  requested_by text NOT NULL,
  lease uuid NOT NULL UNIQUE,
  outcome text NOT NULL DEFAULT 'sending' CHECK(outcome IN ('sending','sent','failed')),
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX space_invitation_attempt_rate ON space_invitation_delivery_attempts(created_at);
CREATE INDEX space_invitation_attempt_target ON space_invitation_delivery_attempts(invitation_id,created_at);
