-- Fix RLS recursion between sessions and bookings tables.
--
-- Problem: parent_sessions_via_booking (sessions) sub-queries bookings,
-- and coach_bookings_select (bookings) sub-queries sessions → infinite loop.
--
-- Solution: wrap cross-table lookups in SECURITY DEFINER functions that
-- bypass RLS on the target table.

-- ============================================================================
-- SECURITY DEFINER helpers (bypass RLS for cross-table policy lookups)
-- ============================================================================

-- Returns session IDs from bookings for a given family (used in sessions policy)
CREATE OR REPLACE FUNCTION get_family_booking_session_ids(p_family_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT session_id FROM bookings
  WHERE session_id IS NOT NULL
  AND (family_id = p_family_id OR second_family_id = p_family_id);
$$;

-- Returns session IDs assigned to a given coach (used in bookings policy)
CREATE OR REPLACE FUNCTION get_coach_session_ids(p_coach_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM sessions WHERE coach_id = p_coach_id;
$$;

-- ============================================================================
-- Replace recursive policies with SECURITY DEFINER versions
-- ============================================================================

-- Drop the recursive policies
DROP POLICY IF EXISTS "parent_sessions_via_booking" ON sessions;
DROP POLICY IF EXISTS "coach_bookings_select" ON bookings;

-- Recreate without recursion
CREATE POLICY "parent_sessions_via_booking" ON sessions FOR SELECT
  USING (id IN (
    SELECT get_family_booking_session_ids(get_user_family_id(auth.uid()))
  ));

CREATE POLICY "coach_bookings_select" ON bookings FOR SELECT
  USING (session_id IN (
    SELECT get_coach_session_ids(get_user_coach_id(auth.uid()))
  ));

-- Auth checks inside the DEFINER functions:
-- get_user_family_id and get_user_coach_id already validate auth.uid()
-- The DEFINER functions only return data scoped to the caller's family/coach.
