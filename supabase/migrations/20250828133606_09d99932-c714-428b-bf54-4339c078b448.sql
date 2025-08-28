-- Create trigger to automatically encrypt sensitive data on insert
CREATE OR REPLACE FUNCTION public.encrypt_event_registration_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Encrypt sensitive fields before storing
  NEW.nome = encrypt_pii(NEW.nome);
  NEW.email = encrypt_pii(NEW.email);
  NEW.whatsapp = encrypt_pii(NEW.whatsapp);
  
  -- Log the registration creation for audit purposes
  PERFORM log_security_event(
    'event_registration_created',
    'event_registrations',
    NEW.id,
    NULL,
    jsonb_build_object('encrypted', true)
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic encryption on insert
CREATE TRIGGER encrypt_event_registration_trigger
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_event_registration_data();

-- Create function for admins to get decrypted registration data
CREATE OR REPLACE FUNCTION public.get_decrypted_event_registrations()
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  whatsapp text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only admins can access decrypted data
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized access to decrypted registration data';
  END IF;
  
  -- Log the access for audit purposes
  PERFORM log_security_event(
    'event_registrations_decrypted_access',
    'event_registrations',
    NULL,
    NULL,
    jsonb_build_object('admin_access', true)
  );
  
  -- Return decrypted data
  RETURN QUERY
  SELECT 
    er.id,
    decrypt_pii(er.nome) as nome,
    decrypt_pii(er.email) as email,
    decrypt_pii(er.whatsapp) as whatsapp,
    er.created_at,
    er.updated_at
  FROM public.event_registrations er
  ORDER BY er.created_at DESC;
END;
$function$;

-- Create function to get single decrypted registration (for admin details view)
CREATE OR REPLACE FUNCTION public.get_decrypted_event_registration(registration_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  whatsapp text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only admins can access decrypted data
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized access to decrypted registration data';
  END IF;
  
  -- Log the specific access for audit purposes
  PERFORM log_security_event(
    'event_registration_decrypted_single_access',
    'event_registrations',
    registration_id,
    NULL,
    jsonb_build_object('admin_access', true)
  );
  
  -- Return decrypted data for specific registration
  RETURN QUERY
  SELECT 
    er.id,
    decrypt_pii(er.nome) as nome,
    decrypt_pii(er.email) as email,
    decrypt_pii(er.whatsapp) as whatsapp,
    er.created_at,
    er.updated_at
  FROM public.event_registrations er
  WHERE er.id = registration_id;
END;
$function$;