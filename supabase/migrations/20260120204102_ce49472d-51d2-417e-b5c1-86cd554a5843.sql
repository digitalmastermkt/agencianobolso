-- Update plan_settings with the correct monthly credits values
UPDATE plan_settings 
SET monthly_credits = 10, description = 'Plano Essencial - Ideal para iniciantes' 
WHERE plan = 'Essencial';

UPDATE plan_settings 
SET monthly_credits = 25, description = 'Plano Premium - Para criadores ativos' 
WHERE plan = 'Premium';

UPDATE plan_settings 
SET monthly_credits = 50, description = 'Plano Elite - Para profissionais' 
WHERE plan = 'Elite';