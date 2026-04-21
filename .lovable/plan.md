

## O que quebrou

Identifiquei **3 problemas reais** introduzidos nas alterações recentes:

### 1. Modelo de geração de imagem incorreto (CRÍTICO)
- **Arquivo:** `supabase/functions/generate-creative-v2/index.ts` (linhas 208 e 1263)
- **Problema:** alguém trocou o modelo para `google/gemini-3-pro-image-preview`. Esse modelo **não existe** no Lovable AI Gateway. O modelo correto e fixado pelo projeto é **`google/gemini-2.5-flash-image-preview`** (regra registrada em memória — modelo escolhido por custo/eficiência).
- **Sintoma:** a função recebe a request, debita crédito (no caso do master, faz bypass), monta o prompt, mas o `fetch` para o gateway falha silenciosamente ou retorna erro de modelo inválido. Daí o "não está gerando imagem".

### 2. `personImageBase64` recebendo objeto em vez de string
- **Arquivo:** `src/pages/agents/AgenteDiretorArte.tsx` (linha 686)
- **Problema:** `personImageBase64: allReferenceImages[0]` passa `{url, type}` quando deveria passar a string da URL. No backend (linhas 780, 1225-1230) isso é usado direto como `image_url.url`, gerando uma URL inválida `[object Object]`.
- **Correção:** `personImageBase64: allReferenceImages[0]?.url || undefined`

### 3. Hardcoded `MASTER_USER_EMAIL` flagado como vulnerabilidade (não quebra, mas faz parte da limpeza)
- O scanner de segurança apontou os fallbacks hardcoded como erro. Como o secret `MASTER_USER_EMAIL` **já está configurado** no Supabase (visto em `<secrets>`), o fallback não é mais necessário e gera risco. Vou remover o fallback hardcoded das 3 funções e deixar `?? ""` — assim, se o secret existir (que existe), tudo funciona; e o email não fica exposto no código.

## Plano de Correção

### Arquivo 1: `supabase/functions/generate-creative-v2/index.ts`
- Linha 208: `model: "google/gemini-3-pro-image-preview"` → `model: "google/gemini-2.5-flash-image-preview"`
- Linha 1263: idem

### Arquivo 2: `src/pages/agents/AgenteDiretorArte.tsx`
- Linha 686: `personImageBase64: allReferenceImages[0] || undefined` → `personImageBase64: allReferenceImages[0]?.url || undefined`

### Arquivos 3, 4, 5: Remover fallback hardcoded do master email (segurança)
- `supabase/functions/generate-creative-v2/index.ts` linha 553
- `supabase/functions/check-subscription/index.ts` linha ~12
- `supabase/functions/analyze-instagram-identity/index.ts` linha ~11
- Padrão novo: `const MASTER_USER_EMAIL = (Deno.env.get("MASTER_USER_EMAIL") ?? "").toLowerCase();`
- Como o secret está configurado, o usuário master continua funcionando normalmente.

### Deploy
- Redeployar `generate-creative-v2`, `check-subscription`, `analyze-instagram-identity` automaticamente após as edições.

## NÃO será tocado
- Lógica de créditos (`debit_user_credits`, `refund_user_credits`)
- Sistema de auth, PWA, Stripe, Storage
- Pipeline do art-director-decision (já está correto após última mudança de `imageContent`)
- Schema do banco
- RLS policies (os outros findings de segurança ficam para um próximo ciclo)

## Verificação
Após deploy, testar geração logado como `digitalmastermkt@gmail.com`. Logs esperados:
- `[generate-creative-v2] Master user detected - bypassing credit check`
- `[generate-creative-v2] Generating variation 1/...`
- Imagem retornada com sucesso.

