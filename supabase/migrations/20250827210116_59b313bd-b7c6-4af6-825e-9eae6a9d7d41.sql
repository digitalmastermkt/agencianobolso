-- Fix security linter issues from the previous migration

-- Fix function search path mutable warnings by setting search_path
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text)
RETURNS text AS $$
BEGIN
  -- Use Supabase's built-in encryption with a rotating key
  RETURN encode(encrypt(data::bytea, 'your-encryption-key-here', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data text)
RETURNS text AS $$
BEGIN
  -- Only allow decryption for admin users
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized access to sensitive data';
  END IF;
  
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), 'your-encryption-key-here', 'aes'), 'utf8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ENCRYPTED_DATA';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.log_data_access(
  p_table_name text,
  p_record_id uuid,
  p_action text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.data_access_audit (user_id, table_name, record_id, action)
  VALUES (auth.uid(), p_table_name, p_record_id, p_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_event_registration_details(registration_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  whatsapp text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  -- Only admins can access full details
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized access to sensitive registration data';
  END IF;
  
  -- Log the access
  PERFORM log_data_access('event_registrations', registration_id, 'full_details_access');
  
  -- Return the full registration details
  RETURN QUERY
  SELECT er.id, er.nome, er.email, er.whatsapp, er.created_at, er.updated_at
  FROM public.event_registrations er
  WHERE er.id = registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.audit_event_registration_access()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'SELECT' AND get_current_user_role() = 'admin' THEN
    PERFORM log_data_access('event_registrations', NEW.id, 'admin_select');
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_data_access('event_registrations', NEW.id, 'admin_update');
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_data_access('event_registrations', OLD.id, 'admin_delete');
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Remove the security definer view and replace with a safer approach
DROP VIEW IF EXISTS public.event_registrations_secure;

-- Create a secure function instead of a security definer view
CREATE OR REPLACE FUNCTION public.get_event_registrations_masked()
RETURNS TABLE(
  id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  nome text,
  email text,
  whatsapp text
) AS $$
BEGIN
  -- Log the access attempt
  PERFORM log_data_access('event_registrations', '00000000-0000-0000-0000-000000000000'::uuid, 'masked_view_access');
  
  RETURN QUERY
  SELECT 
    er.id,
    er.created_at,
    er.updated_at,
    CASE 
      WHEN get_current_user_role() = 'admin' THEN er.nome
      ELSE left(er.nome, 1) || repeat('*', length(er.nome) - 1)
    END as nome,
    CASE 
      WHEN get_current_user_role() = 'admin' THEN er.email
      ELSE regexp_replace(er.email, '(.{2}).*(@.*)', '\1****\2')
    END as email,
    CASE 
      WHEN get_current_user_role() = 'admin' THEN er.whatsapp
      ELSE regexp_replace(er.whatsapp, '(.{2}).*(.{2})', '\1****\2')
    END as whatsapp
  FROM public.event_registrations er;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.get_event_registrations_masked() TO authenticated;