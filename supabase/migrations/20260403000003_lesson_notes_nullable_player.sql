-- Make lesson_notes.player_id nullable to support session-level notes
-- Session-level notes have player_id = NULL and are visible to lead coach + admin

ALTER TABLE lesson_notes ALTER COLUMN player_id DROP NOT NULL;
