-- Security Fix: Restrict community data access to authenticated users only
-- This prevents anonymous tracking and improves privacy

-- Update community posts policy to require authentication
DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Community posts are viewable by authenticated users" 
ON public.community_posts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update community comments policy to require authentication  
DROP POLICY IF EXISTS "Community comments are viewable by everyone" ON public.community_comments;
CREATE POLICY "Community comments are viewable by authenticated users"
ON public.community_comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update community post likes policy to require authentication
DROP POLICY IF EXISTS "Community post likes are viewable by everyone" ON public.community_post_likes;  
CREATE POLICY "Community post likes are viewable by authenticated users"
ON public.community_post_likes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add rate limiting table for form submissions (beyond event registrations)
CREATE TABLE IF NOT EXISTS public.form_submission_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  user_id uuid,
  form_type text NOT NULL,
  submission_count integer DEFAULT 1,
  last_submission timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(ip_address, form_type)
);

-- Enable RLS on rate limiting table
ALTER TABLE public.form_submission_rate_limit ENABLE ROW LEVEL SECURITY;

-- Only admins can manage rate limiting records
CREATE POLICY "form_rate_limit_admin_only" 
ON public.form_submission_rate_limit 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create function to check form submission rate limits
CREATE OR REPLACE FUNCTION public.check_form_rate_limit(form_name text, max_per_hour integer DEFAULT 10)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_ip INET;
  submission_count INTEGER;
  last_sub_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current IP (simplified - in production use proper IP detection)
  current_ip := '127.0.0.1'::INET;
  
  -- Check existing rate limit record
  SELECT fsr.submission_count, fsr.last_submission
  INTO submission_count, last_sub_time
  FROM public.form_submission_rate_limit fsr
  WHERE fsr.ip_address = current_ip
    AND fsr.form_type = form_name
    AND fsr.last_submission > now() - INTERVAL '1 hour';
  
  -- If no record or expired, allow submission
  IF submission_count IS NULL THEN
    INSERT INTO public.form_submission_rate_limit (ip_address, user_id, form_type, submission_count)
    VALUES (current_ip, auth.uid(), form_name, 1)
    ON CONFLICT (ip_address, form_type) DO UPDATE SET
      submission_count = 1,
      last_submission = now(),
      user_id = auth.uid();
    RETURN TRUE;
  END IF;
  
  -- Check if rate limit exceeded
  IF submission_count >= max_per_hour THEN
    RETURN FALSE;
  END IF;
  
  -- Update counter
  UPDATE public.form_submission_rate_limit
  SET submission_count = submission_count + 1,
      last_submission = now()
  WHERE ip_address = current_ip AND form_type = form_name;
  
  RETURN TRUE;
END;
$$;

-- Enhanced security logging function for authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(event_type text, details jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, old_values, new_values
  ) VALUES (
    auth.uid(), event_type, 'auth_events', NULL, details
  );
END;
$$;