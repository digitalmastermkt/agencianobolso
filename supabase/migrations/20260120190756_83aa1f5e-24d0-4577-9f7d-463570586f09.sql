-- =====================================================
-- SISTEMA DE CRÉDITOS - TABELAS E FUNÇÕES
-- =====================================================

-- 1. Tabela de saldo de créditos do usuário
CREATE TABLE public.user_credits_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  credits_monthly_limit INTEGER NOT NULL DEFAULT 0,
  credits_extra INTEGER NOT NULL DEFAULT 0,
  current_billing_period_start TIMESTAMP WITH TIME ZONE,
  current_billing_period_end TIMESTAMP WITH TIME ZONE,
  last_reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de transações de créditos (auditoria)
CREATE TABLE public.user_credits_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  action_type TEXT,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_credits_balance_user_id ON public.user_credits_balance(user_id);
CREATE INDEX idx_credits_transactions_user_id ON public.user_credits_transactions(user_id);
CREATE INDEX idx_credits_transactions_created_at ON public.user_credits_transactions(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.user_credits_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies para user_credits_balance
CREATE POLICY "Users can view their own credits balance"
ON public.user_credits_balance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
ON public.user_credits_balance FOR ALL
USING (true)
WITH CHECK (true);

-- 5. RLS Policies para user_credits_transactions
CREATE POLICY "Users can view their own transactions"
ON public.user_credits_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
ON public.user_credits_transactions FOR INSERT
WITH CHECK (true);

-- 6. Função para debitar créditos
CREATE OR REPLACE FUNCTION public.debit_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT credits_balance + credits_extra INTO v_current_balance
  FROM user_credits_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no balance record exists, return error
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não possui saldo de créditos',
      'balance', 0
    );
  END IF;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Debit from extra credits first, then monthly
  UPDATE user_credits_balance
  SET 
    credits_extra = GREATEST(0, credits_extra - p_amount),
    credits_balance = CASE 
      WHEN credits_extra >= p_amount THEN credits_balance
      ELSE credits_balance - (p_amount - credits_extra)
    END,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO user_credits_transactions (
    user_id, amount, balance_after, transaction_type, action_type, reference_id, description
  ) VALUES (
    p_user_id, -p_amount, v_new_balance, 'debit', p_action_type, p_reference_id, p_description
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_after', v_new_balance,
    'debited', p_amount
  );
END;
$$;

-- 7. Função para reembolsar créditos
CREATE OR REPLACE FUNCTION public.refund_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_original_transaction_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'Reembolso'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Add credits back to balance
  UPDATE user_credits_balance
  SET 
    credits_balance = credits_balance + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_balance + credits_extra INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Record refund transaction
  INSERT INTO user_credits_transactions (
    user_id, amount, balance_after, transaction_type, action_type, reference_id, description
  ) VALUES (
    p_user_id, p_amount, v_new_balance, 'refund', 'refund', p_original_transaction_id, p_reason
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_after', v_new_balance,
    'refunded', p_amount
  );
END;
$$;

-- 8. Função para obter saldo de créditos
CREATE OR REPLACE FUNCTION public.get_user_credits_balance(p_user_id UUID)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_extra INTEGER,
  credits_total INTEGER,
  credits_monthly_limit INTEGER,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ucb.credits_balance,
    ucb.credits_extra,
    ucb.credits_balance + ucb.credits_extra AS credits_total,
    ucb.credits_monthly_limit,
    ucb.current_billing_period_start,
    ucb.current_billing_period_end
  FROM user_credits_balance ucb
  WHERE ucb.user_id = p_user_id;
END;
$$;

-- 9. Função para resetar créditos mensais
CREATE OR REPLACE FUNCTION public.reset_monthly_credits(
  p_user_id UUID,
  p_monthly_limit INTEGER,
  p_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  p_period_end TIMESTAMP WITH TIME ZONE DEFAULT now() + interval '1 month'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Upsert the balance record
  INSERT INTO user_credits_balance (
    user_id, credits_balance, credits_monthly_limit, 
    current_billing_period_start, current_billing_period_end, last_reset_at
  ) VALUES (
    p_user_id, p_monthly_limit, p_monthly_limit,
    p_period_start, p_period_end, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    credits_balance = p_monthly_limit,
    credits_monthly_limit = p_monthly_limit,
    current_billing_period_start = p_period_start,
    current_billing_period_end = p_period_end,
    last_reset_at = now(),
    updated_at = now();

  -- Record transaction
  INSERT INTO user_credits_transactions (
    user_id, amount, balance_after, transaction_type, action_type, description
  ) VALUES (
    p_user_id, p_monthly_limit, p_monthly_limit, 'subscription', 'monthly_reset', 
    'Reset mensal de créditos - Limite: ' || p_monthly_limit
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', p_monthly_limit,
    'monthly_limit', p_monthly_limit
  );
END;
$$;

-- 10. Função para adicionar créditos extras (compra avulsa)
CREATE OR REPLACE FUNCTION public.add_extra_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Compra de créditos extras'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Add extra credits
  UPDATE user_credits_balance
  SET 
    credits_extra = credits_extra + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_balance + credits_extra INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    -- Create balance record if doesn't exist
    INSERT INTO user_credits_balance (user_id, credits_extra)
    VALUES (p_user_id, p_amount)
    RETURNING credits_balance + credits_extra INTO v_new_balance;
  END IF;

  -- Record transaction
  INSERT INTO user_credits_transactions (
    user_id, amount, balance_after, transaction_type, action_type, description
  ) VALUES (
    p_user_id, p_amount, v_new_balance, 'purchase', 'extra_credits', p_description
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_after', v_new_balance,
    'added', p_amount
  );
END;
$$;

-- 11. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credits_balance_updated_at
BEFORE UPDATE ON public.user_credits_balance
FOR EACH ROW
EXECUTE FUNCTION public.update_credits_updated_at();