-- Fix infinite recursion in competition RLS policies
-- The parent/coach policies on competitions referenced teams, which has
-- its own RLS policies creating circular dependency.
-- Fix: drop recursive policies, use SECURITY DEFINER helper functions.

-- Drop all existing competition policies
DROP POLICY IF EXISTS "admin_competitions_all" ON competitions;
DROP POLICY IF EXISTS "admin_comp_players_all" ON competition_players;
DROP POLICY IF EXISTS "parent_competitions_select" ON competitions;
DROP POLICY IF EXISTS "parent_comp_players_select" ON competition_players;
DROP POLICY IF EXISTS "coach_competitions_select" ON competitions;
DROP POLICY IF EXISTS "coach_comp_players_select" ON competition_players;

-- Helper: get competition IDs visible to a parent (via linked players)
CREATE OR REPLACE FUNCTION get_parent_competition_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT t.competition_id
  FROM teams t
  JOIN competition_players cp ON cp.team_id = t.id
  JOIN players p ON p.id = cp.player_id
  WHERE p.family_id = get_user_family_id(user_uuid)
    AND t.competition_id IS NOT NULL;
$$;

-- Helper: get team IDs visible to a parent (via linked players)
CREATE OR REPLACE FUNCTION get_parent_comp_team_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT cp.team_id
  FROM competition_players cp
  JOIN players p ON p.id = cp.player_id
  WHERE p.family_id = get_user_family_id(user_uuid);
$$;

-- Helper: get competition IDs visible to a coach
CREATE OR REPLACE FUNCTION get_coach_competition_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT competition_id
  FROM teams
  WHERE coach_id = get_user_coach_id(user_uuid)
    AND competition_id IS NOT NULL;
$$;

-- Helper: get team IDs visible to a coach
CREATE OR REPLACE FUNCTION get_coach_comp_team_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT id
  FROM teams
  WHERE coach_id = get_user_coach_id(user_uuid);
$$;

-- ── Competitions policies ──────────────────────────────────────────────

CREATE POLICY "admin_competitions_select" ON competitions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_competitions_insert" ON competitions FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_competitions_update" ON competitions FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_competitions_select" ON competitions FOR SELECT
  USING (id IN (SELECT get_parent_competition_ids(auth.uid())));

CREATE POLICY "coach_competitions_select" ON competitions FOR SELECT
  USING (id IN (SELECT get_coach_competition_ids(auth.uid())));

-- ── Competition Players policies ───────────────────────────────────────

CREATE POLICY "admin_comp_players_select" ON competition_players FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_comp_players_insert" ON competition_players FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_comp_players_update" ON competition_players FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_comp_players_delete" ON competition_players FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_comp_players_select" ON competition_players FOR SELECT
  USING (team_id IN (SELECT get_parent_comp_team_ids(auth.uid())));

CREATE POLICY "coach_comp_players_select" ON competition_players FOR SELECT
  USING (team_id IN (SELECT get_coach_comp_team_ids(auth.uid())));
