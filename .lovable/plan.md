

# Sistema de Tipos de Criativo

Adicionar uma camada de **tipo de criativo** que muda hierarquia visual, presença de CTA, atmosfera e prompt — sem tocar em créditos, auth, PWA, Storage ou histórico.

## 1. Enum compartilhado (frontend + edge functions)

Definir 6 tipos com metadados (label, ícone, descrição, regras estruturais):

| Tipo | Hierarquia | CTA? | Atmosfera |
|---|---|---|---|
| `trafego_pago` | Headline + Sub + CTA destacado | Sim, forte | Conversão / urgência |
| `live_evento` | Data/hora grandes + Tema + "Participe" | "Participe"/"Assista" | Dinâmica, energética |
| `data_comemorativa` | Mensagem afetiva centralizada + logo | Não | Emocional, festiva |
| `lancamento` | Pouco texto, suspense, data | Opcional | Premium, dramático |
| `institucional` | Propósito/marca | Não | Sóbrio, equilibrado |
| `aviso_comunicado` | Texto grande legível | Não | Clean, direto |

Arquivo novo: `src/lib/creativeTypes.ts` exportando `CREATIVE_TYPES` (array com value/label/icon/description) e `CreativeType` type. Espelho em cada edge function (para evitar import cross-boundary).

## 2. UI — `DesignGeneratorForm.tsx`

- **Antes** do campo "Texto Principal", adicionar bloco **"Tipo de Criativo"** com grid 2 colunas (mobile: 1) de cards selecionáveis (mesma estética do `STYLE_OPTIONS` atual: ícone + label + descrição curta, 44px+ touch target).
- Estado `selectedCreativeType` (default: `trafego_pago` — preserva comportamento atual).
- Esconder campo **CTA** quando tipo for `data_comemorativa`, `institucional` ou `aviso_comunicado` (não inventar CTA onde não cabe).
- Trocar placeholder do "Texto Principal" conforme tipo (ex: live mostra "Ex: Live sobre Tráfego Pago — Quinta 20h").
- Enviar `creativeType: selectedCreativeType` no payload de `generate-creative-v2`.

Também adicionar o seletor em `src/pages/agents/AgenteDiretorArte.tsx` (mesmo componente reutilizável para manter consistência) — criar `src/components/banner/CreativeTypeSelector.tsx` para evitar duplicação.

## 3. `art-director-decision/index.ts`

- Aceitar `creativeType` no body.
- Adicionar `CREATIVE_TYPE_GUIDELINES` (mapa por tipo) com regras estruturais específicas: hierarquia, presença de CTA, tom, composição.
- Injetar no system prompt um bloco **"DIRETRIZES DE TIPO DE CRIATIVO"** (combina com o `THEME_GUIDELINES` atual — tipo define a estrutura, tema reforça a paleta/atmosfera).
- Para tipos sem CTA, instruir o modelo a **omitir** o campo `cta` no JSON.
- Para `aviso_comunicado` e `data_comemorativa`, forçar `template: pessoa_centro` quando aplicável.

## 4. `generate-creative-v2/index.ts`

- Aceitar `creativeType` no body e repassar ao `art-director-decision` quando invocado internamente.
- Adicionar `CREATIVE_TYPE_PROMPT_BLOCKS` (mapa) que injeta instruções no prompt final do Gemini:
  - `live_evento`: "destacar data e horário em tipografia grande, hierarquia: data > tema > chamada"
  - `data_comemorativa`: "logo da marca em destaque, sem CTA, atmosfera celebrativa"
  - `aviso_comunicado`: "texto grande e legível, contraste máximo, layout clean"
  - etc.
- Default: comportamento atual (equivalente a `trafego_pago`) para retrocompatibilidade.

## 5. Compatibilidade

- Todos os parâmetros novos são **opcionais**. Chamadas sem `creativeType` continuam funcionando como hoje (`trafego_pago` implícito).
- Schema do banco intacto. `project_generations` armazena os campos atuais; `creativeType` opcionalmente entra no payload `images`/metadata sem migração.
- Sem mudanças em débito de créditos, lógica de retry/backoff (P4 anterior preservada), ou autenticação.

## Arquivos modificados

**Novos:**
- `src/lib/creativeTypes.ts`
- `src/components/banner/CreativeTypeSelector.tsx`

**Editados:**
- `src/components/banner/DesignGeneratorForm.tsx` (seletor + esconder CTA condicional + enviar `creativeType`)
- `src/pages/agents/AgenteDiretorArte.tsx` (mesmo seletor + enviar `creativeType`)
- `supabase/functions/art-director-decision/index.ts` (guidelines + system prompt)
- `supabase/functions/generate-creative-v2/index.ts` (prompt blocks + repasse ao art-director)

## NÃO será tocado
Auth, ProtectedRoute, créditos (`debit_user_credits`/`refund_user_credits`), PWA, Stripe, schema do banco, Storage, histórico de gerações, rotas públicas.

