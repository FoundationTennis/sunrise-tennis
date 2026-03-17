-- Migration 004: Sessions and attendances
-- Depends on: programs, venues, coaches, players

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id),
  session_type text NOT NULL,
  date date NOT NULL,
  start_time time,
  end_time time,
  venue_id uuid REFERENCES venues(id),
  coach_id uuid REFERENCES coaches(id),
  status text NOT NULL DEFAULT 'scheduled',
  cancellation_reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  player_id uuid NOT NULL REFERENCES players(id),
  status text NOT NULL DEFAULT 'present',
  notes text,
  UNIQUE(session_id, player_id)
);
