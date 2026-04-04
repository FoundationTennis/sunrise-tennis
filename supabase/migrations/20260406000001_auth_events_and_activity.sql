-- Migration: Auth events tracking + admin activity dashboard RPCs
-- Adds auth event logging, user directory, security alerts, active sessions, lesson_notes audit trigger

-- ============================================================
-- 1. auth_events table (append-only, like audit_log)
-- ============================================================

CREATE TABLE auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  event_type text NOT NULL,
  method text,
  success boolean NOT NULL DEFAULT true,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_auth_events_created_at ON auth_events(created_at DESC);
CREATE INDEX idx_auth_events_email ON auth_events(email);
CREATE INDEX idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX idx_auth_events_event_type ON auth_events(event_type);

ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- Admin can read all auth events
CREATE POLICY "admin_auth_events_select" ON auth_events FOR SELECT
  USING (is_admin(auth.uid()));

-- No UPDATE or DELETE policies (append-only)
-- Inserts happen via service role client (bypasses RLS)

-- ============================================================
-- 2. Audit trigger for lesson_notes (was missing)
-- ============================================================

CREATE TRIGGER audit_lesson_notes
  AFTER INSERT OR UPDATE OR DELETE ON lesson_notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================
-- 3. RPC: get_user_directory()
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_directory()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  roles text[],
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  banned_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', '')::text as full_name,
    COALESCE(
      ARRAY(
        SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = u.id ORDER BY ur.role
      ),
      '{}'::text[]
    ) as roles,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.banned_until
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION get_user_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_directory() TO authenticated;

-- ============================================================
-- 4. RPC: get_security_alerts(p_hours)
-- ============================================================

CREATE OR REPLACE FUNCTION get_security_alerts(p_hours int DEFAULT 24)
RETURNS TABLE (
  email text,
  failed_count bigint,
  last_attempt timestamptz,
  ip_addresses text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    ae.email,
    COUNT(*) as failed_count,
    MAX(ae.created_at) as last_attempt,
    ARRAY_AGG(DISTINCT ae.ip_address::text) FILTER (WHERE ae.ip_address IS NOT NULL) as ip_addresses
  FROM auth_events ae
  WHERE ae.success = false
    AND ae.created_at > now() - (p_hours || ' hours')::interval
  GROUP BY ae.email
  HAVING COUNT(*) >= 3
  ORDER BY failed_count DESC;
END;
$$;

REVOKE ALL ON FUNCTION get_security_alerts(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_security_alerts(int) TO authenticated;

-- ============================================================
-- 5. RPC: get_active_sessions()
-- ============================================================

CREATE OR REPLACE FUNCTION get_active_sessions()
RETURNS TABLE (
  session_id uuid,
  user_id uuid,
  email text,
  full_name text,
  ip inet,
  user_agent text,
  created_at timestamptz,
  refreshed_at timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    s.id as session_id,
    s.user_id,
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', '')::text as full_name,
    s.ip,
    s.user_agent,
    s.created_at,
    s.refreshed_at
  FROM auth.sessions s
  JOIN auth.users u ON u.id = s.user_id
  WHERE s.not_after IS NULL OR s.not_after > now()
  ORDER BY COALESCE(s.refreshed_at, s.created_at) DESC;
END;
$$;

REVOKE ALL ON FUNCTION get_active_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_active_sessions() TO authenticated;
