

## Plano: Nova Paleta de Cores para App de Agência de Marketing Digital

### Análise do Problema Atual
A paleta atual usa cyan elétrico (#00BFFF) + roxo neon + pink — um visual "cyberpunk" que funciona para apps de tecnologia pura, mas não transmite **confiança profissional** que uma agência de marketing precisa. Fica visualmente agressivo e cansativo.

### Recomendação: Paleta "Premium Agency"

A cor ideal para um app de agência de marketing digital é **violeta/índigo profundo** como primária, combinado com **dourado/âmbar** como accent. Essa combinação transmite:

- **Criatividade** (violeta) — associado a imaginação e inovação
- **Profissionalismo** (índigo escuro) — transmite seriedade e competência
- **Valor/Premium** (dourado) — remete a qualidade e resultados

```text
Paleta Proposta:

PRIMARY:     #7C3AED (Violeta vibrante - botões, links, CTAs)
ACCENT:      #F59E0B (Âmbar/Dourado - destaques, badges, sucesso)
BACKGROUND:  #0F0D15 (Preto-violeta profundo)
CARD:        #1A1625 (Elevação sutil violeta)
MUTED:       #2D2640 (Bordas e áreas secundárias)
FOREGROUND:  #F0ECF9 (Branco levemente lilás)
DESTRUCTIVE: #EF4444 (Vermelho padrão)

Gradientes:
- Primary: Violeta → Índigo (#7C3AED → #4F46E5)
- Accent:  Violeta → Âmbar (#7C3AED → #F59E0B)  
- Subtle:  Background escuro com toque violeta
```

### Mudanças Técnicas

1. **`src/index.css`** — Substituir toda a paleta dark mode:
   - `--primary`: de cyan para violeta `263 84% 58%`
   - `--background`: preto-violeta `260 20% 7%`
   - `--card`: elevação violeta `260 25% 12%`
   - `--accent`: âmbar dourado `43 96% 56%`
   - `--border`: violeta muted `260 20% 20%`
   - Gradientes atualizados para violeta→índigo
   - Sombras/glows com tom violeta em vez de cyan

2. **`src/index.css`** (light mode) — Ajustar para coerência:
   - Primary violeta mantido
   - Backgrounds claros com toque lavanda

3. **`tailwind.config.ts`** — Nenhuma mudança estrutural necessária (já usa CSS variables)

4. **`src/components/ui/button.tsx`** — Nenhuma mudança (já usa `bg-primary`)

### Arquivos Modificados
1. `src/index.css` — Nova paleta de cores completa

