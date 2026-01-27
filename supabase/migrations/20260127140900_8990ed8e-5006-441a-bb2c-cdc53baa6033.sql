-- Fix profiles RLS policy to use has_role() instead of get_current_user_role()
-- This removes dependency on the legacy function and uses the more secure has_role() implementation

-- Drop the old policy that uses get_current_user_role()
DROP POLICY IF EXISTS "Profiles viewable by owner and admin only" ON public.profiles;

-- Create new policy using the secure has_role() function
CREATE POLICY "Profiles viewable by owner and admin only"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)
);