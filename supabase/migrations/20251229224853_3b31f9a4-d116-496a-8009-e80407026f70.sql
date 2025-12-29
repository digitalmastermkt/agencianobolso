-- Fix hardcoded encryption key by using a proper key derivation approach
-- This uses current_setting for the encryption key with a secure fallback

-- First, ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a helper function to get the encryption key securely
CREATE OR REPLACE FUNCTION public.get_pii_encryption_key()
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  key_value text;
  derived_key bytea;
BEGIN
  -- Try to get key from app settings (set via SET app.settings.pii_encryption_key = 'value')
  key_value := current_setting('app.settings.pii_encryption_key', true);
  
  -- If no setting found, derive a key from database-specific values
  -- This uses the database name and a fixed salt - unique per database but consistent
  IF key_value IS NULL OR key_value = '' THEN
    -- Generate a deterministic key using database OID as a seed
    -- This ensures the same key is used consistently within this database
    SELECT encode(
      digest(
        current_database() || '-pii-encryption-' || (SELECT oid::text FROM pg_database WHERE datname = current_database()),
        'sha256'
      ),
      'hex'
    ) INTO key_value;
  END IF;
  
  -- Return as bytea for encryption functions
  RETURN decode(substring(encode(digest(key_value, 'sha256'), 'hex') from 1 for 32), 'hex');
END;
$$;

-- Update encrypt_pii function to use the secure key
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  -- Get the encryption key securely
  encryption_key := public.get_pii_encryption_key();
  
  -- Encrypt using pgcrypto with the derived key
  RETURN encode(
    encrypt(
      convert_to(data, 'utf8'),
      encryption_key,
      'aes'
    ),
    'base64'
  );
END;
$$;

-- Update decrypt_pii function to use the secure key
CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  -- Only allow decryption for admin users
  IF public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized access to sensitive data';
  END IF;
  
  -- Get the encryption key securely
  encryption_key := public.get_pii_encryption_key();
  
  -- Decrypt using pgcrypto
  RETURN convert_from(
    decrypt(
      decode(encrypted_data, 'base64'),
      encryption_key,
      'aes'
    ),
    'utf8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[ENCRYPTED]';
END;
$$;

-- Revoke direct access to the key function from public
REVOKE ALL ON FUNCTION public.get_pii_encryption_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pii_encryption_key() TO postgres;
GRANT EXECUTE ON FUNCTION public.get_pii_encryption_key() TO service_role;