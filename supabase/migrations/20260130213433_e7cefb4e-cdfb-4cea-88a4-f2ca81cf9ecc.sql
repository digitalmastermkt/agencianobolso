-- Parte 1: Desativar trial automático para novos usuários
-- Novos usuários começam SEM trial e SEM créditos
CREATE OR REPLACE FUNCTION public.activate_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Novos usuários NÃO recebem trial automaticamente
  -- Créditos são alocados apenas via assinatura de plano
  NEW.trial_start_date = NULL;
  NEW.trial_end_date = NULL;
  NEW.is_trial_active = false;
  NEW.daily_credits_limit = 0;
  
  RETURN NEW;
END;
$$;

-- Parte 2: Popular tabela plan_agents_access com o Diretor de Arte
-- Por enquanto, apenas o Diretor de Arte está disponível para todos os planos
INSERT INTO public.plan_agents_access (plan, agent_key, label) VALUES
  ('Essencial', 'diretor-arte', 'Diretor de Arte'),
  ('Premium', 'diretor-arte', 'Diretor de Arte'),
  ('Elite', 'diretor-arte', 'Diretor de Arte')
ON CONFLICT DO NOTHING;