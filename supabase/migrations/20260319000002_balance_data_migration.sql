-- Migration: Reconcile existing data with the new charges system
-- Creates retroactive charges from existing invoices so that
-- recalculate_family_balance() produces correct results.

-- ============================================================================
-- 1. Create charges from existing invoices WITH line items
-- ============================================================================

INSERT INTO charges (family_id, type, source_type, description, amount_cents, status, invoice_id, created_at)
SELECT
  i.family_id,
  'adjustment',
  'admin',
  COALESCE((item->>'description')::text, i.display_id || ' charge'),
  (item->>'amount_cents')::integer,
  CASE
    WHEN i.status = 'paid' THEN 'confirmed'
    WHEN i.status = 'void' THEN 'voided'
    ELSE 'pending'
  END,
  i.id,
  i.created_at
FROM invoices i
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(i.items, '[]'::jsonb)) AS item
WHERE i.items IS NOT NULL
  AND jsonb_array_length(i.items) > 0;

-- ============================================================================
-- 2. Create a single charge for invoices WITHOUT line items
-- ============================================================================

INSERT INTO charges (family_id, type, source_type, description, amount_cents, status, invoice_id, created_at)
SELECT
  i.family_id,
  'adjustment',
  'admin',
  COALESCE(i.display_id, 'Legacy invoice') || ' charge',
  i.amount_cents,
  CASE
    WHEN i.status = 'paid' THEN 'confirmed'
    WHEN i.status = 'void' THEN 'voided'
    ELSE 'pending'
  END,
  i.id,
  i.created_at
FROM invoices i
WHERE i.items IS NULL
   OR jsonb_array_length(i.items) = 0;

-- ============================================================================
-- 3. Recalculate all family balances to fix any double-counting drift
-- ============================================================================

SELECT recalculate_family_balance(f.id) FROM families f;
