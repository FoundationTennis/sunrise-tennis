-- Migration: Payment System Overhaul
-- Creates: charges, family_pricing, vouchers, referrals tables
-- Alters: programs (early_pay_discount_pct), bookings (financial fields)
-- Replaces: balance trigger with recalculate_family_balance() function
-- Fixes: double-counting bug in family_balance

-- ============================================================================
-- 1. Drop the broken balance trigger (causes double-counting)
-- ============================================================================

DROP TRIGGER IF EXISTS payment_balance_update ON payments;
DROP FUNCTION IF EXISTS update_family_balance();

-- ============================================================================
-- 2. charges table — the billing backbone
-- ============================================================================

CREATE TABLE charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  player_id uuid REFERENCES players(id),
  type text NOT NULL,
    -- session, term_enrollment, casual, private, trial, event,
    -- credit, adjustment, voucher, referral_credit, discount
  source_type text NOT NULL,
    -- enrollment, attendance, voucher, referral, admin, cancellation
  source_id uuid,
  session_id uuid REFERENCES sessions(id),
  program_id uuid REFERENCES programs(id),
  booking_id uuid REFERENCES bookings(id),
  description text NOT NULL,
  amount_cents integer NOT NULL,
    -- positive = charge to family, negative = credit to family
  status text NOT NULL DEFAULT 'pending',
    -- pending, confirmed, voided, credited
  invoice_id uuid REFERENCES invoices(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_charges_family ON charges(family_id);
CREATE INDEX idx_charges_session ON charges(session_id);
CREATE INDEX idx_charges_booking ON charges(booking_id);
CREATE INDEX idx_charges_status ON charges(status);
CREATE INDEX idx_charges_program ON charges(program_id);

-- ============================================================================
-- 3. family_pricing table — per-family rate overrides
-- ============================================================================

CREATE TABLE family_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  program_id uuid REFERENCES programs(id),
  program_type text,
    -- e.g. 'private', 'group', 'squad' — for broad overrides
  per_session_cents integer,
  term_fee_cents integer,
  notes text,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_family_pricing_lookup ON family_pricing(family_id, program_id);

-- ============================================================================
-- 4. vouchers table — SA sports vouchers ($100 fixed)
-- ============================================================================

CREATE TABLE vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id),
  voucher_code text NOT NULL,
  voucher_type text NOT NULL DEFAULT 'active_kids',
    -- active_kids, get_active
  amount_cents integer NOT NULL DEFAULT 10000,
    -- fixed $100 for SA vouchers
  status text NOT NULL DEFAULT 'pending',
    -- pending, approved, rejected, expired
  submitted_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  charge_id uuid,
    -- FK added after charges table exists (references charges(id))
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vouchers_family ON vouchers(family_id);
CREATE INDEX idx_vouchers_status ON vouchers(status);

-- Add the FK after both tables exist
ALTER TABLE vouchers ADD CONSTRAINT vouchers_charge_id_fkey
  FOREIGN KEY (charge_id) REFERENCES charges(id);

-- ============================================================================
-- 5. referrals table
-- ============================================================================

CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_family_id uuid NOT NULL REFERENCES families(id),
  referred_family_id uuid NOT NULL REFERENCES families(id),
  referred_player_id uuid REFERENCES players(id),
  status text NOT NULL DEFAULT 'pending',
    -- pending, qualified, credited, expired
  credit_amount_cents integer NOT NULL DEFAULT 5000,
    -- $50 default
  charge_id uuid REFERENCES charges(id),
  qualified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_referrals_referring ON referrals(referring_family_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_family_id);

-- ============================================================================
-- 6. ALTER programs — add per-program early pay discount
-- ============================================================================

ALTER TABLE programs
  ADD COLUMN early_pay_discount_pct smallint;
  -- nullable: null = no discount, e.g. 10 = 10% off for pay-now

-- ============================================================================
-- 7. ALTER bookings — add financial tracking fields
-- ============================================================================

ALTER TABLE bookings
  ADD COLUMN payment_option text,
    -- pay_now, pay_later
  ADD COLUMN discount_cents integer DEFAULT 0,
  ADD COLUMN price_cents integer,
  ADD COLUMN sessions_total integer,
  ADD COLUMN sessions_charged integer DEFAULT 0;

-- ============================================================================
-- 8. recalculate_family_balance — single source of truth
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_family_balance(target_family_id uuid)
RETURNS integer AS $$
DECLARE
  total_payments integer;
  total_charges integer;
  new_balance integer;
