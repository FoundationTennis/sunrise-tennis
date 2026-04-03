-- Session coach attendances: tracks whether assistant coaches attended a session
-- Used by lead coaches to mark assistant coach presence/absence

CREATE TABLE IF NOT EXISTS session_coach_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  coach_id uuid NOT NULL REFERENCES coaches(id),
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent')),
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, coach_id)
);

-- RLS
ALTER TABLE session_coach_attendances ENABLE ROW LEVEL SECURITY;

-- Admin can do anything
CREATE POLICY "admin_all_session_coach_attendances"
  ON session_coach_attendances
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Lead coach of the session's program can read/write
CREATE POLICY "lead_coach_manage_session_coach_attendances"
  ON session_coach_attendances
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN program_coaches pc ON pc.program_id = s.program_id
      JOIN coaches c ON c.id = pc.coach_id
      WHERE s.id = session_coach_attendances.session_id
        AND pc.role = 'primary'
        AND c.user_id = auth.uid()
    )
  );

-- Coaches can read their own attendance records
CREATE POLICY "coach_read_own_session_coach_attendances"
  ON session_coach_attendances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      WHERE c.id = session_coach_attendances.coach_id
        AND c.user_id = auth.uid()
    )
  );

-- Also create the search_players_for_coach RPC for walk-in player add
CREATE OR REPLACE FUNCTION search_players_for_coach(query text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  ball_color text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.ball_color
  FROM players p
  WHERE p.status = 'active'
    AND (
      p.first_name ILIKE '%' || query || '%'
      OR p.last_name ILIKE '%' || query || '%'
    )
  ORDER BY p.last_name, p.first_name
  LIMIT 10;
END;
$$;
