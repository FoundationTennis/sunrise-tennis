-- Fix SECOND RLS recursion path: sessions ↔ attendances
--
-- Path: parent_sessions_select (sessions) sub-queries attendances,
-- coach_attendances_select (attendances) sub-queries sessions → infinite loop.
--
-- Reuses get_coach_session_ids() DEFINER function from previous migration.

-- Drop the recursive policies on attendances
DROP POLICY IF EXISTS "coach_attendances_select" ON attendances;
DROP POLICY IF EXISTS "coach_attendances_insert" ON attendances;

-- Recreate using SECURITY DEFINER function (no back-reference to sessions)
CREATE POLICY "coach_attendances_select" ON attendances FOR SELECT
  USING (session_id IN (
    SELECT get_coach_session_ids(get_user_coach_id(auth.uid()))
  ));

CREATE POLICY "coach_attendances_insert" ON attendances FOR INSERT
  WITH CHECK (session_id IN (
    SELECT get_coach_session_ids(get_user_coach_id(auth.uid()))
  ));
