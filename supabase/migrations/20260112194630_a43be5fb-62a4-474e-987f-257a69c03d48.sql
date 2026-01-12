-- Tabela de leads genérica
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  campanha TEXT NOT NULL DEFAULT 'lista-espera',
  origem TEXT DEFAULT 'landing-page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indices para performance
CREATE INDEX idx_leads_campanha ON public.leads(campanha);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: permitir INSERT para qualquer um (formulário público)
CREATE POLICY "leads_public_insert"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Política: apenas admins podem visualizar
CREATE POLICY "leads_admin_select"
  ON public.leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Política: apenas admins podem deletar
CREATE POLICY "leads_admin_delete"
  ON public.leads FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabela de rate limit para leads
CREATE TABLE public.leads_rate_limit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  last_submission TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_ip_leads UNIQUE (ip_address)
);

-- RLS para rate limit
ALTER TABLE public.leads_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_rate_limit_admin_only"
  ON public.leads_rate_limit FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Função de rate limit para leads
CREATE OR REPLACE FUNCTION public.check_leads_rate_limit(max_per_hour INTEGER DEFAULT 3)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_ip INET;
  current_count INTEGER;
BEGIN
  current_ip := '127.0.0.1'::INET;
  
  SELECT lr.submission_count INTO current_count
  FROM public.leads_rate_limit lr
  WHERE lr.ip_address = current_ip
    AND lr.last_submission > now() - INTERVAL '1 hour';
  
  IF current_count IS NULL THEN
    INSERT INTO public.leads_rate_limit (ip_address, submission_count)
    VALUES (current_ip, 1)
    ON CONFLICT (ip_address) DO UPDATE SET
      submission_count = 1,
      last_submission = now();
    RETURN TRUE;
  END IF;
  
  IF current_count >= max_per_hour THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.leads_rate_limit
  SET submission_count = leads_rate_limit.submission_count + 1,
      last_submission = now()
  WHERE ip_address = current_ip;
  
  RETURN TRUE;
END;
$$;