-- Atualizar créditos mensais dos planos
UPDATE plan_settings SET monthly_credits = 15 WHERE plan = 'Essencial';
UPDATE plan_settings SET monthly_credits = 35 WHERE plan = 'Premium';
UPDATE plan_settings SET monthly_credits = 75 WHERE plan = 'Elite';

-- Adicionar coluna para limites de perfis de marca
ALTER TABLE plan_settings ADD COLUMN IF NOT EXISTS max_brand_profiles INTEGER DEFAULT 1;

-- Definir limites de perfis por plano
UPDATE plan_settings SET max_brand_profiles = 1 WHERE plan = 'Essencial';
UPDATE plan_settings SET max_brand_profiles = 3 WHERE plan = 'Premium';
UPDATE plan_settings SET max_brand_profiles = NULL WHERE plan = 'Elite'; -- NULL = ilimitado