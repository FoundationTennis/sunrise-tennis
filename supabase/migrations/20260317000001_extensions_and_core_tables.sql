-- Migration 001: Extensions and core tables (families, coaches, venues)
-- Enable required extensions and create foundational tables

-- ============================================================================
-- Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- families
-- ============================================================================

CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text UNIQUE NOT NULL,
  family_name text NOT NULL,
  preferred_name text,
  primary_contact jsonb,
  secondary_contact jsonb,
  address text,
  billing_prefs jsonb,
  status text NOT NULL DEFAULT 'active',
  referred_by text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- coaches
-- ============================================================================

CREATE TABLE coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  phone text,
  email text,
  qualifications jsonb,
  status text NOT NULL DEFAULT 'active',
  hourly_rate jsonb,
  is_owner boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- venues
-- ============================================================================

CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  courts smallint,
  notes text
);
