-- Migration: claim_invitation RPC
-- Allows new users to claim an invite token, creating their user_role
-- and marking the invitation as claimed. Runs as SECURITY DEFINER because
-- new users have no role yet, so RLS on user_roles blocks direct inserts.

CREATE OR REPLACE FUNCTION claim_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
  v_existing_role record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user already has a role (idempotent — don't double-assign)
  SELECT * INTO v_existing_role FROM user_roles WHERE user_id = v_user_id LIMIT 1;
  IF v_existing_role IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'role', v_existing_role.role);
  END IF;

  -- Look up the invitation
  SELECT * INTO v_invitation FROM invitations
    WHERE token = p_token AND status = 'pending';

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already claimed invitation');
  END IF;

  -- Check expiry
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  -- Create user_role for parent
  INSERT INTO user_roles (user_id, role, family_id)
    VALUES (v_user_id, 'parent', v_invitation.family_id);

  -- Mark invitation as claimed
  UPDATE invitations SET
    status = 'claimed',
    claimed_by = v_user_id,
    claimed_at = now()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'family_id', v_invitation.family_id);
END;
$$;

-- Also add notification_preferences column to families for session reminder settings
ALTER TABLE families ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"session_reminders": "first_week_and_privates"}'::jsonb;
