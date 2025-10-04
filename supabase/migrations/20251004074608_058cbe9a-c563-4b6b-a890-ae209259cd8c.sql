-- Drop the problematic RLS policy that exposes WhatsApp numbers
DROP POLICY IF EXISTS "Profiles viewable with enhanced privacy" ON public.profiles;

-- Create strict policy: only owner and admin can view full profiles
CREATE POLICY "Profiles viewable by owner and admin only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR get_current_user_role() = 'admin'
);

-- Create a public profiles view with only safe, non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  bio
FROM public.profiles
WHERE display_name IS NOT NULL;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add comment explaining the security design
COMMENT ON VIEW public.public_profiles IS 'Public view of user profiles containing only non-sensitive information (display_name, avatar_url, bio). Excludes WhatsApp, role, trial info, and other PII. Used for community features and public user displays.';