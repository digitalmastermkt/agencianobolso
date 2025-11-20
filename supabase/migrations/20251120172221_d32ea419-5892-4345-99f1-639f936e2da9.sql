-- ========================================
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ========================================

-- 1. CORRIGIR RLS EM user_roles
-- Remover policy pública insegura
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

-- Criar policy segura: usuários veem apenas seu próprio role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Criar policy segura: admins podem ver todos os roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. CRIAR SISTEMA DE AUDIT LOGGING PARA ADMINS
-- Tabela para registrar acessos administrativos a dados sensíveis
CREATE TABLE IF NOT EXISTS public.admin_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  resource_type text NOT NULL,
  resource_ids uuid[],
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS: apenas admins podem ver logs
ALTER TABLE public.admin_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.admin_access_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_access_audit_admin_user_id 
ON public.admin_access_audit(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_access_audit_created_at 
ON public.admin_access_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_access_audit_target_user_id 
ON public.admin_access_audit(target_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_access_audit_action 
ON public.admin_access_audit(action);

-- 3. FUNÇÃO PARA LOGAR ACESSOS ADMINISTRATIVOS
CREATE OR REPLACE FUNCTION public.log_admin_access(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_resource_ids uuid[] DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só permite logging se usuário é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;
  
  INSERT INTO public.admin_access_audit (
    admin_user_id,
    action,
    target_user_id,
    resource_type,
    resource_ids,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_resource_type,
    p_resource_ids,
    p_metadata,
    now()
  );
END;
$$;