BEGIN
  -- Sum all received payments
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO total_payments
  FROM payments
  WHERE family_id = target_family_id
    AND status = 'received';

  -- Sum all active charges (positive = money owed, negative = credits)
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO total_charges
  FROM charges
  WHERE family_id = target_family_id
    AND status IN ('pending', 'confirmed');

  -- Balance = payments received minus charges owed
  new_balance := total_payments - total_charges;

  INSERT INTO family_balance (family_id, balance_cents, last_updated)
  VALUES (target_family_id, new_balance, now())
  ON CONFLICT (family_id) DO UPDATE
  SET balance_cents = new_balance, last_updated = now();

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. get_session_price — resolve family override > program default
-- ============================================================================

CREATE OR REPLACE FUNCTION get_session_price(
  target_family_id uuid,
  target_program_id uuid,
  target_program_type text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  override_price integer;
  program_price integer;
BEGIN
  -- Check specific program override first
  SELECT fp.per_session_cents INTO override_price
  FROM family_pricing fp
  WHERE fp.family_id = target_family_id
    AND fp.program_id = target_program_id
    AND fp.valid_from <= CURRENT_DATE
    AND (fp.valid_until IS NULL OR fp.valid_until >= CURRENT_DATE)
  ORDER BY fp.created_at DESC
  LIMIT 1;

  IF override_price IS NOT NULL THEN
    RETURN override_price;
  END IF;

  -- Check program type override (e.g. all privates for this family)
  IF target_program_type IS NOT NULL THEN
    SELECT fp.per_session_cents INTO override_price
    FROM family_pricing fp
    WHERE fp.family_id = target_family_id
      AND fp.program_id IS NULL
      AND fp.program_type = target_program_type
      AND fp.valid_from <= CURRENT_DATE
      AND (fp.valid_until IS NULL OR fp.valid_until >= CURRENT_DATE)
    ORDER BY fp.created_at DESC
    LIMIT 1;

    IF override_price IS NOT NULL THEN
      RETURN override_price;
    END IF;
  END IF;

  -- Fall back to program default
  SELECT p.per_session_cents INTO program_price
  FROM programs p
  WHERE p.id = target_program_id;

  RETURN COALESCE(program_price, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 10. get_term_price — resolve family override for term fee
-- ============================================================================

CREATE OR REPLACE FUNCTION get_term_price(
  target_family_id uuid,
  target_program_id uuid,
  target_program_type text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  override_price integer;
  program_price integer;
BEGIN
  SELECT fp.term_fee_cents INTO override_price
  FROM family_pricing fp
  WHERE fp.family_id = target_family_id
    AND fp.program_id = target_program_id
    AND fp.valid_from <= CURRENT_DATE
    AND (fp.valid_until IS NULL OR fp.valid_until >= CURRENT_DATE)
  ORDER BY fp.created_at DESC
  LIMIT 1;

  IF override_price IS NOT NULL THEN
    RETURN override_price;
  END IF;

  IF target_program_type IS NOT NULL THEN
    SELECT fp.term_fee_cents INTO override_price
    FROM family_pricing fp
    WHERE fp.family_id = target_family_id
      AND fp.program_id IS NULL
      AND fp.program_type = target_program_type
      AND fp.valid_from <= CURRENT_DATE
      AND (fp.valid_until IS NULL OR fp.valid_until >= CURRENT_DATE)
    ORDER BY fp.created_at DESC
    LIMIT 1;

    IF override_price IS NOT NULL THEN
      RETURN override_price;
    END IF;
  END IF;

  SELECT p.term_fee_cents INTO program_price
  FROM programs p
  WHERE p.id = target_program_id;

  RETURN COALESCE(program_price, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 11. updated_at trigger for charges
-- ============================================================================

CREATE TRIGGER charges_updated_at
  BEFORE UPDATE ON charges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 12. RLS policies for new tables
-- ============================================================================

ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- charges: admin full, parent read own family
CREATE POLICY "admin_charges_all" ON charges
  FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "parent_charges_select" ON charges
  FOR SELECT USING (family_id = get_user_family_id(auth.uid()));

-- family_pricing: admin full, parent read own
CREATE POLICY "admin_family_pricing_all" ON family_pricing
  FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "parent_family_pricing_select" ON family_pricing
  FOR SELECT USING (family_id = get_user_family_id(auth.uid()));

-- vouchers: admin full, parent read + insert own
CREATE POLICY "admin_vouchers_all" ON vouchers
  FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "parent_vouchers_select" ON vouchers
  FOR SELECT USING (family_id = get_user_family_id(auth.uid()));
CREATE POLICY "parent_vouchers_insert" ON vouchers
  FOR INSERT WITH CHECK (family_id = get_user_family_id(auth.uid()));

-- referrals: admin full, parent read own (referring or referred)
CREATE POLICY "admin_referrals_all" ON referrals
  FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "parent_referrals_select" ON referrals
  FOR SELECT USING (
    referring_family_id = get_user_family_id(auth.uid())
    OR referred_family_id = get_user_family_id(auth.uid())
  );
