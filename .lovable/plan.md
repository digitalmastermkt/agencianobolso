

## Diagnóstico

O código de login **não foi alterado**. O erro nos logs do Supabase é claro:

```
error_code: "invalid_credentials"
msg: "400: Invalid login credentials"
path: "/token"
```

Isso significa: **o e-mail e/ou senha digitados não batem com o que está cadastrado no Supabase Auth**. Não é bug do app — é credencial errada.

Houve **5 tentativas seguidas** falhando com esse mesmo erro, todas vindas do `https://agencianobolso.lovable.app/`. Antes disso há um `refresh_token_not_found`, indicando que a sessão antiga expirou e foi deslogada.

## Causas possíveis (ordem de probabilidade)

1. **Senha digitada errada** (mais comum) — caps lock, espaço extra, ou esqueceu mesmo.
2. **Conta `digitalmastermkt@gmail.com` não existe no Supabase Auth** desse projeto — pode ter sido criada apenas localmente em outro ambiente.
3. **Senha foi alterada** em algum momento e a antiga não funciona mais.

## Solução

**Não há código para corrigir.** A ação é resetar a senha:

### Opção A (recomendada): Resetar a senha pelo próprio app
1. Na tela de login, clicar em **"Esqueci minha senha"**.
2. Informar `digitalmastermkt@gmail.com`.
3. Abrir o e-mail, clicar no link, definir nova senha em `/reset-password`.
4. Voltar e logar com a senha nova.

### Opção B: Resetar direto no painel Supabase
1. Abrir [Auth → Users](https://supabase.com/dashboard/project/mqzbuctebbyryptmprkc/auth/users).
2. Localizar `digitalmastermkt@gmail.com`.
3. Se **não existir**, criar com "Add user" → "Create new user" e definir uma senha.
4. Se **existir**, clicar nos 3 pontos → "Send password recovery" ou "Reset password".

### Opção C: Confirmar que o usuário existe
Se a Opção A enviar e-mail mas você não receber, é sinal que o usuário não existe nesse Supabase. Use a Opção B para criar.

## O que NÃO vai ser feito

- Não vou mexer em `Auth.tsx`, `useAuth`, nem em provider de OAuth — todos estão funcionando (logs mostram `/user` retornando 200 antes do logout).
- Não vou alterar políticas, RLS ou edge functions de auth.
- Não vou tocar no fluxo do master user — ele só ativa **depois** que o login bem-sucedido acontece.

## Verificação

Após resetar a senha e logar com sucesso, os logs do Supabase Auth mostrarão `status: 200` em `/token`, e o app entra normalmente. A geração de arte (corrigida nas mensagens anteriores) deve funcionar logo em seguida.

