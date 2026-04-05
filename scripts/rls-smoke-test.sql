-- =============================================================================
-- RLS CROSS-TENANT SMOKE TEST
-- Verifies Parent B cannot see Parent A's data, Coach cannot see financials.
-- Run with: supabase db query --linked -f scripts/rls-smoke-test.sql
-- =============================================================================

BEGIN;

-- Results table to collect test outcomes (visible in query output)
CREATE TEMP TABLE test_results (test_num int, test_name text, status text, detail text);
GRANT ALL ON test_results TO authenticated;

-- Disable audit triggers during test data setup (trigger has text/uuid cast issue via raw SQL)
ALTER TABLE families DISABLE TRIGGER audit_families;
ALTER TABLE players DISABLE TRIGGER audit_players;
ALTER TABLE payments DISABLE TRIGGER audit_payments;
ALTER TABLE invoices DISABLE TRIGGER audit_invoices;
ALTER TABLE family_balance DISABLE TRIGGER audit_family_balance;
ALTER TABLE user_roles DISABLE TRIGGER audit_user_roles;

-- ============================================================
-- SETUP: Test users + families + data
-- ============================================================
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000000', 'rls-test-userb@test.local', crypt('TestPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());

INSERT INTO families (id, display_id, family_name, primary_contact, status)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'C002', 'RLS Test Family B', '{"name": "Test Parent B", "email": "testb@test.local"}', 'active');

INSERT INTO user_roles (user_id, role, family_id) VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'parent', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

INSERT INTO players (id, family_id, first_name, last_name, level, ball_color, status)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TestChild', 'FamilyB', 'beginner', 'red', 'active');

INSERT INTO family_balance (family_id, balance_cents) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0) ON CONFLICT (family_id) DO NOTHING;

INSERT INTO invoices (id, display_id, family_id, amount_cents, status, due_date)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'INV-TEST-B', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5000, 'sent', now() + interval '30 days');

INSERT INTO payments (id, family_id, amount_cents, payment_method, status, category)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5000, 'cash', 'received', 'individual_lesson');

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000000', 'rls-test-coach@test.local', crypt('TestPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());

INSERT INTO coaches (id, user_id, name, email, status) VALUES ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Test Coach', 'rls-test-coach@test.local', 'active');

INSERT INTO user_roles (user_id, role, coach_id) VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'coach', '11111111-1111-1111-1111-111111111111');

-- Re-enable audit triggers before tests
ALTER TABLE families ENABLE TRIGGER audit_families;
ALTER TABLE players ENABLE TRIGGER audit_players;
ALTER TABLE payments ENABLE TRIGGER audit_payments;
ALTER TABLE invoices ENABLE TRIGGER audit_invoices;
ALTER TABLE family_balance ENABLE TRIGGER audit_family_balance;
ALTER TABLE user_roles ENABLE TRIGGER audit_user_roles;

