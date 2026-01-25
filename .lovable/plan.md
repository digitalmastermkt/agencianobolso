
# Plano: Corrigir Bypass de Master User e Créditos

## Diagnóstico Confirmado

O sistema está bloqueando a geração porque:
1. O email master na edge function está errado (`digitalmasters@gmail.com` em vez de `digitalmastermkt@gmail.com`)
2. O usuário não tem registro na tabela `user_credits_balance`

## Correções Necessárias

### 1. Corrigir Email Master na Edge Function

**Arquivo:** `supabase/functions/generate-creative-v2/index.ts`

**Linha 539 - DE:**
```typescript
const MASTER_USER_EMAILS = ["digitalmasters@gmail.com"];
```

**PARA:**
```typescript
const MASTER_USER_EMAILS = ["digitalmastermkt@gmail.com"];
```

### 2. Verificar Outras Edge Functions

Garantir que todas as edge functions usem o email correto:
- `analyze-instagram-identity/index.ts`

### 3. Criar Registro de Créditos para o Usuário (Opcional)

Mesmo com o bypass funcionando, é bom ter um registro. Executar SQL:

```sql
INSERT INTO user_credits_balance (user_id, credits_balance, credits_extra, credits_monthly_limit)
VALUES ('8382dd8b-b8c7-4a7b-bfc6-a5dbd1442bf0', 999, 999, 999)
ON CONFLICT (user_id) DO UPDATE SET
  credits_balance = 999,
  credits_extra = 999,
  credits_monthly_limit = 999;
```

### 4. Redesployer as Edge Functions

Após corrigir o código, fazer deploy das funções atualizadas.

## Resultado Esperado

Após as correções:
- O bypass de master user vai funcionar corretamente
- As gerações vão ser executadas sem consumir créditos
- O sistema vai reconhecer `digitalmastermkt@gmail.com` como master user

## Detalhes Técnicos

A verificação de master user acontece na linha 585:
```typescript
isMasterUser = MASTER_USER_EMAILS.includes(userEmail || "");
```

Se `isMasterUser` for `true`, o bloco de verificação de créditos (linhas 596-623) é pulado, permitindo a geração sem debitar créditos.
