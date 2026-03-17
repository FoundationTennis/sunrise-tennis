-- Migration 005: Lesson notes and media
-- Depends on: sessions, players, coaches, programs, auth.users

CREATE TABLE lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  player_id uuid NOT NULL REFERENCES players(id),
  coach_id uuid REFERENCES coaches(id),
  focus text,
  progress text,
  drills_used text[],
  video_url text,
  next_plan text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  source text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  title text,
  description text,
  player_id uuid REFERENCES players(id),
  session_id uuid REFERENCES sessions(id),
  program_id uuid REFERENCES programs(id),
  visibility text NOT NULL DEFAULT 'public',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