-- ============================================================
-- PARENT B TESTS (should only see own family, not family A)
-- Family A = 5762f614-699b-477b-a5fc-45cb77dadb51
-- ============================================================
SELECT set_config('role', 'authenticated', true);
SELECT set_config('request.jwt.claims', json_build_object('sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'role', 'authenticated', 'email', 'rls-test-userb@test.local', 'aud', 'authenticated')::text, true);

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM families;
  SELECT count(*) INTO o FROM families WHERE id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (1, 'families (parent B)', CASE WHEN t = 1 AND o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM players;
  SELECT count(*) INTO o FROM players WHERE family_id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (2, 'players (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM payments;
  SELECT count(*) INTO o FROM payments WHERE family_id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (3, 'payments (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM invoices;
  SELECT count(*) INTO o FROM invoices WHERE family_id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (4, 'invoices (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM family_balance;
  SELECT count(*) INTO o FROM family_balance WHERE family_id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (5, 'family_balance (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM bookings;
  SELECT count(*) INTO o FROM bookings WHERE family_id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (6, 'bookings (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM charges;
  SELECT count(*) INTO o FROM charges WHERE family_id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (7, 'charges (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM user_roles;
  SELECT count(*) INTO o FROM user_roles WHERE user_id = '8724fe96-e812-4425-9abe-34a33a9b86c9';
  INSERT INTO test_results VALUES (8, 'user_roles (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' user_a=' || o);
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM audit_log;
  INSERT INTO test_results VALUES (9, 'audit_log (parent B)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0, admin-only)');
END $$;

DO $$ DECLARE t int; o int; BEGIN
  SELECT count(*) INTO t FROM vouchers;
  SELECT count(*) INTO o FROM vouchers WHERE family_id = '5762f614-699b-477b-a5fc-45cb77dadb51';
  INSERT INTO test_results VALUES (10, 'vouchers (parent B)', CASE WHEN o = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' family_a=' || o);
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM lesson_notes;
  INSERT INTO test_results VALUES (11, 'lesson_notes (parent B)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t);
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM push_subscriptions;
  INSERT INTO test_results VALUES (12, 'push_subscriptions (parent B)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t);
END $$;

-- ============================================================
-- COACH TESTS (should not see any financial data)
-- ============================================================
RESET role;
SELECT set_config('request.jwt.claims', '', true);
SELECT set_config('role', 'authenticated', true);
SELECT set_config('request.jwt.claims', json_build_object('sub', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'role', 'authenticated', 'email', 'rls-test-coach@test.local', 'aud', 'authenticated')::text, true);

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM payments;
  INSERT INTO test_results VALUES (13, 'payments (coach)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0)');
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM invoices;
  INSERT INTO test_results VALUES (14, 'invoices (coach)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0)');
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM family_balance;
  INSERT INTO test_results VALUES (15, 'family_balance (coach)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0)');
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM audit_log;
  INSERT INTO test_results VALUES (16, 'audit_log (coach)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0)');
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM charges;
  INSERT INTO test_results VALUES (17, 'charges (coach)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0)');
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM vouchers;
  INSERT INTO test_results VALUES (18, 'vouchers (coach)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0)');
END $$;

DO $$ DECLARE t int; BEGIN
  SELECT count(*) INTO t FROM families;
  INSERT INTO test_results VALUES (19, 'families (coach)', CASE WHEN t = 0 THEN 'PASS' ELSE 'FAIL' END, 'total=' || t || ' (expected 0, coaches have no family policy)');
END $$;

-- ============================================================
-- OUTPUT RESULTS
-- ============================================================
RESET role;
SELECT set_config('request.jwt.claims', '', true);

SELECT test_num, test_name, status, detail FROM test_results ORDER BY test_num;

-- ============================================================
-- CLEANUP
-- ============================================================
ALTER TABLE families DISABLE TRIGGER audit_families;
ALTER TABLE players DISABLE TRIGGER audit_players;
ALTER TABLE payments DISABLE TRIGGER audit_payments;
ALTER TABLE invoices DISABLE TRIGGER audit_invoices;
ALTER TABLE family_balance DISABLE TRIGGER audit_family_balance;
ALTER TABLE user_roles DISABLE TRIGGER audit_user_roles;

DELETE FROM user_roles WHERE user_id IN ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff');
DELETE FROM payments WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
DELETE FROM invoices WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
DELETE FROM family_balance WHERE family_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM players WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DELETE FROM coaches WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM families WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM auth.users WHERE id IN ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff');
DELETE FROM audit_log WHERE entity_id IN ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111');

ALTER TABLE families ENABLE TRIGGER audit_families;
ALTER TABLE players ENABLE TRIGGER audit_players;
ALTER TABLE payments ENABLE TRIGGER audit_payments;
ALTER TABLE invoices ENABLE TRIGGER audit_invoices;
ALTER TABLE family_balance ENABLE TRIGGER audit_family_balance;
ALTER TABLE user_roles ENABLE TRIGGER audit_user_roles;

COMMIT;
