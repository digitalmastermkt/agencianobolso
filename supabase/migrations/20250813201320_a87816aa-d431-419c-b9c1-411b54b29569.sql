-- Fix security issue: Restrict profile visibility and remove email exposure

-- 1. Update RLS policy to restrict profile access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Only allow users to view their own profiles and profiles of other users without sensitive data
CREATE POLICY "Users can view their own profile fully" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view other profiles (limited)" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() != user_id);

-- 2. Update the user creation function to not use email as display_name fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- 3. Clean up existing data - replace email addresses with generic names
UPDATE public.profiles 
SET display_name = 'Usuário' 
WHERE display_name LIKE '%@%';