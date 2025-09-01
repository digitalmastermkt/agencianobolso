-- Adicionar campos faltantes no profiles para melhor gerenciamento de usuários
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

-- Adicionar check constraint para status
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('ativo', 'inativo'));

-- Adicionar tabela para rastrear créditos consumidos pelos usuários
CREATE TABLE IF NOT EXISTS public.user_credits_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  month_year TEXT NOT NULL, -- formato: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits_usage
CREATE POLICY "Users can view their own credit usage"
ON public.user_credits_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit usage"
ON public.user_credits_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credit usage"
ON public.user_credits_usage
FOR ALL
USING (get_current_user_role() = 'admin');

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_credits_usage_user_month 
ON public.user_credits_usage (user_id, month_year);

CREATE INDEX IF NOT EXISTS idx_user_credits_usage_agent_type 
ON public.user_credits_usage (agent_type);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_user_credits_usage_updated_at
BEFORE UPDATE ON public.user_credits_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para notificações diretas aos usuários
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, success, error
  sent_by UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
ON public.user_notifications
FOR ALL
USING (get_current_user_role() = 'admin');

-- Adicionar trigger para updated_at
CREATE TRIGGER update_user_notifications_updated_at
BEFORE UPDATE ON public.user_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular créditos usados no mês atual
CREATE OR REPLACE FUNCTION public.get_user_monthly_credits_usage(p_user_id UUID, p_month_year TEXT DEFAULT to_char(now(), 'YYYY-MM'))
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(credits_used), 0)
  FROM public.user_credits_usage
  WHERE user_id = p_user_id 
    AND month_year = p_month_year
$$;