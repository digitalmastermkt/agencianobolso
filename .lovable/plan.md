
# Plano de Reestruturação dos Planos de Assinatura

## Resumo Executivo
Reestruturar os planos de assinatura para garantir margem de 4x sobre o custo operacional, implementar limites de perfis de marca escalonados e atualizar toda a UI/UX para refletir a nova estrutura competitiva.

---

## Nova Estrutura de Planos

### Tabela de Preços Proposta

| Plano | Preço Mensal | Preço Anual | Créditos/mês | Artes/mês | Perfis de Marca | Custo/arte | Margem |
|-------|-------------|-------------|--------------|-----------|-----------------|------------|--------|
| **Essencial** | R$ 67/mês | R$ 670/ano | 15 | ~15 | 1 | R$ 4,47 | ~4x |
| **Premium** | R$ 147/mês | R$ 1.470/ano | 35 | ~35 | 3 | R$ 4,20 | ~4x |
| **Elite** | R$ 297/mês | R$ 2.970/ano | 75 | ~75 | Ilimitado | R$ 3,96 | ~4x |

> **Nota:** Considerando custo médio de R$ 1,00-1,20 por arte, a margem de 4x é garantida em todos os planos.

### Pacotes de Créditos Extras (Ajustados)

| Pacote | Créditos | Preço | Preço/Crédito | Economia |
|--------|----------|-------|---------------|----------|
| Básico | 10 | R$ 40 | R$ 4,00 | - |
| Popular | 25 | R$ 90 | R$ 3,60 | 10% |
| Pro | 50 | R$ 160 | R$ 3,20 | 20% |

---

## Arquivos a Serem Modificados

### 1. Banco de Dados (Supabase)
- **`plan_settings`**: Atualizar `monthly_credits` para os novos valores (15, 35, 75)
- **`profiles`**: Adicionar coluna `max_brand_profiles` ou criar tabela de limites
- **Nova RPC/Policy**: Verificar limite de perfis por plano

### 2. Frontend - Componentes de Assinatura
- **`src/components/subscriptions/SubscriptionPanel.tsx`**
  - Atualizar preços: R$ 67, R$ 147, R$ 297
  - Atualizar anuais: R$ 670, R$ 1.470, R$ 2.970
  - Adicionar features: "15 artes/mês", "35 artes/mês", "75 artes/mês"
  - Adicionar limites de perfis: "1 perfil", "3 perfis", "Perfis ilimitados"

### 3. Página de Vendas
- **`src/pages/Vendas.tsx`**
  - Atualizar structured data (SEO) com novos preços
  - Atualizar cards comparativos com novas features
  - Destacar quantidade de artes por mês

### 4. Dialog de Créditos Extras
- **`src/components/CreditsPackagesDialog.tsx`**
  - Atualizar pacotes: 10 (R$ 40), 25 (R$ 90), 50 (R$ 160)
  - Recalcular percentuais de economia

### 5. Edge Function de Checkout
- **`supabase/functions/create-credits-checkout/index.ts`**
  - Atualizar mapeamento de pacotes com novos preços

### 6. Configuração de Créditos
- **`src/lib/credits-config.ts`**
  - Adicionar constantes de limites de perfis por plano

---

## Detalhes Técnicos

### Migração de Banco de Dados
```sql
-- Atualizar créditos mensais dos planos
UPDATE plan_settings SET monthly_credits = 15 WHERE plan = 'Essencial';
UPDATE plan_settings SET monthly_credits = 35 WHERE plan = 'Premium';
UPDATE plan_settings SET monthly_credits = 75 WHERE plan = 'Elite';

-- Adicionar limites de perfis de marca
ALTER TABLE plan_settings ADD COLUMN max_brand_profiles INTEGER DEFAULT 1;
UPDATE plan_settings SET max_brand_profiles = 1 WHERE plan = 'Essencial';
UPDATE plan_settings SET max_brand_profiles = 3 WHERE plan = 'Premium';
UPDATE plan_settings SET max_brand_profiles = NULL WHERE plan = 'Elite'; -- NULL = ilimitado
```

### Atualização do Stripe
Será necessário criar novos Price IDs no Stripe para os novos valores:
- Essencial Mensal: R$ 67
- Essencial Anual: R$ 670
- Premium Mensal: R$ 147
- Premium Anual: R$ 1.470
- Elite Mensal: R$ 297
- Elite Anual: R$ 2.970

---

## Lista de Features por Plano (para UI)

### Essencial (R$ 67/mês)
- 15 artes por mês
- 1 Perfil de Marca
- Compra de créditos adicionais
- Créditos não acumulam
- Suporte por email

### Premium (R$ 147/mês) - Mais Popular
- 35 artes por mês
- 3 Perfis de Marca
- Compra de créditos adicionais
- Créditos não acumulam
- Suporte prioritário
- Acesso antecipado a novos recursos

### Elite (R$ 297/mês)
- 75 artes por mês
- Perfis de Marca ilimitados
- Compra de créditos adicionais
- Créditos não acumulam
- Suporte VIP
- Acesso exclusivo a novos agentes
- Consultoria mensal (1h)

---

## Ordem de Implementação

1. Atualizar banco de dados (plan_settings)
2. Atualizar SubscriptionPanel.tsx com novos preços e features
3. Atualizar Vendas.tsx com nova estrutura
4. Atualizar CreditsPackagesDialog.tsx com novos pacotes
5. Criar novos produtos/preços no Stripe
6. Atualizar stripe_price_config no banco
7. Atualizar Edge Function de créditos extras
8. Adicionar validação de limite de perfis de marca
9. Testar fluxo completo de assinatura
