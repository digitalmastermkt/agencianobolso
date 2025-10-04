-- Drop the view that's causing the security warning
DROP VIEW IF EXISTS public.public_profiles;

-- Create a proper table for public profiles
CREATE TABLE public.public_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read public profiles
CREATE POLICY "Public profiles readable by authenticated users"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (display_name IS NOT NULL);

-- Allow users to update their own public profile
CREATE POLICY "Users can update their own public profile"
ON public.public_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own public profile
CREATE POLICY "Users can insert their own public profile"
ON public.public_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to sync public_profiles from profiles
CREATE OR REPLACE FUNCTION sync_public_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only sync if display_name is set
  IF NEW.display_name IS NOT NULL THEN
    INSERT INTO public.public_profiles (user_id, display_name, avatar_url, bio, updated_at)
    VALUES (NEW.user_id, NEW.display_name, NEW.avatar_url, NEW.bio, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      bio = EXCLUDED.bio,
      updated_at = NOW();
  ELSE
    -- If display_name is cleared, remove from public profiles
    DELETE FROM public.public_profiles WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-sync profiles to public_profiles
CREATE TRIGGER sync_public_profile_on_change
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_public_profile();

-- Populate existing data
INSERT INTO public.public_profiles (user_id, display_name, avatar_url, bio)
SELECT user_id, display_name, avatar_url, bio
FROM public.profiles
WHERE display_name IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE public.public_profiles IS 'Public-facing user profiles containing only non-sensitive information. Automatically synced from profiles table. Used for community features.';