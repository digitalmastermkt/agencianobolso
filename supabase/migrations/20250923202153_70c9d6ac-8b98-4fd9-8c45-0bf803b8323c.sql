-- Add trial fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS daily_credits_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT false;

-- Add date field to user_credits_usage for daily tracking
ALTER TABLE public.user_credits_usage 
ADD COLUMN IF NOT EXISTS date_used DATE DEFAULT CURRENT_DATE;

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_user_credits_usage_date_user 
ON public.user_credits_usage(user_id, date_used);

-- Update existing records to have date_used
UPDATE public.user_credits_usage 
SET date_used = created_at::date 
WHERE date_used IS NULL;

-- Function to get daily credits usage
CREATE OR REPLACE FUNCTION public.get_user_daily_credits_usage(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(credits_used), 0)
  FROM public.user_credits_usage
  WHERE user_id = p_user_id 
    AND date_used = p_date
$function$;

-- Function to activate trial for new users
CREATE OR REPLACE FUNCTION public.activate_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Activate 7-day trial for new users
  NEW.trial_start_date = now();
  NEW.trial_end_date = now() + INTERVAL '7 days';
  NEW.is_trial_active = true;
  NEW.daily_credits_limit = 10;
  
  RETURN NEW;
END;
$function$;

-- Trigger to activate trial on profile creation
CREATE OR REPLACE TRIGGER activate_trial_on_profile_creation
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_user_trial();

-- Function to check if user trial is still active
CREATE OR REPLACE FUNCTION public.is_user_trial_active(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_trial_active AND trial_end_date > now()
     FROM public.profiles 
     WHERE user_id = p_user_id), 
    false
  )
$function$;