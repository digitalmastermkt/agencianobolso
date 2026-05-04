# Agência no Bolso

A agência completa no bolso do empresário. Marketing, vendas e automação aplicados ao seu negócio.

URL produção: https://agencianobolso.com.br

## Stack

- Vite
- React 18 + TypeScript
- Tailwind CSS + shadcn-ui
- Supabase (auth, banco, edge functions)
- PWA (vite-plugin-pwa)

## Desenvolvimento local

Requer Node.js 18+ e npm.

```sh
git clone https://github.com/digitalmastermkt/agencianobolso.git
cd agencianobolso
npm install --legacy-peer-deps
npm run dev
```

Servidor sobe em `http://localhost:8080`.

## Build de produção

```sh
npm run build
```

Saída em `dist/`. Deploy via Vercel (auto-deploy do `main`).

## Estrutura

- `src/` — código React/TS
- `public/` — assets estáticos (favicon, ícones PWA, og-image)
- `supabase/functions/` — edge functions serverless
- `supabase/migrations/` — migrações SQL

---

## Segurança e Conformidade

### RBAC e auditoria

- User roles em tabela separada `user_roles` com RLS
- Audit log de admin em `admin_access_audit` (data, ação, alvo, IP)
- RLS habilitado em todas as tabelas com PII
- Rate limiting em endpoints sensíveis

### LGPD/GDPR

- Audit logs cobrem acesso a dados pessoais
- Conexões 100% HTTPS
- JWT com auto-refresh

### Boas práticas para administradores

1. Revisar audit logs em `/admin/audit-logs` semanalmente
2. Princípio do menor privilégio — só elevar admin quando necessário
3. Monitorar tentativas de login que falharem
4. Manter dependências npm atualizadas
5. Backup regular do banco Supabase

### Reportar vulnerabilidades

Não divulgue publicamente. Contato direto via canais oficiais.
