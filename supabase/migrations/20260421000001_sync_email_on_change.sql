-- Sync auth.users email changes to application profile tables
-- Fires when email change completes (after both confirmations with Secure email change ON)

CREATE OR REPLACE FUNCTION public.sync_auth_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when email actually changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    -- Sync to families.primary_contact for parent users
    UPDATE families
    SET primary_contact = jsonb_set(
      COALESCE(primary_contact, '{}'::jsonb),
      '{email}',
      to_jsonb(NEW.email)
    )
    WHERE id IN (
      SELECT family_id FROM user_roles
      WHERE user_id = NEW.id AND role = 'parent' AND family_id IS NOT NULL
    );

    -- Sync to coaches.email for coach users
    UPDATE coaches
    SET email = NEW.email
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users email column update
CREATE TRIGGER on_auth_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_auth_email_change();
