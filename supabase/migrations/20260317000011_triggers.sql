-- Migration 011: Triggers - updated_at auto-update and family balance auto-update

-- ============================================================================
-- Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Auto-update family_balance when a payment is inserted with status 'received'
-- ============================================================================

CREATE OR REPLACE FUNCTION update_family_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_balance (family_id, balance_cents, last_updated)
  VALUES (NEW.family_id, NEW.amount_cents, now())
  ON CONFLICT (family_id) DO UPDATE
  SET balance_cents = family_balance.balance_cents + NEW.amount_cents,
      last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_balance_update
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'received')
  EXECUTE FUNCTION update_family_balance();
