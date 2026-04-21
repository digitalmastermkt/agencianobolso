

## Diagnóstico

Mesmo no preview a geração falha. Preciso investigar a fundo para identificar a causa real antes de mudar código. Os logs do `check-subscription` aparecem normais, mas não vi logs do `generate-creative-v2` na execução recente — o que sugere que ou:

1. A função está sendo chamada mas falhando silenciosamente (erro de payload, modelo, ou timeout)
2. A função nem está sendo invocada (erro no frontend antes da chamada)
3. A função retorna erro estruturado que o frontend não está mostrando claramente

## Plano de Investigação e Correção

### Passo 1 — Coletar evidências (read-only)
- Ler logs recentes da edge function `generate-creative-v2` (últimas execuções) para ver o erro exato.
- Ler logs de `art-director-decision` (etapa anterior do pipeline).
- Ler console logs do navegador no preview para identificar erro client-side.
- Inspecionar `src/pages/agents/AgenteDiretorArte.tsx` no trecho do `handleGenerate` para confirmar payload enviado.
- Inspecionar `supabase/functions/generate-creative-v2/index.ts` nas linhas críticas (chamada ao gateway, validação de inputs, tratamento de erro).
- Conferir se `LOVABLE_API_KEY` está nos secrets (já confirmado que está).

### Passo 2 — Identificar a causa raiz
Possíveis causas a verificar:
- **Modelo errado ainda em algum lugar**: confirmar que ambas linhas 208 e 1263 foram realmente atualizadas para `google/gemini-2.5-flash-image-preview` (não há resíduo de `gemini-3-pro-image-preview`).
- **Payload inválido ao gateway**: `image_url.url` recebendo string vazia, undefined ou objeto.
- **Timeout no gateway**: imagem muito grande sendo enviada como base64 estourando 150s.
- **Erro 402/429 do gateway**: créditos da workspace Lovable AI esgotados (retorna 402) ou rate limit (429).
- **Resposta sem `images`**: o gateway retornando texto em vez de imagem por modelo/prompt incorreto.
- **Erro CORS/network**: chamada nem sai do browser.

### Passo 3 — Aplicar correção pontual
Após identificar a causa real, vou aplicar **a correção mínima necessária**. Possíveis ações (depende do diagnóstico):

- Se for crédito Lovable AI esgotado (402) → avisar o usuário para adicionar créditos em Settings > Workspace > Usage. **Não há fix de código.**
- Se for payload inválido → corrigir o ponto exato no frontend ou backend.
- Se for tratamento de erro silencioso → adicionar `toast` com mensagem clara no frontend e logging mais explícito no backend.
- Se for timeout → reduzir tamanho da imagem de referência antes do envio.

### Passo 4 — Verificação
- Testar geração no preview logado como master.
- Confirmar log `Generating variation 1/...` e resposta com imagem.
- Se persistir, retornar com novo diagnóstico baseado no log mais recente.

## NÃO será tocado
- Lógica de créditos da app (`debit_user_credits`, `refund_user_credits`).
- Schema do banco, RLS, auth, Stripe, PWA.
- Fluxo do `art-director-decision` (a menos que os logs apontem ele como culpado).

## Observação importante
O erro pode ser **402 Payment Required** do Lovable AI Gateway (créditos da workspace esgotados, separado dos créditos da app). Esse erro precisa ser surfado claramente ao usuário com toast — não é um bug de código, é falta de saldo na workspace. Vou confirmar isso nos logs antes de qualquer mudança.

