

## Problema

Na tela de geração (step final do Diretor de Arte), quando o usuário não tem perfil de marca selecionado, aparece a mensagem **"Selecione um perfil de marca no menu lateral"** — mas **não existe menu lateral**. O perfil só pode ser escolhido voltando ao Step 1 do stepper, e o projeto só no Step 3. Isso quebra o fluxo: o usuário fica preso sem entender onde clicar.

## Solução

Adicionar **dois pop-ups (Dialogs)** acessíveis diretamente da tela de geração, mostrando os perfis e projetos cadastrados para seleção rápida — sem precisar voltar nos steps.

### 1. Pop-up "Selecionar Perfil de Marca"
- Trocar o texto **"Selecione um perfil de marca no menu lateral"** (linhas 1754 e 2441) por um **botão** "Selecionar perfil de marca".
- Ao clicar, abre `Dialog` com a lista de perfis cadastrados (reusa a UI do `BrandProfileSelector`: cards com nome, cores e check no selecionado).
- Inclui botão **"+ Criar novo perfil"** dentro do mesmo dialog para casos sem nenhum perfil.
- Ao selecionar, fecha o dialog e atualiza `selectedBrandProfileId` — o card "Marca" passa a mostrar o perfil escolhido com cores e badges.

### 2. Pop-up "Selecionar Projeto"
- Adicionar, ao lado do nome do projeto atual no header da seção de geração, um botão **"Trocar projeto"** (ou **"Selecionar projeto"** quando `currentProjectId` é null).
- Abre `Dialog` listando todos os projetos com nome, contagem de banners e indicador do atual.
- Inclui input + botão **"Criar novo projeto"** dentro do dialog (reaproveita `handleCreateProject`).
- Ao clicar em um projeto, fecha o dialog e chama `handleSelectProject(id)`.

### 3. Componentes novos
- `src/components/banner/BrandProfilePickerDialog.tsx` — pop-up reutilizável (lista perfis, criar novo, selecionar).
- `src/components/banner/ProjectPickerDialog.tsx` — pop-up reutilizável (lista projetos, criar novo, selecionar).

Ambos seguem o design system (dark violet, touch targets 44px, mobile-first com Drawer no mobile via `useIsMobile`).

### 4. Integração em `AgenteDiretorArte.tsx`
- Substituir as 2 ocorrências do texto "menu lateral" pelos botões que abrem `BrandProfilePickerDialog`.
- Adicionar botão "Trocar projeto" no header do bloco de geração (próximo ao nome do projeto atual ou ao card de criativo).
- Manter os Steps 1 e 3 originais funcionando (não removo nada — só adiciono atalhos).

## O que NÃO será tocado
- Lógica de geração de arte, créditos, edge functions.
- Schema do banco (`brand_profiles`, `brand_projects`).
- Stepper / fluxo dos 4 passos atuais.
- `BrandProfileSelector` original (continua sendo usado no Step 1).

## Verificação
- Na tela de geração, com nenhum perfil selecionado → aparece botão "Selecionar perfil de marca" → clica → dialog abre com perfis → seleciona → card "Marca" mostra perfil escolhido com cores.
- Mesmo fluxo para projeto: botão "Trocar projeto" → dialog → seleciona → header atualiza.
- No mobile (375px), os dialogs viram Drawers e respeitam 44px de touch target.

