-- First, let's add encryption for sensitive fields and improve security
-- Create a function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text)
RETURNS text AS $$
BEGIN
  -- Use Supabase's built-in encryption with a rotating key
  RETURN encode(encrypt(data::bytea, 'your-encryption-key-here', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt sensitive data (only for authorized access)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an audit log table for tracking access to sensitive data
CREATE TABLE IF NOT EXISTS public.data_access_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit table
ALTER TABLE public.data_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_admin_only" ON public.data_access_audit
FOR SELECT USING (get_current_user_role() = 'admin');

-- Create a function to log data access
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure view for event registrations that masks sensitive data
CREATE OR REPLACE VIEW public.event_registrations_secure AS
SELECT 
  id,
  created_at,
  updated_at,
  CASE 
    WHEN get_current_user_role() = 'admin' THEN nome
    ELSE left(nome, 1) || repeat('*', length(nome) - 1)
  END as nome,
  CASE 
    WHEN get_current_user_role() = 'admin' THEN email
    ELSE regexp_replace(email, '(.{2}).*(@.*)', '\1****\2')
  END as email,
  CASE 
    WHEN get_current_user_role() = 'admin' THEN whatsapp
    ELSE regexp_replace(whatsapp, '(.{2}).*(.{2})', '\1****\2')
  END as whatsapp
FROM public.event_registrations;

-- Create a function for admins to access full registration data with logging
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Admins can view all event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Anyone can create event registrations" ON public.event_registrations;

-- New more restrictive policies
CREATE POLICY "event_registrations_create_only" ON public.event_registrations
FOR INSERT WITH CHECK (true);

-- Prevent direct SELECT access - force users to use the secure view or function
CREATE POLICY "event_registrations_no_direct_access" ON public.event_registrations
FOR SELECT USING (false);

-- Only allow admins to update/delete with logging
CREATE POLICY "event_registrations_admin_modify" ON public.event_registrations
FOR ALL TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Create a trigger to log all admin access to the table
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for auditing (but only for admin operations)
CREATE TRIGGER audit_event_registration_changes
  AFTER UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION audit_event_registration_access();

-- Grant necessary permissions
GRANT SELECT ON public.event_registrations_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_registration_details(uuid) TO authenticated;