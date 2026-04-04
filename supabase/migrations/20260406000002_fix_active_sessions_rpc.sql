-- Fix get_active_sessions to use auth_events (real client IPs) instead of auth.sessions (Vercel IPs)
-- auth.sessions shows Vercel edge function IPs and aggressively purges on signout

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
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Find users whose most recent auth event is a login (not a signout)
  -- Uses auth_events which has real client IPs from x-forwarded-for
  RETURN QUERY
  WITH latest_events AS (
    SELECT DISTINCT ON (ae.user_id)
      ae.id as event_id,
      ae.user_id,
      ae.email,
      ae.event_type,
      ae.ip_address,
      ae.user_agent,
      ae.created_at
    FROM auth_events ae
    WHERE ae.user_id IS NOT NULL
      AND ae.event_type IN ('login', 'signout')
    ORDER BY ae.user_id, ae.created_at DESC
  )
  SELECT
    le.event_id as session_id,
    le.user_id,
    le.email,
    COALESCE(u.raw_user_meta_data->>'full_name', '')::text as full_name,
    le.ip_address as ip,
    le.user_agent,
    le.created_at,
    NULL::timestamp as refreshed_at
  FROM latest_events le
  JOIN auth.users u ON u.id = le.user_id
  WHERE le.event_type = 'login'
  ORDER BY le.created_at DESC;
END;
$$;
