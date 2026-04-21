

## Problema

O botão "Gerar" agora ativa, mas a Edge Function `generate-creative-v2` rejeita a requisição com `"Usuário não possui saldo de créditos"` mesmo para o usuário master `digitalmastermkt@gmail.com`.

**Causa raiz** (confirmada pelos logs `[generate-creative-v2] Insufficient credits ... balance: 0`):

A função verifica master via:
```ts
const MASTER_USER_EMAIL = (Deno.env.get("MASTER_USER_EMAIL") ?? "").toLowerCase();
isMasterUser = !!MASTER_USER_EMAIL && userEmail === MASTER_USER_EMAIL;
```

O secret `MASTER_USER_EMAIL` **não está configurado** no Supabase Edge Functions, então a comparação sempre falha e o bypass nunca ativa. As outras funções (`art-director-decision`, `analyze-person-photo`) podem ter o mesmo problema.

## Correção

**Arquivo:** `supabase/functions/generate-creative-v2/index.ts`

Adicionar fallback hardcoded para o email master, mantendo o secret como override opcional:

```ts
const MASTER_USER_EMAIL = (
  Deno.env.get("MASTER_USER_EMAIL") ?? "digitalmastermkt@gmail.com"
).toLowerCase();
```

Isso garante que mesmo sem o secret configurado, o usuário master é reconhecido. Se o secret existir, ele tem prioridade (permite mudar o master sem redeploy).

**Aplicar o mesmo fallback em:**
- `supabase/functions/art-director-decision/index.ts` (se usar a mesma lógica)
- `supabase/functions/analyze-person-photo/index.ts` (se usar)
- `supabase/functions/generate-ai-content/index.ts` (se usar)

Não vou tocar em nada mais — créditos, débito, refund, fluxo de geração, validações de input e CORS permanecem intactos.

## Deploy

Após edição, redeployar `generate-creative-v2` (e demais funções afetadas) para o ambiente Supabase.

## Verificação

1. Testar geração logado como `digitalmastermkt@gmail.com` → log esperado: `[generate-creative-v2] Master user detected - bypassing credit check`.
2. Confirmar que a imagem é gerada e retornada normalmente.
3. Usuários comuns continuam pagando créditos (lógica preservada).

## Observação

Esse padrão de "secret obrigatório sem fallback" já está documentado em `mem://auth/usuario-master-unlimited`, mas a implementação no backend ficou frágil. Após esta correção, o sistema funciona com ou sem o secret definido.

