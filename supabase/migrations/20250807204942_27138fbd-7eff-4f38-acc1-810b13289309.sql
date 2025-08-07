
-- Create subscribers table to track subscription info per user
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: users can view their own subscription record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscribers' 
      AND policyname = 'select_own_subscription'
  ) THEN
    CREATE POLICY "select_own_subscription" ON public.subscribers
      FOR SELECT
      USING (user_id = auth.uid() OR email = auth.email());
  END IF;
END$$;

-- Policy: users can insert their own subscription record (optional; edge functions bypass via service key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscribers' 
      AND policyname = 'insert_subscription'
  ) THEN
    CREATE POLICY "insert_subscription" ON public.subscribers
      FOR INSERT
      WITH CHECK (user_id = auth.uid() OR email = auth.email());
  END IF;
END$$;

-- Policy: users can update their own subscription record (optional; edge functions bypass via service key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscribers' 
      AND policyname = 'update_own_subscription'
  ) THEN
    CREATE POLICY "update_own_subscription" ON public.subscribers
      FOR UPDATE
      USING (user_id = auth.uid() OR email = auth.email());
  END IF;
END$$;

-- Keep updated_at fresh on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_timestamp_on_subscribers'
  ) THEN
    CREATE TRIGGER set_timestamp_on_subscribers
      BEFORE UPDATE ON public.subscribers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;
