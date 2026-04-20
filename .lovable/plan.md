

# Auditoria e Refatoração — Agência no Bolso

## Prioridade 1 — Segurança: remover e-mails hardcoded

**Problema:** Três Edge Functions e um arquivo do frontend contêm `digitalmastermkt@gmail.com` hardcoded.

**Ação:**
- Adicionar secret `MASTER_USER_EMAIL` no Supabase (será solicitada ao usuário).
- Refatorar para ler `Deno.env.get('MASTER_USER_EMAIL')` em:
  - `supabase/functions/analyze-instagram-identity/index.ts`
  - `supabase/functions/generate-creative-v2/index.ts`
  - `supabase/functions/check-subscription/index.ts`
- Frontend (`src/lib/constants.ts`): manter helper `isMasterUser()` mas remover o e-mail literal — passar a comparar contra um valor vindo de variável pública opcional `VITE_MASTER_USER_EMAIL` (string vazia se não definida). Isso desacopla o código do e-mail real.

## Prioridade 2 — Consolidar funções de geração

**Estado atual:**
| Função | Usada no frontend? | Status |
|---|---|---|
| `generate-creative-v2` | Sim (AgenteDiretorArte) — 1380 linhas, mais completa | **MANTER** |
| `generate-personalized-banner` | Sim (DesignGeneratorForm) — 141 linhas | Migrar chamada → deletar |
| `generate_creatives` | Não | Deletar |
| `generate-banner-images` | Não | Deletar |

**Ação:**
- Adaptar `DesignGeneratorForm.tsx` para chamar `generate-creative-v2` com payload equivalente (mapear campos atuais para o contrato da v2).
- Deletar diretórios das 3 funções obsoletas + entradas no `supabase/config.toml`.
- Adicionar comentário-cabeçalho em `generate-creative-v2/index.ts` explicando que ela é a única função de geração e por quê.
- Usar `supabase--delete_edge_functions` para remover as funções deployadas.

## Prioridade 3 — Variação visual por tema

**Ação:**
- Em `art-director-decision/index.ts`: aceitar parâmetro opcional `theme` (`promocao | lancamento | data_comemorativa | institucional | servico`). Injetar no system prompt um bloco de diretrizes por tema (paleta, estilo `clean|dynamic|premium|festive`, atmosfera, composição).
- Estender o tipo `ArtDirectorDecision.style` para incluir `dynamic` e `festive`.
- `generate-creative-v2` aceita e repassa `theme` ao art director.
- `DesignGeneratorForm.tsx` e `AgenteDiretorArte.tsx`: novo campo Select "Tema da arte" com as 5 opções; envia no payload.

## Prioridade 4 — Concorrência na geração múltipla

**Ação em `generate-creative-v2`:**
- Loop de variações já é sequencial. Adicionar `await new Promise(r => setTimeout(r, 500))` entre variações.
- Wrapper de retry com backoff exponencial (500ms → 1s → 2s, máx 3 tentativas) ao detectar HTTP 429 da chamada de imagem.

**Frontend (`AgenteDiretorArte.tsx` e `DesignGeneratorForm.tsx`):**
- Estado `generationProgress: { current, total, status }` já existe parcialmente — exibir progresso "Gerando variação X de Y" com `Progress` bar.

## Prioridade 5 — Limpeza geral

- **Imports não usados:** rodar varredura com `eslint --fix` focada em `no-unused-vars` apenas nos arquivos `src/`.
- **Mensagens de erro em PT-BR:** padronizar respostas das Edge Functions remanescentes (`{ error: "mensagem em português" }`).
- **Hooks duplicados:** `usePlanAccess` já consome `useSubscription` — sem duplicação real. `useCreditsBalance` é independente (créditos ≠ assinatura). **Não consolidar** para evitar quebrar fluxos. Apenas documentar a separação no topo de cada arquivo.
- **Componentes/páginas órfãos:** validar via `rg` cada arquivo em `src/pages` e `src/components` contra rotas em `App.tsx` e imports. Remover apenas itens com zero referências (lista será exibida antes de deletar).

## Arquivos modificados

**Edge Functions:**
- editar: `analyze-instagram-identity`, `generate-creative-v2`, `check-subscription`, `art-director-decision`
- deletar: `generate_creatives`, `generate-banner-images`, `generate-personalized-banner`
- atualizar: `supabase/config.toml`

**Frontend:**
- `src/lib/constants.ts`
- `src/components/banner/DesignGeneratorForm.tsx` (migrar invoke + campo tema + progresso)
- `src/pages/agents/AgenteDiretorArte.tsx` (campo tema)

## O que NÃO será tocado
Auth (`useAuth`, `ProtectedRoute`, `AdminRoute`), créditos (`debit_user_credits`, `refund_user_credits`), PWA, Stripe (`create-checkout`, `stripe-webhook`, `check-subscription` apenas troca do e-mail), schema do banco, rotas públicas de captura.

## Passos de execução
1. Solicitar secret `MASTER_USER_EMAIL`.
2. Refatorar e-mail hardcoded (P1).
3. Migrar `DesignGeneratorForm` → `generate-creative-v2`, deletar funções obsoletas (P2).
4. Adicionar `theme` no fluxo art-director + UI (P3).
5. Adicionar delay/retry/backoff + UI de progresso (P4).
6. Limpeza de imports e arquivos órfãos (P5).
7. Listar mudanças no chat para revisão.

