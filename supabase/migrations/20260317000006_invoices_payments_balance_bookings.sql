-- Migration 006: Invoices, payments, family_balance, bookings
-- Depends on: families, players, sessions, programs, auth.users
-- Note: invoices created before payments (payments references invoices)

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text UNIQUE NOT NULL,
  family_id uuid NOT NULL REFERENCES families(id),
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  due_date date,
  items jsonb,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  amount_cents integer NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  square_payment_id text,
  invoice_id uuid REFERENCES invoices(id),
  description text,
  category text,
  received_at timestamptz,
  recorded_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE family_balance (
  family_id uuid PRIMARY KEY REFERENCES families(id),
  balance_cents integer NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  player_id uuid NOT NULL REFERENCES players(id),
  session_id uuid REFERENCES sessions(id),
  program_id uuid REFERENCES programs(id),
  booking_type text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  booked_by uuid REFERENCES auth.users(id),
  booked_at timestamptz DEFAULT now(),
  notes text
);
