-- Migration 002: Players
-- Depends on: families, coaches

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  preferred_name text,
  dob date,
  level text,
  ball_color text,
  coach_id uuid REFERENCES coaches(id),
  status text NOT NULL DEFAULT 'active',
  medical_notes text,
  physical_notes text,
  current_focus text[],
  short_term_goal text,
  long_term_goal text,
  comp_interest text,
  media_consent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
