-- Migration 010: Row Level Security policies
-- Deny-by-default on all tables. No DELETE policies anywhere (archive pattern).

-- ============================================================================
-- Helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_family_id(user_uuid uuid)
RETURNS uuid AS $$
  SELECT family_id FROM user_roles WHERE user_id = user_uuid AND role = 'parent' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_coach_id(user_uuid uuid)
RETURNS uuid AS $$
  SELECT coach_id FROM user_roles WHERE user_id = user_uuid AND role = 'coach' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_uuid AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- Enable RLS on ALL tables
-- ============================================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- families
-- ============================================================================

CREATE POLICY "admin_families_select" ON families FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_families_insert" ON families FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_families_update" ON families FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_families_select" ON families FOR SELECT
  USING (id = get_user_family_id(auth.uid()));

-- ============================================================================
-- coaches
-- ============================================================================

CREATE POLICY "admin_coaches_select" ON coaches FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_coaches_insert" ON coaches FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_coaches_update" ON coaches FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "coach_coaches_select" ON coaches FOR SELECT
  USING (id = get_user_coach_id(auth.uid()));

-- ============================================================================
-- venues (readable by all authenticated users)
-- ============================================================================

CREATE POLICY "authenticated_venues_select" ON venues FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_venues_insert" ON venues FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_venues_update" ON venues FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- players
-- ============================================================================

CREATE POLICY "admin_players_select" ON players FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_players_insert" ON players FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_players_update" ON players FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_players_select" ON players FOR SELECT
  USING (family_id = get_user_family_id(auth.uid()));

CREATE POLICY "coach_players_select" ON players FOR SELECT
  USING (coach_id = get_user_coach_id(auth.uid()));

-- ============================================================================
-- programs (readable by all authenticated users)
-- ============================================================================

CREATE POLICY "authenticated_programs_select" ON programs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_programs_insert" ON programs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_programs_update" ON programs FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- program_coaches
-- ============================================================================

CREATE POLICY "authenticated_program_coaches_select" ON program_coaches FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_program_coaches_insert" ON program_coaches FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_program_coaches_update" ON program_coaches FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- program_roster
-- ============================================================================

CREATE POLICY "admin_program_roster_select" ON program_roster FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_program_roster_insert" ON program_roster FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_program_roster_update" ON program_roster FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_program_roster_select" ON program_roster FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

CREATE POLICY "coach_program_roster_select" ON program_roster FOR SELECT
  USING (program_id IN (
    SELECT program_id FROM program_coaches WHERE coach_id = get_user_coach_id(auth.uid())
  ));

-- ============================================================================
-- sessions
-- ============================================================================

CREATE POLICY "admin_sessions_select" ON sessions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_sessions_insert" ON sessions FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_sessions_update" ON sessions FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "coach_sessions_select" ON sessions FOR SELECT
  USING (coach_id = get_user_coach_id(auth.uid()));

CREATE POLICY "parent_sessions_select" ON sessions FOR SELECT
  USING (id IN (
    SELECT session_id FROM attendances WHERE player_id IN (
      SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
    )
  ));

-- ============================================================================
-- attendances
-- ============================================================================

CREATE POLICY "admin_attendances_select" ON attendances FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_attendances_insert" ON attendances FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_attendances_update" ON attendances FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "coach_attendances_select" ON attendances FOR SELECT
  USING (session_id IN (
    SELECT id FROM sessions WHERE coach_id = get_user_coach_id(auth.uid())
  ));

CREATE POLICY "coach_attendances_insert" ON attendances FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE coach_id = get_user_coach_id(auth.uid())
  ));

CREATE POLICY "parent_attendances_select" ON attendances FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

-- ============================================================================
-- lesson_notes
-- ============================================================================

CREATE POLICY "admin_lesson_notes_select" ON lesson_notes FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_lesson_notes_insert" ON lesson_notes FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_lesson_notes_update" ON lesson_notes FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "coach_lesson_notes_select" ON lesson_notes FOR SELECT
  USING (coach_id = get_user_coach_id(auth.uid()));

CREATE POLICY "coach_lesson_notes_insert" ON lesson_notes FOR INSERT
  WITH CHECK (coach_id = get_user_coach_id(auth.uid()));

CREATE POLICY "parent_lesson_notes_select" ON lesson_notes FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

-- ============================================================================
-- media
-- ============================================================================

CREATE POLICY "admin_media_select" ON media FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_media_insert" ON media FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_media_update" ON media FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "authenticated_media_public_select" ON media FOR SELECT
  USING (visibility = 'public' AND auth.uid() IS NOT NULL);

CREATE POLICY "parent_media_select" ON media FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

CREATE POLICY "coach_media_insert" ON media FOR INSERT
  WITH CHECK (get_user_coach_id(auth.uid()) IS NOT NULL);

