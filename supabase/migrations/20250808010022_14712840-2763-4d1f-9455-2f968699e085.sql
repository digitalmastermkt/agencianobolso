
-- 1) Planos (plan_settings) - insere apenas se não existir pelo nome do plano
INSERT INTO public.plan_settings (plan, monthly_credits, description)
SELECT 'Gratuito', 0, 'Free – teste: 1 agente (Conexão). Sem créditos, Promptoteca, Comunidade, suporte, personalização e sem botão de Gerenciar Assinatura.'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_settings WHERE plan = 'Gratuito');

INSERT INTO public.plan_settings (plan, monthly_credits, description)
SELECT 'Essencial', 0, '3 agentes (Conexão, Interação, Banner). Promptoteca, Comunidade, suporte básico por e-mail. Créditos mensais a definir no Admin.'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_settings WHERE plan = 'Essencial');

INSERT INTO public.plan_settings (plan, monthly_credits, description)
SELECT 'Premium', 0, 'Tudo do Essencial + 5 agentes (inclui Vendas e Storytelling). Mais créditos (a definir no Admin), Promptoteca avançada, suporte prioritário (e-mail + chat), personalização básica e acesso ao botão Gerenciar Assinatura.'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_settings WHERE plan = 'Premium');

INSERT INTO public.plan_settings (plan, monthly_credits, description)
SELECT 'Elite', 0, 'Tudo do Premium + todos os agentes (inclusive futuros), maior volume de créditos (a definir no Admin), White Label básico (nome, logo, descrição), sugestão automática de prompts, painel Admin próprio, suporte premium e atualizações automáticas.'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_settings WHERE plan = 'Elite');


-- 2) Agentes por plano (plan_agents_access) - insere se não existir a combinação (plan, agent_key)
-- Helper CTEs para evitar repetição
WITH desired AS (
  SELECT 'Gratuito'::text AS plan, 'conexao'::text AS agent_key, 'Agente Conexão'::text AS label UNION ALL
  SELECT 'Essencial','conexao','Agente Conexão' UNION ALL
  SELECT 'Essencial','interacao','Agente Interação' UNION ALL
  SELECT 'Essencial','banner','Agente Banner' UNION ALL
  SELECT 'Premium','conexao','Agente Conexão' UNION ALL
  SELECT 'Premium','interacao','Agente Interação' UNION ALL
  SELECT 'Premium','banner','Agente Banner' UNION ALL
  SELECT 'Premium','vendas','Agente Vendas' UNION ALL
  SELECT 'Premium','storytelling','Agente Storytelling' UNION ALL
  SELECT 'Elite','conexao','Agente Conexão' UNION ALL
  SELECT 'Elite','interacao','Agente Interação' UNION ALL
  SELECT 'Elite','banner','Agente Banner' UNION ALL
  SELECT 'Elite','vendas','Agente Vendas' UNION ALL
  SELECT 'Elite','storytelling','Agente Storytelling' UNION ALL
  SELECT 'Elite','viral','Agente Viral'
)
INSERT INTO public.plan_agents_access (plan, agent_key, label)
SELECT d.plan, d.agent_key, d.label
FROM desired d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.plan_agents_access paa
  WHERE paa.plan = d.plan AND paa.agent_key = d.agent_key
);
