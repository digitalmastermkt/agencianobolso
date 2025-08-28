-- Update RLS policies to protect business intelligence data
-- This prevents competitors from accessing pricing and feature roadmaps

-- Drop existing public policies for plan_settings
DROP POLICY IF EXISTS "plan_settings are viewable by everyone" ON public.plan_settings;

-- Create new authenticated-only policy for plan_settings
CREATE POLICY "plan_settings viewable by authenticated users" 
ON public.plan_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Drop existing public policy for plan_agents_access
DROP POLICY IF EXISTS "plan_agents_access readable by everyone" ON public.plan_agents_access;

-- Create new authenticated-only policy for plan_agents_access
CREATE POLICY "plan_agents_access viewable by authenticated users" 
ON public.plan_agents_access 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Drop existing public policy for plan_courses_access
DROP POLICY IF EXISTS "plan_courses_access readable by everyone" ON public.plan_courses_access;

-- Create new authenticated-only policy for plan_courses_access
CREATE POLICY "plan_courses_access viewable by authenticated users" 
ON public.plan_courses_access 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Enhanced security monitoring functions

-- Create table for tracking authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  user_agent TEXT,
  email TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on auth_attempts
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for auth_attempts (admin only access)
CREATE POLICY "auth_attempts_admin_only" 
ON public.auth_attempts 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Function to log authentication attempts
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT false,
  p_failure_reason TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.auth_attempts (ip_address, user_agent, email, success, failure_reason)
  VALUES (p_ip_address, p_user_agent, p_email, p_success, p_failure_reason);
END;
$$;

-- Function to check for suspicious authentication patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_auth_activity(
  p_ip_address INET,
  p_time_window_minutes INTEGER DEFAULT 15,
  p_max_failures INTEGER DEFAULT 5
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  failure_count INTEGER;
BEGIN
  -- Count failed attempts from this IP in the time window
  SELECT COUNT(*)
  INTO failure_count
  FROM public.auth_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > now() - INTERVAL '1 minute' * p_time_window_minutes;
  
  RETURN failure_count >= p_max_failures;
END;
$$;

-- Function to get security statistics for admins
CREATE OR REPLACE FUNCTION public.get_security_stats()
RETURNS TABLE(
  total_auth_attempts BIGINT,
  failed_attempts BIGINT,
  successful_attempts BIGINT,
  unique_ips BIGINT,
  suspicious_ips BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only allow admin access
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized access to security statistics';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_auth_attempts,
    COUNT(*) FILTER (WHERE success = false) as failed_attempts,
    COUNT(*) FILTER (WHERE success = true) as successful_attempts,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT ip_address) FILTER (
      WHERE ip_address IN (
        SELECT DISTINCT aa.ip_address
        FROM public.auth_attempts aa
        WHERE aa.created_at > now() - INTERVAL '24 hours'
        GROUP BY aa.ip_address
        HAVING COUNT(*) FILTER (WHERE success = false) >= 10
      )
    ) as suspicious_ips
  FROM public.auth_attempts
  WHERE created_at > now() - INTERVAL '24 hours';
END;
$$;

-- Enhanced rate limiting for authentication
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_ip_address INET,
  p_email TEXT DEFAULT NULL,
  p_max_per_hour INTEGER DEFAULT 20,
  p_max_per_minute INTEGER DEFAULT 5
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  hourly_count INTEGER;
  minute_count INTEGER;
BEGIN
  -- Check hourly limit for IP
  SELECT COUNT(*)
  INTO hourly_count
  FROM public.auth_attempts
  WHERE ip_address = p_ip_address
    AND created_at > now() - INTERVAL '1 hour';
    
  IF hourly_count >= p_max_per_hour THEN
    RETURN false;
  END IF;
  
  -- Check per-minute limit for IP
  SELECT COUNT(*)
  INTO minute_count
  FROM public.auth_attempts
  WHERE ip_address = p_ip_address
    AND created_at > now() - INTERVAL '1 minute';
    
  IF minute_count >= p_max_per_minute THEN
    RETURN false;
  END IF;
  
  -- If email provided, check email-specific limits
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*)
    INTO hourly_count
    FROM public.auth_attempts
    WHERE email = p_email
      AND created_at > now() - INTERVAL '1 hour';
      
    IF hourly_count >= (p_max_per_hour / 2) THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Create index for better performance on auth_attempts
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_created 
ON public.auth_attempts (ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_created 
ON public.auth_attempts (email, created_at) 
WHERE email IS NOT NULL;