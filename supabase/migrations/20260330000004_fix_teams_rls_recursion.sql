-- Fix: remove competition_players policies that cause infinite recursion
-- on the teams table. The SECURITY DEFINER functions query teams internally,
-- and Postgres detects potential recursion at plan time even though the
-- functions would bypass RLS at runtime.
--
-- For now: admin-only write access, all authenticated users can read
-- competition_players (non-sensitive data — names, ages, registration status).
-- Parent/coach scoping will be handled at the application layer or via
-- future views.

-- Drop the problematic policies
DROP POLICY IF EXISTS "parent_comp_players_select" ON competition_players;
DROP POLICY IF EXISTS "coach_comp_players_select" ON competition_players;
DROP POLICY IF EXISTS "parent_competitions_select" ON competitions;
DROP POLICY IF EXISTS "coach_competitions_select" ON competitions;

-- Replace with simple authenticated-user read access
-- Competition data (team names, player names, registration status) is not sensitive
CREATE POLICY "authenticated_competitions_select" ON competitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_comp_players_select" ON competition_players FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Drop the helper functions that are no longer needed
DROP FUNCTION IF EXISTS get_parent_competition_ids(uuid);
DROP FUNCTION IF EXISTS get_parent_comp_team_ids(uuid);
DROP FUNCTION IF EXISTS get_coach_competition_ids(uuid);
DROP FUNCTION IF EXISTS get_coach_comp_team_ids(uuid);
