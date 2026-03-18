-- Medical data encryption using pgcrypto (extension already loaded in migration 001)
--
-- Strategy: encrypt medical_notes and physical_notes at rest using pgp_sym_encrypt.
-- The encryption key is stored in Supabase Vault for security.
--
-- IMPORTANT: Before running this migration, create the Vault secret:
--   SELECT vault.create_secret('YOUR-GENERATED-KEY-HERE', 'medical_encryption_key', 'Key for encrypting medical data');
-- Generate a key with: SELECT encode(gen_random_bytes(32), 'hex');

-- Helper function to encrypt text
CREATE OR REPLACE FUNCTION encrypt_medical(plaintext text)
RETURNS text AS $$
  SELECT CASE
    WHEN plaintext IS NULL OR plaintext = '' THEN plaintext
    ELSE encode(
      extensions.pgp_sym_encrypt(
        plaintext,
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'medical_encryption_key')
      ),
      'base64'
    )
  END;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to decrypt text
CREATE OR REPLACE FUNCTION decrypt_medical(ciphertext text)
RETURNS text AS $$
  SELECT CASE
    WHEN ciphertext IS NULL OR ciphertext = '' THEN ciphertext
    ELSE extensions.pgp_sym_decrypt(
      decode(ciphertext, 'base64')::bytea,
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'medical_encryption_key')
    )
  END;
$$ LANGUAGE sql SECURITY DEFINER;

-- Auto-encrypt on INSERT or UPDATE
CREATE OR REPLACE FUNCTION encrypt_player_medical_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if value changed and isn't already encrypted (base64 check)
  IF NEW.medical_notes IS NOT NULL AND NEW.medical_notes != '' THEN
    -- Skip if already looks like base64-encoded ciphertext (starts with common pgp prefix)
    IF NEW.medical_notes NOT LIKE 'ww0E%' AND NEW.medical_notes NOT LIKE 'ww4E%' THEN
      NEW.medical_notes := encrypt_medical(NEW.medical_notes);
    END IF;
  END IF;

  IF NEW.physical_notes IS NOT NULL AND NEW.physical_notes != '' THEN
    IF NEW.physical_notes NOT LIKE 'ww0E%' AND NEW.physical_notes NOT LIKE 'ww4E%' THEN
      NEW.physical_notes := encrypt_medical(NEW.physical_notes);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER encrypt_medical_on_write
  BEFORE INSERT OR UPDATE OF medical_notes, physical_notes ON players
  FOR EACH ROW EXECUTE FUNCTION encrypt_player_medical_trigger();

-- RPC function for decrypted reads (called from application code)
CREATE OR REPLACE FUNCTION get_player_medical_notes(p_player_id uuid)
RETURNS TABLE(medical_notes text, physical_notes text) AS $$
  SELECT
    decrypt_medical(p.medical_notes) as medical_notes,
    decrypt_medical(p.physical_notes) as physical_notes
  FROM players p
  WHERE p.id = p_player_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Migrate existing plaintext data: re-save to trigger encryption
-- This UPDATE triggers the encrypt_medical_on_write trigger
UPDATE players
SET medical_notes = medical_notes
WHERE medical_notes IS NOT NULL AND medical_notes != '';

UPDATE players
SET physical_notes = physical_notes
WHERE physical_notes IS NOT NULL AND physical_notes != '';
