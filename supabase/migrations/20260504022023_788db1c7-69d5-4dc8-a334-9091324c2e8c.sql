
-- 1. Restrict service-role policies on credits tables to actual service_role
DROP POLICY IF EXISTS "Service role can manage all credits" ON public.user_credits_balance;
CREATE POLICY "Service role can manage all credits"
ON public.user_credits_balance
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert transactions" ON public.user_credits_transactions;
CREATE POLICY "Service role can insert transactions"
ON public.user_credits_transactions
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Remove authenticated read on stripe_price_config (admins keep full access; edge functions use service role)
DROP POLICY IF EXISTS "authenticated_read_stripe_config" ON public.stripe_price_config;

-- 3. Replace broken IP-based rate limit with per-user rate limit
CREATE OR REPLACE FUNCTION public.check_event_registration_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  recent_count integer;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO recent_count
  FROM public.event_registrations
  WHERE user_id = uid
    AND created_at > now() - INTERVAL '1 hour';

  RETURN recent_count < 3;
END;
$function$;
