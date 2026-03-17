-- Migration 013: Additional RLS policies for parent portal
-- Parents can update their own family contact info and player media consent

-- Parents can update their own family (contact info, address)
CREATE POLICY "parent_families_update" ON families FOR UPDATE
  USING (id = get_user_family_id(auth.uid()));

-- Parents can update their own players (media_consent only enforced at app level)
CREATE POLICY "parent_players_update" ON players FOR UPDATE
  USING (family_id = get_user_family_id(auth.uid()));

-- Parents can see sessions for programs their players are enrolled in
CREATE POLICY "parent_sessions_program_select" ON sessions FOR SELECT
  USING (program_id IN (
    SELECT program_id FROM program_roster WHERE player_id IN (
      SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
    ) AND status = 'enrolled'
  ));
