-- Migration 007: Teams, team_members, availability, team_messages
-- Depends on: programs, players, coaches, auth.users

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  program_id uuid REFERENCES programs(id),
  season text,
  captain_id uuid REFERENCES players(id),
  coach_id uuid REFERENCES coaches(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  player_id uuid NOT NULL REFERENCES players(id),
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, player_id)
);

CREATE TABLE availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  player_id uuid NOT NULL REFERENCES players(id),
  match_date date NOT NULL,
  status text NOT NULL DEFAULT 'available',
  responded_at timestamptz,
  note text,
  UNIQUE(team_id, player_id, match_date)
);

CREATE TABLE team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
