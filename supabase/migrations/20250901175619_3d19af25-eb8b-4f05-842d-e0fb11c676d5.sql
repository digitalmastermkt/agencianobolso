-- Create table for storing Stripe price configurations
CREATE TABLE public.stripe_price_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  price_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_tier, billing_cycle)
);

-- Enable Row Level Security
ALTER TABLE public.stripe_price_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage stripe configurations
CREATE POLICY "admins_manage_stripe_config" ON public.stripe_price_config
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Create policy for authenticated users to read stripe configurations
CREATE POLICY "authenticated_read_stripe_config" ON public.stripe_price_config
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default price configurations
INSERT INTO public.stripe_price_config (plan_tier, billing_cycle, price_id) VALUES
('Essencial', 'monthly', 'price_1RtCJlL0y5sMsrd4ZJHcvV3A'),
('Premium', 'monthly', 'price_1RtCTGL0y5sMsrd4yRno549V'),
('Elite', 'monthly', 'price_1RtCyUL0y5sMsrd4j7Bgl4xT'),
('Essencial', 'annual', 'price_1RtwbYL0y5sMsrd4mqnLAsRK'),
('Premium', 'annual', 'price_1RtwejL0y5sMsrd40q0fAqKO'),
('Elite', 'annual', 'price_1RtwaZL0y5sMsrd4b3TDm2hA');

-- Create trigger for updating updated_at column
CREATE TRIGGER update_stripe_price_config_updated_at
BEFORE UPDATE ON public.stripe_price_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();