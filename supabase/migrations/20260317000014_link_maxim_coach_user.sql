-- Link Maxim's auth account to his coach record
-- Auth user_id: 8724fe96-e812-4425-9abe-34a33a9b86c9
-- Coach id: 00000000-0000-0000-0000-000000000002

UPDATE coaches
SET user_id = '8724fe96-e812-4425-9abe-34a33a9b86c9'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Ensure admin role exists in user_roles (idempotent)
INSERT INTO user_roles (user_id, role)
VALUES ('8724fe96-e812-4425-9abe-34a33a9b86c9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
