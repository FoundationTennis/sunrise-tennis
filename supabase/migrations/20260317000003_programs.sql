-- Migration 003: Programs, program_coaches, program_roster
-- Depends on: venues, coaches, players

CREATE TABLE programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  type text NOT NULL,
  level text NOT NULL,
  day_of_week smallint,
  start_time time,
  end_time time,
  duration_min smallint,
  venue_id uuid REFERENCES venues(id),
  term_fee_cents integer,
  per_session_cents integer,
  max_capacity smallint,
  status text NOT NULL DEFAULT 'active',
  term text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE program_coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id),
  coach_id uuid NOT NULL REFERENCES coaches(id),
  role text NOT NULL DEFAULT 'primary',
  availability text,
  UNIQUE(program_id, coach_id)
);

CREATE TABLE program_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id),
  player_id uuid NOT NULL REFERENCES players(id),
  enrolled_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'enrolled',
  UNIQUE(program_id, player_id)
);
