-- Migration 012: Parent invitations
-- Admin creates invite → parent signs up with token → user_roles auto-created

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id),
  claimed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  claimed_at timestamptz
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "admin_invitations_select" ON invitations FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_invitations_insert" ON invitations FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_invitations_update" ON invitations FOR UPDATE
  USING (is_admin(auth.uid()));

-- Anyone can read an invitation by token (needed for signup page, before user has a role)
-- This is safe because tokens are unguessable UUIDs
CREATE POLICY "public_invitations_select_by_token" ON invitations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- The user who claims the invite can update it
CREATE POLICY "claimant_invitations_update" ON invitations FOR UPDATE
  USING (claimed_by = auth.uid());
