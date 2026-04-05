-- Add calendar_token to families for iCal feed authentication
-- Token is a random UUID that parents can share with calendar apps
-- No auth session needed — the token IS the credential

ALTER TABLE families ADD COLUMN IF NOT EXISTS calendar_token uuid DEFAULT NULL;

-- Index for fast lookup by token
CREATE INDEX IF NOT EXISTS idx_families_calendar_token ON families (calendar_token) WHERE calendar_token IS NOT NULL;

-- Note: families already has parent_families_select and parent_families_update policies
-- Parents can already read and update their own family row, so calendar_token is accessible
