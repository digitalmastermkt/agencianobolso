-- Security Fix Migration: Address Critical Vulnerabilities
-- Phase 1: Critical Data Protection

-- 1. Secure Event Registrations - Require Authentication
DROP POLICY IF EXISTS "event_registrations_create_only" ON public.event_registrations;

CREATE POLICY "event_registrations_authenticated_create_only" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Create rate limiting table for event registrations
CREATE TABLE IF NOT EXISTS public.event_registration_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_id UUID,
  registration_count INTEGER DEFAULT 1,
  last_registration TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.event_registration_rate_limit ENABLE ROW LEVEL SECURITY;

-- Rate limiting policies - only admins can manage
CREATE POLICY "rate_limit_admin_only" ON public.event_registration_rate_limit
FOR ALL USING (get_current_user_role() = 'admin');

-- 3. Strengthen Subscriber Data Access - Remove email-based access
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- New stricter subscriber policies - require authenticated user with user_id match only
CREATE POLICY "select_own_subscription_secure" ON public.subscribers
FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "update_own_subscription_secure" ON public.subscribers
FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "insert_subscription_secure" ON public.subscribers
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 4. Enhanced Profile Security - Remove email-based display name access
DROP POLICY IF EXISTS "Profiles are viewable with privacy protection" ON public.profiles;

-- New profile policy - authenticated users can only see profiles with non-email display names
CREATE POLICY "Profiles viewable with enhanced privacy" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    get_current_user_role() = 'admin' OR
    (display_name IS NOT NULL AND display_name !~ '^[^@]+@[^@]+\.[^@]+$')
  )
);

-- 5. Create audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies - only admins can view
CREATE POLICY "security_audit_admin_only" ON public.security_audit_log
FOR SELECT USING (get_current_user_role() = 'admin');

-- 6. Create function for rate limiting check
CREATE OR REPLACE FUNCTION public.check_event_registration_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 7. Create function for audit logging
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
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

-- 8. Create trigger for profile changes audit
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log role changes specifically
    IF OLD.role != NEW.role THEN
      PERFORM log_security_event(
        'role_change',
        'profiles',
        NEW.id,
        jsonb_build_object('old_role', OLD.role),
        jsonb_build_object('new_role', NEW.role)
      );
    END IF;
    
    -- Log general profile updates
    PERFORM log_security_event(
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

-- Create trigger for profile audit
DROP TRIGGER IF EXISTS trigger_audit_profile_changes ON public.profiles;
CREATE TRIGGER trigger_audit_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_changes();

-- 9. Update event registrations policy to include rate limiting
DROP POLICY IF EXISTS "event_registrations_authenticated_create_only" ON public.event_registrations;

CREATE POLICY "event_registrations_secure_create" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  check_event_registration_rate_limit()
);