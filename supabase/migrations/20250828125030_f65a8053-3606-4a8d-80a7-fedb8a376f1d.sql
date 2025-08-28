-- Fix Security Linter Warnings: Function Search Path
-- Update functions to have secure search_path

-- 1. Fix check_event_registration_rate_limit function
CREATE OR REPLACE FUNCTION public.check_event_registration_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_ip INET;
  registration_count INTEGER;
  last_reg_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current IP (simplified for demo - in production use proper IP detection)
  current_ip := '127.0.0.1'::INET;
  
  -- Check existing rate limit record
  SELECT reg.registration_count, reg.last_registration
  INTO registration_count, last_reg_time
  FROM public.event_registration_rate_limit reg
  WHERE reg.ip_address = current_ip
    AND reg.last_registration > now() - INTERVAL '1 hour';
  
  -- If no record or expired, allow registration
  IF registration_count IS NULL THEN
    INSERT INTO public.event_registration_rate_limit (ip_address, user_id, registration_count)
    VALUES (current_ip, auth.uid(), 1)
    ON CONFLICT (ip_address) DO UPDATE SET
      registration_count = 1,
      last_registration = now(),
      user_id = auth.uid();
    RETURN TRUE;
  END IF;
  
  -- Check if rate limit exceeded (max 3 per hour)
  IF registration_count >= 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Update counter
  UPDATE public.event_registration_rate_limit
  SET registration_count = registration_count + 1,
      last_registration = now()
  WHERE ip_address = current_ip;
  
  RETURN TRUE;
END;
$$;

-- 2. Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

-- 3. Fix audit_profile_changes function
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log role changes specifically
    IF OLD.role != NEW.role THEN
      PERFORM public.log_security_event(
        'role_change',
        'profiles',
        NEW.id,
        jsonb_build_object('old_role', OLD.role),
        jsonb_build_object('new_role', NEW.role)
      );
    END IF;
    
    -- Log general profile updates
    PERFORM public.log_security_event(
      'profile_update',
      'profiles',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;