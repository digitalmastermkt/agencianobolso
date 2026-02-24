

## Plano: Modo Escuro por Padrão + Melhorias de UX Mobile

### Contexto
A aplicação usa `next-themes` para gerenciamento de tema, mas o padrão atual e light. O app precisa ser 100% usavel no celular e ha varias oportunidades de melhoria na experiencia mobile.

### Mudancas Planejadas

---

#### 1. Modo Escuro como Padrao
- **`src/App.tsx`**: Envolver toda a aplicacao com `ThemeProvider` do `next-themes` com `defaultTheme="dark"`.
- **`src/index.css`**: Ajustar as variaveis CSS do dark mode para ficarem mais polidas e coerentes com o design system tech/cyberpunk ja existente (gradientes, glows, sombras neon).

#### 2. DashboardLayout - Header Mobile Melhorado
- **`src/components/layout/DashboardLayout.tsx`**: 
  - Adicionar titulo da pagina atual no header mobile.
  - Aumentar altura do header para 56px (melhor touch target).
  - Adicionar `CreditsBalanceDisplay` compacto no header para facil acesso.

#### 3. Sidebar Mobile - Bottom Navigation
- **`src/components/AppSidebar.tsx`**: No mobile, a sidebar e dificil de acessar. Adicionar uma bottom navigation bar fixa com os itens principais (Dashboard, Agentes, Favoritos, Perfil) para navegacao rapida no celular.

#### 4. Stepper do Diretor de Arte - Otimizacao Mobile
- **`src/pages/agents/AgenteDiretorArte.tsx`**:
  - **Stepper**: No mobile, mostrar apenas o step atual com indicador numerico (1/5) em vez de todos os 5 circulos lado a lado que ficam apertados.
  - **Botoes de navegacao**: Fixar os botoes Voltar/Avancar no bottom da tela no mobile para facil acesso (sticky footer).
  - **Cards**: Reduzir padding dos cards no mobile para ganhar mais espaco.
  - **Grid de variacoes**: No step 5, usar `grid-cols-2` no mobile em vez de `grid-cols-1` para ver mais opcoes sem scroll.

#### 5. Formulario Step 4 - UX Mobile
- **Tipo de Arte**: Reduzir padding dos botoes de selecao de modo no mobile.
- **Campos de texto**: Garantir que labels e inputs tenham espacamento adequado para toque.
- **Botao Gerar**: Ja usa `buttonMinHeight` - manter.

#### 6. Melhorias Globais de Dark Mode
- **Cards e bordas**: Adicionar bordas mais visiveis no dark mode.
- **Inputs e textareas**: Garantir contraste adequado.
- **Badges**: Ajustar cores para dark mode.
- **Upload areas (dashed borders)**: Ajustar cores para dark mode.

---

### Detalhes Tecnicos

**ThemeProvider**: Sera adicionado em `App.tsx` envolvendo o `QueryClientProvider`:
```tsx
import { ThemeProvider } from "next-themes"
// ...
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  // ...existing app content
</ThemeProvider>
```

**Bottom Navigation Mobile**: Nova componente `MobileBottomNav.tsx` com 4-5 icones principais, posicionamento `fixed bottom-0`, altura de 64px, `safe-area-inset-bottom` para iPhones com notch.

**Stepper Mobile**: Substituir a row de 5 circulos por um componente compacto:
```text
[ < ] Step 2 de 5 - Configurar [ > ]
```

**Sticky Navigation Buttons**: No mobile, os botoes Voltar/Avancar serao fixos no bottom (acima da bottom nav) com `position: sticky; bottom: 0`.

### Arquivos Modificados
1. `src/App.tsx` - Adicionar ThemeProvider
2. `src/index.css` - Refinar dark mode variables  
3. `src/components/layout/DashboardLayout.tsx` - Header mobile melhorado
4. `src/components/layout/MobileBottomNav.tsx` - **NOVO** - Bottom navigation
5. `src/pages/agents/AgenteDiretorArte.tsx` - Stepper e layout mobile
6. `src/components/AppSidebar.tsx` - Ajustes para coexistir com bottom nav

