-- Create table for project banner generations history
CREATE TABLE public.project_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  banner_text TEXT,
  cta TEXT,
  formats TEXT[] NOT NULL DEFAULT ARRAY['feed']::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own generations
CREATE POLICY "Users can view their own project generations"
ON public.project_generations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own generations
CREATE POLICY "Users can create their own project generations"
ON public.project_generations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own generations
CREATE POLICY "Users can delete their own project generations"
ON public.project_generations
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_project_generations_project_id ON public.project_generations(project_id);
CREATE INDEX idx_project_generations_user_id ON public.project_generations(user_id);