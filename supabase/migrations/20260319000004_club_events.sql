-- Club events table for socials, tournaments, and other events
CREATE TABLE club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'social'
    CHECK (event_type IN ('social', 'internal_tournament', 'external_tournament')),
  location text,
  start_date date NOT NULL,
  end_date date,
  start_time time,
  end_time time,
  all_day boolean NOT NULL DEFAULT false,
  external_url text,
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view events
CREATE POLICY "events_select_authenticated" ON club_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage events
CREATE POLICY "events_admin_insert" ON club_events
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "events_admin_update" ON club_events
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "events_admin_delete" ON club_events
  FOR DELETE USING (is_admin(auth.uid()));

-- Index for common queries
CREATE INDEX idx_club_events_start_date ON club_events (start_date);
CREATE INDEX idx_club_events_status ON club_events (status);
