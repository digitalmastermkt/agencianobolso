
# Plano de Correção: Controle de Acesso e Créditos

## Problemas Identificados

### 1. Agentes "Em Breve" Ainda Acessíveis
**Causa:** O `PlanGuard` verifica apenas o plano do usuário e não a disponibilidade global do agente (tabela `agent_availability`). O sidebar mostra o ícone "Em Breve", mas a rota ainda permite acesso.

**Evidência:** O código do `PlanGuard.tsx` (linha 43) mostra que usuários sem assinatura (free/trial) sempre têm acesso ao agente "vendas", mas não verifica se o agente está marcado como `is_available = false`.

### 2. Trial Ativo Dando 10 Créditos Diários para Novos Usuários
**Causa:** Trigger `activate_user_trial` ativa automaticamente o trial para TODOS os novos usuários com 10 créditos diários por 7 dias.

**Evidência:** Migração `20250923202153`:
- Linha 42-46: Define `trial_start_date`, `trial_end_date`, `is_trial_active = true`, `daily_credits_limit = 10`

### 3. Planos Sem Configuração de Agentes
**Causa:** A tabela `plan_agents_access` está vazia. Não há mapeamento de quais agentes cada plano pode acessar.

### 4. Sistema de Créditos Mensais
**Status:** Implementado corretamente. As Edge Functions `generate-creative-v2` e `analyze-instagram-identity` já debitam créditos antes da execução e reembolsam em caso de falha técnica.

---

## Alterações Necessárias

### Parte 1: Frontend - Bloquear Acesso a Agentes Indisponíveis

**Arquivo:** `src/components/PlanGuard.tsx`

Adicionar verificação de `agent_availability`:
- Importar `useAgentAvailability` hook
- Verificar se o agente está marcado como disponível ANTES de verificar plano
- Se `is_available = false`, bloquear com mensagem "Em Breve"

```text
Lógica atualizada:
1. Se agente não disponível globalmente -> Bloquear ("Em Breve")
2. Se admin ou master -> Permitir
3. Se trial ativo com créditos -> Permitir (apenas Diretor de Arte)
4. Se assinante -> Verificar regras de plano
5. Se gratuito -> Bloquear (sem acesso a agentes)
```

### Parte 2: Remover Trial Automático para Novos Usuários

**Arquivo:** Nova migração SQL

Alterar o trigger `activate_user_trial` para NÃO ativar trial automaticamente:
- Novos usuários começam SEM trial e SEM créditos
- Trial e créditos só são ativados após compra de plano

```sql
CREATE OR REPLACE FUNCTION public.activate_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Novos usuários NÃO recebem trial automaticamente
  -- Créditos são alocados apenas via assinatura
  NEW.trial_start_date = NULL;
  NEW.trial_end_date = NULL;
  NEW.is_trial_active = false;
  NEW.daily_credits_limit = 0;
  
  RETURN NEW;
END;
$$;
```

### Parte 3: Popular Tabela `plan_agents_access`

**Arquivo:** Nova migração SQL

Inserir configuração de acesso por plano:
- Essencial: Diretor de Arte
- Premium: Diretor de Arte
- Elite: Diretor de Arte

(Por enquanto, apenas Diretor de Arte disponível. Os demais serão adicionados quando lançados.)

```sql
INSERT INTO plan_agents_access (plan, agent_key) VALUES
  ('Essencial', 'diretor-arte'),
  ('Premium', 'diretor-arte'),
  ('Elite', 'diretor-arte')
ON CONFLICT DO NOTHING;
```

### Parte 4: Atualizar Lógica de Usuário Gratuito no PlanGuard

**Arquivo:** `src/components/PlanGuard.tsx`

Alterar comportamento para usuários sem assinatura:
- Remover permissão ao agente "vendas" para usuários gratuitos
- Usuários sem plano não têm acesso a NENHUM agente

```text
Antes:
if (!subscribed) return !(agentKey === "vendas");

Depois:
if (!subscribed) return true; // Bloquear todos os agentes
```

### Parte 5: Atualizar UI de Trial

**Arquivo:** `src/components/TrialStatusCard.tsx`

Atualizar mensagens para refletir que trial não existe mais:
- Mostrar apenas para usuários que já tinham trial ativo
- Não criar expectativa de trial para novos usuários

**Arquivo:** `src/hooks/useTrialStatus.ts`

Nenhuma alteração necessária - o hook já verifica se `is_trial_active = true`.

---

## Resumo das Verificações de Segurança Existentes

| Verificação | Status | Localização |
|------------|--------|-------------|
| Débito de créditos antes de gerar arte | OK | `generate-creative-v2/index.ts` linhas 592-629 |
| Débito de créditos para perfil de marca | OK | `analyze-instagram-identity/index.ts` linhas 86-122 |
| Reembolso em falha técnica | OK | Ambas as funções têm lógica de refund |
| Bloqueio por créditos insuficientes | OK | Retorna erro 402 com `insufficient_credits: true` |
| Master user bypass | OK | Ambas verificam `MASTER_USER_EMAILS` |

---

## Ordem de Implementação

1. **Migração SQL** - Desativar trial automático e popular `plan_agents_access`
2. **PlanGuard.tsx** - Adicionar verificação de disponibilidade e remover acesso gratuito
3. **TrialStatusCard.tsx** - Ajustar mensagens (opcional, para clareza)
4. **Testar fluxo** - Criar novo usuário e verificar que não tem acesso sem comprar plano

---

## Seção Técnica Detalhada

### Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/components/PlanGuard.tsx` | Adicionar verificação de `agent_availability` e remover acesso gratuito |
| `supabase/migrations/[nova].sql` | Desativar trial e popular `plan_agents_access` |

### Dependências

- Hook `useAgentAvailability` já existe e funciona corretamente
- Tabela `agent_availability` está corretamente populada com Diretor de Arte = disponível
- Sistema de créditos está funcionando para assinantes

### Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Usuários existentes com trial perdem acesso | Manter trial para quem já tem `is_trial_active = true` |
| Tabela `plan_agents_access` vazia bloqueia todos | Inserir registros via migração ANTES de alterar código |