-- ============================================================================
-- invoices
-- ============================================================================

CREATE POLICY "admin_invoices_select" ON invoices FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_invoices_insert" ON invoices FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_invoices_update" ON invoices FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_invoices_select" ON invoices FOR SELECT
  USING (family_id = get_user_family_id(auth.uid()));

-- ============================================================================
-- payments
-- ============================================================================

CREATE POLICY "admin_payments_select" ON payments FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_payments_insert" ON payments FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_payments_update" ON payments FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_payments_select" ON payments FOR SELECT
  USING (family_id = get_user_family_id(auth.uid()));

-- ============================================================================
-- family_balance
-- ============================================================================

CREATE POLICY "admin_family_balance_select" ON family_balance FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_family_balance_insert" ON family_balance FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_family_balance_update" ON family_balance FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_family_balance_select" ON family_balance FOR SELECT
  USING (family_id = get_user_family_id(auth.uid()));

-- ============================================================================
-- bookings
-- ============================================================================

CREATE POLICY "admin_bookings_select" ON bookings FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_bookings_insert" ON bookings FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_bookings_update" ON bookings FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_bookings_select" ON bookings FOR SELECT
  USING (family_id = get_user_family_id(auth.uid()));

CREATE POLICY "parent_bookings_insert" ON bookings FOR INSERT
  WITH CHECK (family_id = get_user_family_id(auth.uid()));

-- ============================================================================
-- teams
-- ============================================================================

CREATE POLICY "admin_teams_select" ON teams FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_teams_insert" ON teams FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_teams_update" ON teams FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "coach_teams_select" ON teams FOR SELECT
  USING (coach_id = get_user_coach_id(auth.uid()));

CREATE POLICY "parent_teams_select" ON teams FOR SELECT
  USING (id IN (
    SELECT team_id FROM team_members WHERE player_id IN (
      SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
    )
  ));

-- ============================================================================
-- team_members
-- ============================================================================

CREATE POLICY "admin_team_members_select" ON team_members FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_team_members_insert" ON team_members FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_team_members_update" ON team_members FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_team_members_select" ON team_members FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

CREATE POLICY "coach_team_members_select" ON team_members FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE coach_id = get_user_coach_id(auth.uid())
  ));

-- ============================================================================
-- availability
-- ============================================================================

CREATE POLICY "admin_availability_select" ON availability FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_availability_insert" ON availability FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_availability_update" ON availability FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "parent_availability_select" ON availability FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

CREATE POLICY "parent_availability_insert" ON availability FOR INSERT
  WITH CHECK (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

CREATE POLICY "parent_availability_update" ON availability FOR UPDATE
  USING (player_id IN (
    SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
  ));

CREATE POLICY "coach_availability_select" ON availability FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE coach_id = get_user_coach_id(auth.uid())
  ));

-- ============================================================================
-- team_messages
-- ============================================================================

CREATE POLICY "admin_team_messages_select" ON team_messages FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_team_messages_insert" ON team_messages FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "team_member_messages_select" ON team_messages FOR SELECT
  USING (team_id IN (
    SELECT team_id FROM team_members WHERE player_id IN (
      SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
    )
  ));

CREATE POLICY "team_member_messages_insert" ON team_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND team_id IN (
      SELECT team_id FROM team_members WHERE player_id IN (
        SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
      )
    )
  );

CREATE POLICY "coach_team_messages_select" ON team_messages FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE coach_id = get_user_coach_id(auth.uid())
  ));

CREATE POLICY "coach_team_messages_insert" ON team_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND team_id IN (
      SELECT id FROM teams WHERE coach_id = get_user_coach_id(auth.uid())
    )
  );

-- ============================================================================
-- user_roles
-- ============================================================================

CREATE POLICY "admin_user_roles_select" ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_user_roles_insert" ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_user_roles_update" ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "own_user_roles_select" ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- notifications
-- ============================================================================

CREATE POLICY "admin_notifications_select" ON notifications FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_notifications_insert" ON notifications FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_notifications_update" ON notifications FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "coach_notifications_insert" ON notifications FOR INSERT
  WITH CHECK (get_user_coach_id(auth.uid()) IS NOT NULL);

-- ============================================================================
-- push_subscriptions
-- ============================================================================

CREATE POLICY "admin_push_subscriptions_select" ON push_subscriptions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "own_push_subscriptions_select" ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "own_push_subscriptions_insert" ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_push_subscriptions_update" ON push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- audit_log (append-only: INSERT only, no SELECT/UPDATE/DELETE for non-admin)
-- ============================================================================

CREATE POLICY "admin_audit_log_select" ON audit_log FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "authenticated_audit_log_insert" ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE policies on audit_log (append-only)
