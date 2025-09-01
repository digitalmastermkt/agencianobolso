-- Corrigir créditos mensais dos planos para serem coerentes
UPDATE public.plan_settings 
SET monthly_credits = 50, description = 'Plano Essencial - Ideal para iniciantes'
WHERE plan = 'Essencial';

UPDATE public.plan_settings 
SET monthly_credits = 200, description = 'Plano Premium - Para usuários intermediários'
WHERE plan = 'Premium';

UPDATE public.plan_settings 
SET monthly_credits = 500, description = 'Plano Elite - Para usuários avançados'
WHERE plan = 'Elite';