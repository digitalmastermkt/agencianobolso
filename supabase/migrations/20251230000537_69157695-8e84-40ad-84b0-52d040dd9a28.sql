-- Create brand_profiles table for persistent brand identities
CREATE TABLE public.brand_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  colors TEXT[] DEFAULT '{}',
  typography JSONB DEFAULT '{}',
  visual_style TEXT,
  mood TEXT,
  recurring_elements TEXT[] DEFAULT '{}',
  overall_description TEXT,
  instagram_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_projects table for campaigns
CREATE TABLE public.brand_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES public.brand_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  person_photo_url TEXT,
  person_analysis JSONB,
  default_formats TEXT[] DEFAULT ARRAY['feed'],
  variations_count INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_profiles
CREATE POLICY "Users can view their own brand profiles"
ON public.brand_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brand profiles"
ON public.brand_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand profiles"
ON public.brand_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand profiles"
ON public.brand_profiles FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for brand_projects
CREATE POLICY "Users can view their own brand projects"
ON public.brand_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brand projects"
ON public.brand_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand projects"
ON public.brand_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand projects"
ON public.brand_projects FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
CREATE INDEX idx_brand_projects_user_id ON public.brand_projects(user_id);
CREATE INDEX idx_brand_projects_brand_profile_id ON public.brand_projects(brand_profile_id);

-- Trigger for updated_at on brand_profiles
CREATE TRIGGER update_brand_profiles_updated_at
BEFORE UPDATE ON public.brand_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on brand_projects
CREATE TRIGGER update_brand_projects_updated_at
BEFORE UPDATE ON public.brand_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();