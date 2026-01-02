-- Create agent availability table for MVP control
CREATE TABLE public.agent_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text UNIQUE NOT NULL,
  agent_name text NOT NULL,
  is_available boolean DEFAULT false,
  coming_soon_message text DEFAULT 'Em breve',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert all agents (only diretor-arte is available for MVP)
INSERT INTO public.agent_availability (agent_key, agent_name, is_available, display_order) VALUES
('diretor-arte', 'Diretor de Arte', true, 1),
('vendas', 'Agente de Vendas', false, 2),
('storytelling', 'Agente de Storytelling', false, 3),
('viral', 'Agente Viral', false, 4),
('interacao', 'Agente de Interação', false, 5),
('conexao', 'Agente de Conexão', false, 6);

-- Enable RLS
ALTER TABLE public.agent_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read agent availability
CREATE POLICY "agent_availability_public_read"
ON public.agent_availability
FOR SELECT
USING (true);

-- Admins can manage agent availability
CREATE POLICY "agent_availability_admin_manage"
ON public.agent_availability
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_agent_availability_updated_at
BEFORE UPDATE ON public.agent_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();