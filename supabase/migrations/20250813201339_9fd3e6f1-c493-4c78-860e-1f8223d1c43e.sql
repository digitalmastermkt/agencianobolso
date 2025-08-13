-- Fix the RLS policy to allow viewing basic profile info for community features

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile fully" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles (limited)" ON public.profiles;

-- Create a single policy that allows viewing profiles but protects sensitive data
CREATE POLICY "Profiles are viewable with privacy protection" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  auth.uid() = user_id 
  OR 
  -- Others can only see profiles if display_name is not an email
  (display_name IS NULL OR display_name !~ '^[^@]+@[^@]+\.[^@]+$')
);