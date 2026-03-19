-- Security hardening: unique constraint on charges + coach notification scope

-- ── 1. Prevent duplicate active charges for same session/player/type ────
-- Partial unique index: only applies to pending/confirmed charges.
-- Voided/credited charges are excluded so re-charging is possible.

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_unique_active
  ON charges (session_id, player_id, type)
  WHERE session_id IS NOT NULL
    AND player_id IS NOT NULL
    AND status IN ('pending', 'confirmed');

-- ── 2. Restrict coach notification creation scope ───────────────────────
-- Coaches can only create session or team notifications, not broadcast
-- to all families/programs. Admins are unrestricted (separate policy).

DROP POLICY IF EXISTS "coach_notifications_insert" ON notifications;
CREATE POLICY "coach_notifications_insert" ON notifications FOR INSERT
  WITH CHECK (
    get_user_coach_id(auth.uid()) IS NOT NULL
    AND target_type IN ('session', 'team')
  );
