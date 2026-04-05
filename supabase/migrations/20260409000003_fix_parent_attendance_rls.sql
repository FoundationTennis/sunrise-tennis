-- Fix parent attendance/charge RLS policies — use SECURITY DEFINER function
-- to avoid RLS nesting issues with subqueries against players table

-- Helper: returns player IDs for a user's family (bypasses RLS)
CREATE OR REPLACE FUNCTION get_family_player_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM players
  WHERE family_id = (
    SELECT family_id FROM user_roles
    WHERE user_id = user_uuid AND role = 'parent'
    LIMIT 1
  );
$$;

-- Drop and recreate attendance policies with the helper function
DROP POLICY IF EXISTS "parent_attendances_insert" ON attendances;
DROP POLICY IF EXISTS "parent_attendances_update" ON attendances;
DROP POLICY IF EXISTS "parent_attendances_delete" ON attendances;

CREATE POLICY "parent_attendances_insert" ON attendances
  FOR INSERT TO authenticated
  WITH CHECK (player_id IN (SELECT get_family_player_ids(auth.uid())));

CREATE POLICY "parent_attendances_update" ON attendances
  FOR UPDATE TO authenticated
  USING (player_id IN (SELECT get_family_player_ids(auth.uid())));

CREATE POLICY "parent_attendances_delete" ON attendances
  FOR DELETE TO authenticated
  USING (player_id IN (SELECT get_family_player_ids(auth.uid())));

-- Also fix charges policies the same way
DROP POLICY IF EXISTS "parent_charges_insert" ON charges;
DROP POLICY IF EXISTS "parent_charges_update" ON charges;

CREATE POLICY "parent_charges_insert" ON charges
  FOR INSERT TO authenticated
  WITH CHECK (family_id = get_user_family_id(auth.uid()));

CREATE POLICY "parent_charges_update" ON charges
  FOR UPDATE TO authenticated
  USING (family_id = get_user_family_id(auth.uid()));
