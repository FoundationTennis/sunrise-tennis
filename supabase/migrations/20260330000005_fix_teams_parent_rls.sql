-- Fix: infinite recursion in teams RLS
--
-- Chain: parent_teams_select queries team_members → coach_team_members_select
-- queries teams → triggers parent_teams_select again → infinite loop.
--
-- Fix: replace inline sub-queries with SECURITY DEFINER functions that
-- bypass RLS when reading the junction tables.

-- Helper: get team IDs a parent can see (via team_members → players)
CREATE OR REPLACE FUNCTION get_parent_team_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tm.team_id
  FROM team_members tm
  JOIN players p ON p.id = tm.player_id
  WHERE p.family_id = get_user_family_id(user_uuid);
$$;

-- Helper: get team IDs a coach can see
CREATE OR REPLACE FUNCTION get_coach_team_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM teams WHERE coach_id = get_user_coach_id(user_uuid);
$$;

-- ── Fix teams policies ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "parent_teams_select" ON teams;
DROP POLICY IF EXISTS "coach_teams_select" ON teams;

CREATE POLICY "parent_teams_select" ON teams FOR SELECT
  USING (id IN (SELECT get_parent_team_ids(auth.uid())));

CREATE POLICY "coach_teams_select" ON teams FOR SELECT
  USING (coach_id = get_user_coach_id(auth.uid()));

-- ── Fix team_members policies ──────────────────────────────────────────

DROP POLICY IF EXISTS "coach_team_members_select" ON team_members;

CREATE POLICY "coach_team_members_select" ON team_members FOR SELECT
  USING (team_id IN (SELECT get_coach_team_ids(auth.uid())));

-- ── Fix availability policies ──────────────────────────────────────────
-- availability also has parent policies that query players, but those
-- don't reference teams so they're safe. However coach_availability
-- if it exists would hit teams. Let's check and fix proactively.

-- No coach availability policy exists in the original migration, so no fix needed.
