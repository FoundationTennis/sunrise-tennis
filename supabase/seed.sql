-- Seed: Maxim as admin coach, Somerton Park as venue

-- Insert venue
INSERT INTO venues (id, name, address, courts, notes)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Somerton Park Tennis Club',
  '40 Wilton Ave, Somerton Park SA 5044',
  4,
  'Primary venue for all FTD/Sunrise Tennis programs'
);

-- Insert Maxim as coach (user_id will be linked after auth signup)
INSERT INTO coaches (id, name, phone, email, status, is_owner)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Maxim',
  '0431 368 752',
  'foundationtennis@hotmail',
  'active',
  true
);

-- family_balance trigger will handle balances automatically
-- user_roles will be populated after Maxim creates his auth account
