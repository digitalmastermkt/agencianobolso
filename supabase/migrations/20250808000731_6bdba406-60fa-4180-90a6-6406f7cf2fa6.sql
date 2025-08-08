
-- 1) Tabela: Configurações por plano (créditos mensais, observações)
CREATE TABLE public.plan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL CHECK (plan IN ('Essencial','Premium','Elite')),
  monthly_credits integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan)
);

ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler
CREATE POLICY "plan_settings are viewable by everyone"
  ON public.plan_settings
  FOR SELECT
  USING (true);

-- Somente admin pode inserir/atualizar/excluir
CREATE POLICY "admins manage plan_settings"
  ON public.plan_settings
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Atualiza updated_at automaticamente
CREATE TRIGGER set_timestamp_plan_settings
BEFORE UPDATE ON public.plan_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Semente opcional (valores 0 para o admin editar depois)
INSERT INTO public.plan_settings (plan, monthly_credits, description)
VALUES 
  ('Essencial', 0, 'Plano Essencial'),
  ('Premium', 0, 'Plano Premium'),
  ('Elite', 0, 'Plano Elite')
ON CONFLICT (plan) DO NOTHING;


-- 2) Tabela: Liberações de cursos por plano
CREATE TABLE public.plan_courses_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL CHECK (plan IN ('Essencial','Premium','Elite')),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan, course_id)
);

ALTER TABLE public.plan_courses_access ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler (para o app saber o que mostrar)
CREATE POLICY "plan_courses_access readable by everyone"
  ON public.plan_courses_access
  FOR SELECT
  USING (true);

-- Somente admin pode gerenciar
CREATE POLICY "admins manage plan_courses_access"
  ON public.plan_courses_access
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_plan_courses_access_course
  ON public.plan_courses_access (course_id);


-- 3) Tabela: Liberações de agentes por plano
CREATE TABLE public.plan_agents_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL CHECK (plan IN ('Essencial','Premium','Elite')),
  agent_key text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan, agent_key)
);

ALTER TABLE public.plan_agents_access ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler (para o app saber o que mostrar)
CREATE POLICY "plan_agents_access readable by everyone"
  ON public.plan_agents_access
  FOR SELECT
  USING (true);

-- Somente admin pode gerenciar
CREATE POLICY "admins manage plan_agents_access"
  ON public.plan_agents_access
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_plan_agents_access_agent
  ON public.plan_agents_access (agent_key);
