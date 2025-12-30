-- Add person_photos column to brand_profiles table
-- This stores an array of person photos with their analyses
ALTER TABLE public.brand_profiles 
ADD COLUMN IF NOT EXISTS person_photos JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.brand_profiles.person_photos IS 'Array of person photos with analyses: [{id, photo_url, analysis, name, created_at}]';