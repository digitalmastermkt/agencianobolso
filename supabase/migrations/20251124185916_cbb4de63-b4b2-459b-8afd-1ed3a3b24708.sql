-- Create user_favorites table
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  input_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_type, generated_content)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON public.user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_agent_type ON public.user_favorites(agent_type);
CREATE INDEX idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.user_favorites IS 'Stores user favorite AI generations for quick access';
COMMENT ON COLUMN public.user_favorites.agent_type IS 'Type of agent used: vendas, storytelling, viral, interacao, conexao, banner';
COMMENT ON COLUMN public.user_favorites.generated_content IS 'The AI generated content that was favorited';
COMMENT ON COLUMN public.user_favorites.input_data IS 'Form data used to generate the content';