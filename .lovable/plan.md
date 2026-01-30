
# Plano de Configuração dos Pagamentos Stripe

## Situacao Atual

### O que ja esta funcionando:
- **Tabela `stripe_price_config`**: Contem 6 registros com Price IDs configurados (3 mensais + 3 anuais)
- **Frontend `SubscriptionPanel.tsx`**: Busca os Price IDs do banco via `useStripePriceConfig`
- **Admin `StripePriceUpdater.tsx`**: Interface para atualizar Price IDs pelo painel admin
- **Edge Functions**: `create-checkout`, `check-subscription`, `stripe-webhook` ja implementadas

### O que falta configurar:
1. **STRIPE_SECRET_KEY**: Nao esta nos secrets do projeto
2. **STRIPE_WEBHOOK_SECRET**: Opcional mas recomendado para producao
3. **Edge Functions com Price IDs hardcoded**: `create-checkout` e `check-subscription` tem mapeamentos fixos que nao leem do banco

---

## Passo a Passo

### 1. Adicionar STRIPE_SECRET_KEY

Voce precisa adicionar a chave secreta do Stripe nos secrets do projeto:

1. Acesse o Stripe Dashboard: https://dashboard.stripe.com/apikeys
2. Copie a **Secret key** (comeca com `sk_live_` ou `sk_test_`)
3. Vou solicitar para voce adicionar como secret

### 2. Criar Produtos e Precos no Stripe

No Stripe Dashboard, crie os seguintes produtos com precos recorrentes:

**Planos Mensais:**
| Produto | Preco | Recorrencia |
|---------|-------|-------------|
| Essencial | R$ 67,00 | Mensal |
| Premium | R$ 147,00 | Mensal |
| Elite | R$ 297,00 | Mensal |

**Planos Anuais (10 meses, 2 gratis):**
| Produto | Preco | Recorrencia |
|---------|-------|-------------|
| Essencial Anual | R$ 670,00 | Anual |
| Premium Anual | R$ 1.470,00 | Anual |
| Elite Anual | R$ 2.970,00 | Anual |

### 3. Atualizar Price IDs no Banco

Apos criar os produtos no Stripe:
1. Copie os Price IDs gerados (formato: `price_xxxxx`)
2. Acesse o painel Admin > Stripe
3. Atualize os 6 campos com os novos Price IDs

### 4. Configurar Webhook (Producao)

Para o ambiente de producao:

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: `https://mqzbuctebbyryptmprkc.supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Copie o "Signing secret" e adicione como `STRIPE_WEBHOOK_SECRET`

### 5. Atualizar Edge Functions (Dinamico)

Modificar `create-checkout` e `check-subscription` para buscar Price IDs do banco ao inves de usar mapeamento hardcoded. Isso permite que as alteracoes feitas no admin reflitam automaticamente.

---

## Alteracoes de Codigo

### Edge Function: `create-checkout/index.ts`
- Remover `PRICE_MAP` hardcoded
- Buscar tier do banco usando o `price_id` recebido
- Validar se o price_id existe na tabela `stripe_price_config`

### Edge Function: `check-subscription/index.ts`
- Remover `PRICE_TO_TIER` hardcoded
- Buscar todos os Price IDs do banco e construir o mapeamento dinamicamente
- Suportar tanto precos mensais quanto anuais

---

## Resumo das Acoes

| Acao | Responsavel |
|------|-------------|
| Adicionar STRIPE_SECRET_KEY | Voce (via modal) |
| Criar produtos no Stripe | Voce (Stripe Dashboard) |
| Atualizar Price IDs no banco | Voce (Admin > Stripe) |
| Configurar webhook no Stripe | Voce (Stripe Dashboard) |
| Adicionar STRIPE_WEBHOOK_SECRET | Voce (via modal) |
| Atualizar edge functions | Lovable (codigo) |

