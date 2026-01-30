-- Desativar trial para TODOS os usuários existentes
-- Apenas assinantes pagos ou admin devem ter acesso
UPDATE profiles
SET 
  is_trial_active = false,
  trial_start_date = NULL,
  trial_end_date = NULL,
  daily_credits_limit = 0
WHERE is_trial_active = true;