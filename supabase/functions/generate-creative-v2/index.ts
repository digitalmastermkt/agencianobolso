import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArtDirectorDecision {
  scene_prompt: string;
  style: "clean" | "dynamic" | "premium" | "festive";
  template: "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda";
  layout_style: "classic" | "diagonal" | "centered_bold" | "inverted" | "side_text";
  protagonist: "text" | "person" | "balanced";
  pose_suggestion?: string;
  creative_elements?: string;
  atmosphere?: string;
  suggested_effects?: string;
  text_colors?: {
    headline: string;
    subheadline: string;
    cta_bg: string;
    cta_text: string;
  };
}

interface BrandIdentity {
  colors?: string[];
  typography?: {
    primaryFont?: string;
    secondaryFont?: string;
    style?: string;
  };
  visualStyle?: string;
  mood?: string;
  recurringElements?: string[];
}

// ==========================================
// DIRETOR DE ARTE SÊNIOR - FILOSOFIA PROFISSIONAL
// ==========================================
const artDirectorSystemPrompt = `Você é um DIRETOR DE ARTE SÊNIOR com mais de 20 anos de experiência em branding, publicidade e criação de criativos para empresas de tecnologia, estratégia e educação premium.

Seu objetivo é criar artes visuais PROFISSIONAIS, COERENTES com a identidade visual da marca, respeitando o contexto da mensagem, sem engessar o design.

=== PRINCÍPIOS FUNDAMENTAIS (OBRIGATÓRIOS) ===
1. IDENTIDADE VISUAL É FIXA - Fundo e cenário são VARIÁVEIS
2. O fundo deve REFORÇAR o contexto da mensagem, NUNCA COMPETIR com ela
3. A marca deve ser RECONHECIDA mesmo com fundos diferentes
4. APENAS UM PROTAGONISTA por arte (texto OU pessoa OU ideia visual)

=== REGRAS DE IDENTIDADE VISUAL (NÃO ALTERAR) ===
Paleta de cores:
- Use EXCLUSIVAMENTE as cores institucionais da marca
- Toda arte deve conter NO MÍNIMO 2 cores institucionais
- Tons neutros de apoio são permitidos

Tipografia:
- Respeite a hierarquia por peso, tamanho, cor e espaçamento
- NUNCA trocar fonte ou cores para "combinar com o fundo"

Linguagem gráfica:
- Mantenha padrão recorrente de elementos visuais entre as artes
- Shapes, setas, linhas, margens e ritmo visual devem ser consistentes

=== FOCO PRINCIPAL: ARTES QUE VENDEM ===
- Criativos que CONVERTEM, não que ganham prêmios de design
- Hierarquia visual clara: mensagem principal DESTACA
- CTA proeminente e clicável
- Pessoa cria CONEXÃO HUMANA e CONFIANÇA
- Cores que CHAMAM ATENÇÃO sem ser amadoras

=== DEDUÇÃO AUTOMÁTICA DE ESTILO ===
Analise o contexto e DEDUZA o estilo apropriado:
- Palavras como "black friday, promoção, desconto, urgente, últimos" → style: "dynamic" (urgência, energia)
- Palavras como "lançamento, novo, exclusivo, premium" → style: "premium" (sofisticação)
- Palavras como "natal, ano novo, aniversário, festa, celebrar" → style: "festive" (celebração)
- Palavras como "institucional, empresa, profissional, corporativo" → style: "clean" (elegância)
- Se não identificar padrão → style: "dynamic" (energia comercial)

=== LAYOUTS VARIADOS (NÃO SEMPRE O MESMO!) ===
Escolha layouts diferentes para cada arte:
- "classic": Título em cima, subtítulo abaixo, CTA embaixo (padrão)
- "diagonal": Título em diagonal, CTA flutuante, composição dinâmica
- "centered_bold": Título GIGANTE centralizado, texto mínimo, impacto máximo
- "inverted": Título embaixo, imagem domina, CTA no topo
- "side_text": Texto ao lado da pessoa (não em cima), CTA lateral

=== REGRA DO PROTAGONISTA (CRÍTICO) ===
Em cada arte, escolha apenas UM protagonista:
- "text": Texto é o destaque principal, pessoa apoia sutilmente
- "person": Pessoa é o destaque, texto é secundário/menor
- "balanced": Equilíbrio entre texto e pessoa (mais difícil de executar bem)

=== CORES DE TEXTO VARIADAS ===
NÃO use sempre branco! Sugira cores que combinam com a marca:
- Pode usar cores da marca no headline
- CTA com cor contrastante (não sempre a primária)
- Subheadline pode ter cor diferente do headline
- GARANTA legibilidade com sombras/outlines quando necessário

=== CONTEXTO VISUAL (VARIÁVEL) ===
Escolha o fundo de acordo com o contexto do conteúdo:
- Tecnologia / IA → dashboards, HUDs, circuitos, interfaces futuristas
- Execução / ação → ambientes corporativos, luz forte, foco
- Clareza / decisão → fundos limpos, gradientes suaves
- Autoridade → fundo escuro, iluminação premium
- Educacional → fundo neutro, leitura fácil
- Humano / bastidores → fotografia real ou cenário orgânico

=== ELEMENTOS CRIATIVOS POR CONTEXTO ===
- Promoção/Desconto → etiquetas de preço, raios, urgência visual, explosão
- Lançamento → holofotes, partículas brilhantes, efeito reveal
- Celebração → confetes, balões, fogos, elementos festivos
- Institucional → linhas geométricas, vidro, cidade moderna

RESPONDA APENAS com JSON válido:
{
  "scene_prompt": "descrição DETALHADA do cenário comercial em INGLÊS - focado em VENDER",
  "style": "clean" | "dynamic" | "premium" | "festive",
  "template": "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda",
  "layout_style": "classic" | "diagonal" | "centered_bold" | "inverted" | "side_text",
  "protagonist": "text" | "person" | "balanced",
  "pose_suggestion": "pose que VENDE - confiança, ação, engajamento (em INGLÊS)",
  "creative_elements": "elementos visuais que CONVERTEM (em INGLÊS)",
  "atmosphere": "atmosfera comercial - energia, confiança, urgência (em INGLÊS)",
  "suggested_effects": "efeitos visuais profissionais (em INGLÊS)",
  "text_colors": {
    "headline": "cor hex sugerida para headline baseada na marca",
    "subheadline": "cor hex para subheadline",
    "cta_bg": "cor hex do fundo do CTA",
    "cta_text": "cor hex do texto do CTA"
  }
}`;

const normalizeDecision = (raw: Partial<ArtDirectorDecision>): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Modern commercial environment with professional lighting, sales-focused atmosphere",
    style: raw?.style ?? "dynamic",
    template: raw?.template ?? "pessoa_centro",
    layout_style: raw?.layout_style ?? "classic",
    protagonist: raw?.protagonist ?? "balanced",
    pose_suggestion: raw?.pose_suggestion ?? "confident engaging pose, direct eye contact, professional smile, ready for action",
    creative_elements: raw?.creative_elements ?? "subtle energy lines, professional lighting, commercial appeal",
    atmosphere: raw?.atmosphere ?? "energetic, trustworthy, conversion-focused lighting",
    suggested_effects: raw?.suggested_effects ?? "subtle lens flare, professional depth of field",
    text_colors: raw?.text_colors ?? {
      headline: "#FFFFFF",
      subheadline: "#F1F5F9",
      cta_bg: "#FFFFFF",
      cta_text: "#0F172A"
    },
  };

  if (!(["pessoa_direita", "pessoa_centro", "pessoa_esquerda"] as const).includes(decision.template)) {
    decision.template = "pessoa_centro";
  }
  if (!(["clean", "dynamic", "premium", "festive"] as const).includes(decision.style)) {
    decision.style = "dynamic";
  }
  if (!(["classic", "diagonal", "centered_bold", "inverted", "side_text"] as const).includes(decision.layout_style)) {
    decision.layout_style = "classic";
  }
  if (!(["text", "person", "balanced"] as const).includes(decision.protagonist)) {
    decision.protagonist = "balanced";
  }

  return decision;
};

// Auto-detect style from context
const detectStyleFromContext = (context: string): string => {
  const contextLower = context.toLowerCase();
  
  if (contextLower.match(/black friday|promoção|desconto|urgente|últimos|oferta|liquidação/)) {
    return "dynamic";
  }
  if (contextLower.match(/lançamento|novo|exclusivo|premium|luxo|sofisticado/)) {
    return "premium";
  }
  if (contextLower.match(/natal|ano novo|aniversário|festa|celebrar|parabéns|réveillon/)) {
    return "festive";
  }
  if (contextLower.match(/institucional|empresa|profissional|corporativo|confiança/)) {
    return "clean";
  }
  
  return "dynamic"; // Default to commercial energy
};

// Get creative elements based on context - AUTO-DETECTED
const getContextualElements = (context: string): string => {
  const contextLower = context.toLowerCase();
  
  if (contextLower.match(/black friday|promoção|desconto/)) {
    return "Explosive burst effects, floating bold price tags with dramatic shadows, colorful confetti, bold red/black/yellow accents, urgency lightning bolts, diagonal dynamic stripes, sale badges, speed lines for action";
  }
  if (contextLower.match(/lançamento|novidade|novo/)) {
    return "Dramatic spotlight effects, stage lighting rays, sparkles and glitter particles, premium metallic gold/silver accents, holographic elements, futuristic floating particles, reveal moment energy";
  }
  if (contextLower.match(/aniversário|parabéns/)) {
    return "Colorful balloons bursting upward, confetti explosion, party streamers, birthday elements, festive bokeh lights, joyful atmosphere, celebration ribbons";
  }
  if (contextLower.match(/ano novo|réveillon|2025|2026/)) {
    return "Spectacular fireworks in night sky, champagne bubbles and glasses, elegant clock elements, starry backdrop, golden sparkles rain, celebration particles, silver and gold palette";
  }
  if (contextLower.match(/natal|feliz natal/)) {
    return "Gentle snow falling, Christmas decorations, warm red and gold, cozy lighting glow, gift boxes with ribbons, twinkling fairy lights, winter magic";
  }
  if (contextLower.match(/corporativo|institucional|empresa/)) {
    return "Sleek geometric patterns, glass and steel reflections, modern city skyline, clean gradient backgrounds, professional blue tones, subtle grid patterns";
  }
  if (contextLower.match(/motivacional|sucesso|conquista/)) {
    return "Epic horizon vista, golden hour light rays, inspirational atmosphere, achievement symbols, warm gradient sky, triumphant energy";
  }
  
  return "Dynamic commercial elements, professional gradient overlays, energy lines, subtle particle effects matching brand colors";
};

// Get layout instructions based on layout_style
const getLayoutInstructions = (layoutStyle: string, personPosition: string): string => {
  const layouts: Record<string, string> = {
    'classic': `
CLASSIC COMMERCIAL LAYOUT:
- Headline: Upper third, large and bold
- Subheadline: Below headline, smaller
- CTA: Bottom area, prominent button
- Person: ${personPosition}
- Clean hierarchy, proven conversion pattern`,
    'diagonal': `
DYNAMIC DIAGONAL LAYOUT:
- Headline: Positioned at diagonal angle (15-20 degrees), creates movement
- Subheadline: Following diagonal flow, offset from headline
- CTA: Floating position, not aligned with text
- Person: ${personPosition}, dynamic pose matching diagonal energy
- Creates visual tension and excitement`,
    'centered_bold': `
CENTERED IMPACT LAYOUT:
- Headline: GIANT centered text, dominates the frame
- Subheadline: Minimal, small beneath headline
- CTA: Centered below, secondary visual weight
- Person: ${personPosition}, supporting the bold message
- Maximum impact, minimal distraction`,
    'inverted': `
INVERTED LAYOUT (TEXT BELOW):
- Headline: Bottom third of image, large
- Subheadline: Just above headline
- CTA: Top area of image, breaking convention
- Person: ${personPosition}, upper portion of frame
- Unexpected pattern draws attention`,
    'side_text': `
SIDE TEXT LAYOUT:
- Headline: Positioned beside the person, not over
- Subheadline: Same side as headline, vertical flow
- CTA: Same side, completing the vertical text block
- Person: ${personPosition}, occupies opposite side
- Clean separation between text and person`,
  };
  
  return layouts[layoutStyle] || layouts['classic'];
};

// Get protagonist instructions
const getProtagonistInstructions = (protagonist: string): string => {
  const instructions: Record<string, string> = {
    'text': `
PROTAGONIST: TEXT (Texto é o destaque)
- Headline deve ser ENORME e dominar a composição
- Pessoa em segundo plano, menor, mais sutil, semi-transparente ou sombreada
- CTA muito proeminente
- A mensagem é o HERÓI, pessoa é apoio`,
    'person': `
PROTAGONIST: PERSON (Pessoa é o destaque)
- Pessoa deve DOMINAR a composição (60-70% do frame)
- Headline menor, discreto, elegante
- Subheadline mínimo ou ausente visualmente
- CTA secundário mas presente
- A CONEXÃO HUMANA é o foco`,
    'balanced': `
PROTAGONIST: BALANCED (Equilíbrio)
- Pessoa e texto com peso visual equilibrado
- Headline médio, legível, não dominante
- Pessoa com boa presença mas não dominante
- Composição harmoniosa, profissional
- CUIDADO: mais difícil de executar bem`,
  };
  
  return instructions[protagonist] || instructions['balanced'];
};

// Get mode-specific instructions
const getModeInstructions = (mode: string): { focus: string; composition: string } => {
  switch (mode) {
    case 'product':
      return {
        focus: `
MODO: PRODUTO (Product Hero Shot)
- PRODUTO é o PROTAGONISTA ABSOLUTO da arte
- Produto deve ocupar 50-70% do frame, centralizado ou em posição de destaque
- Iluminação profissional de estúdio focada no produto
- Fundo limpo ou com gradiente sutil usando cores da marca
- Sem pessoas - apenas o produto como estrela`,
        composition: `
COMPOSIÇÃO PARA PRODUTO:
- Produto em destaque central ou ligeiramente deslocado para criar interesse
- Texto posicionado ao redor do produto, NUNCA sobreposto
- Sombra suave e realista sob o produto
- Reflexos sutis para profundidade
- Elementos gráficos da marca ao redor`
      };
    case 'text-only':
      return {
        focus: `
MODO: TEXTO (Typography-Driven Design)
- TIPOGRAFIA é o PROTAGONISTA ABSOLUTO
- NENHUMA pessoa ou produto na arte
- Design 100% gráfico, focado na mensagem
- Use formas geométricas, gradientes e elementos abstratos
- Cores da marca como elementos visuais principais`,
        composition: `
COMPOSIÇÃO PARA TEXTO:
- Headline GIGANTE como elemento visual principal
- Fundo abstrato ou gradiente usando cores da marca
- Elementos gráficos sutis (linhas, formas, partículas)
- Alta legibilidade é prioridade máxima
- Design moderno, limpo, impactante`
      };
    default: // 'person'
      return {
        focus: `
MODO: PESSOA (Human Connection)
- PESSOA é o elemento de conexão humana
- Integrar pessoa naturalmente ao cenário
- Expressão e pose profissionais`,
        composition: `
COMPOSIÇÃO COM PESSOA:
- Pessoa posicionada estrategicamente no frame
- Texto complementando, não competindo
- Integração cromática natural`
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (data: Record<string, unknown>, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[generate-creative-v2] LOVABLE_API_KEY not configured");
      return respond({ success: false, error: "LOVABLE_API_KEY não configurada" }, 500);
    }

    const { 
      context,
      headline,
      subheadline,
      cta,
      brandProfile, 
      personImageBase64, 
      productImageBase64,
      generationMode = 'person', // 'person' | 'product' | 'text-only'
      format, 
      variationsCount = 1,
      logoUrl,
      brandIdentity,
    } = await req.json();

    // Validate required fields
    if (!headline || typeof headline !== "string" || headline.trim().length === 0) {
      return respond({ success: false, error: "O campo headline é obrigatório." }, 400);
    }

    if (!context || typeof context !== "string" || context.trim().length === 0) {
      return respond({ success: false, error: "O campo context é obrigatório." }, 400);
    }

    if (!format || typeof format !== "string") {
      return respond({ success: false, error: "O campo format é obrigatório." }, 400);
    }

    // Validate image based on mode
    if (generationMode === 'person' && (!personImageBase64 || typeof personImageBase64 !== "string")) {
      return respond({ success: false, error: "A foto da pessoa é obrigatória para o modo 'pessoa'." }, 400);
    }

    if (generationMode === 'product' && (!productImageBase64 || typeof productImageBase64 !== "string")) {
      return respond({ success: false, error: "A foto do produto é obrigatória para o modo 'produto'." }, 400);
    }

    console.log("[generate-creative-v2] Generation mode:", generationMode);

    // Sanitize inputs
    const sanitizedBrandProfile = {
      name: brandProfile?.name || "",
      colors: Array.isArray(brandProfile?.colors) ? brandProfile.colors.slice(0, 5) : [],
      mood: brandProfile?.mood || "",
      visual_style: brandProfile?.visual_style || "",
    };

    const sanitizedBrandIdentity: BrandIdentity = {
      colors: Array.isArray(brandIdentity?.colors) ? brandIdentity.colors.slice(0, 5) : sanitizedBrandProfile.colors,
      typography: brandIdentity?.typography || {},
      visualStyle: brandIdentity?.visualStyle || sanitizedBrandProfile.visual_style,
      mood: brandIdentity?.mood || sanitizedBrandProfile.mood,
      recurringElements: Array.isArray(brandIdentity?.recurringElements) ? brandIdentity.recurringElements : [],
    };

    // Auto-detect style from context
    const detectedStyle = detectStyleFromContext(context);
    console.log("[generate-creative-v2] Auto-detected style from context:", detectedStyle);

    console.log("[generate-creative-v2] Starting PROFESSIONAL BRAND generation...");
    console.log("[generate-creative-v2] Context:", context);
    console.log("[generate-creative-v2] Headline:", headline);
    console.log("[generate-creative-v2] Format:", format);
    console.log("[generate-creative-v2] Has Logo for overlay:", !!logoUrl);

    // ============ STEP 1: Art Director - PROFESSIONAL BRAND PHILOSOPHY ============
    const userPrompt = `Contexto da arte: ${context.slice(0, 300)}

ESTILO DETECTADO AUTOMATICAMENTE: ${detectedStyle}
(baseado nas palavras-chave do contexto)

Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Cores da marca: ${sanitizedBrandIdentity.colors?.join(', ') || 'não definidas'}
Mood: ${sanitizedBrandIdentity.mood || 'comercial, profissional'}

Formato: ${format}

IMPORTANTE: 
1. IDENTIDADE VISUAL É FIXA - use as cores da marca obrigatoriamente
2. Escolha o PROTAGONISTA: texto OU pessoa (não ambos competindo!)
3. Escolha um LAYOUT DIFERENTE do padrão (não sempre classic!)
4. Sugira CORES DE TEXTO que usem cores da marca (no mínimo 2 cores institucionais)
5. O fundo deve SUSTENTAR a mensagem, não COMPETIR com ela
6. Crie uma arte que pareça PARTE DE UMA SÉRIE, não isolada`;

    console.log("[generate-creative-v2] Getting Professional Art Director decision...");

    const artDirectorResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: artDirectorSystemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!artDirectorResponse.ok) {
      const errText = await artDirectorResponse.text();
      console.error("[generate-creative-v2] Art Director error:", errText);
      return respond({ success: false, error: "Erro ao consultar Diretor de Arte" }, 500);
    }

    const artDirectorData = await artDirectorResponse.json();
    const raw = artDirectorData.choices?.[0]?.message?.content?.trim() as string | undefined;
    
    if (!raw) {
      return respond({ success: false, error: "Diretor de Arte não retornou dados" }, 500);
    }

    let parsed: Partial<ArtDirectorDecision>;
    try {
      const cleanContent = raw
        .replace(/^```json\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[generate-creative-v2] JSON parse error:", parseError, "Raw:", raw);
      parsed = {};
    }

    const decision = normalizeDecision(parsed);
    console.log("[generate-creative-v2] Professional Art Director decision:", decision);
    console.log("[generate-creative-v2] Layout Style:", decision.layout_style);
    console.log("[generate-creative-v2] Protagonist:", decision.protagonist);

    // ============ STEP 2: Generate Image with PROFESSIONAL BRAND PROMPT ============
    const positionText = decision.template === "pessoa_direita" 
      ? "on the right side of the frame"
      : decision.template === "pessoa_esquerda"
        ? "on the left side of the frame"
        : "centered in the frame";

    const primaryColor = sanitizedBrandIdentity.colors?.[0] || "#3B82F6";
    const secondaryColor = sanitizedBrandIdentity.colors?.[1] || sanitizedBrandIdentity.colors?.[0] || "#8B5CF6";
    const brandColorsString = sanitizedBrandIdentity.colors?.length 
      ? sanitizedBrandIdentity.colors.join(", ") 
      : "professional blue and purple palette";

    // Get contextual creative elements - AUTO-DETECTED from context
    const contextualElements = getContextualElements(context);
    
    // Get layout instructions based on AI decision
    const layoutInstructions = getLayoutInstructions(decision.layout_style, positionText);

    // Get protagonist instructions
    const protagonistInstructions = getProtagonistInstructions(decision.protagonist);

    // Get mode-specific instructions
    const modeInstructions = getModeInstructions(generationMode);

    // Get text colors from AI decision
    const textColors = decision.text_colors || {
      headline: "#FFFFFF",
      subheadline: "#F1F5F9",
      cta_bg: primaryColor,
      cta_text: "#FFFFFF"
    };

    // Generate requested number of variations
    const validCounts = [1, 2, 4];
    const actualVariations = validCounts.includes(variationsCount) ? variationsCount : 1;
    const generatedImages: string[] = [];

    // Different layout styles for each variation
    const layoutVariations = ["classic", "diagonal", "centered_bold", "inverted", "side_text"];

    for (let i = 0; i < actualVariations; i++) {
      console.log(`[generate-creative-v2] Generating variation ${i + 1}/${actualVariations}...`);
      
      // Use different layout for each variation
      const variationLayout = layoutVariations[i % layoutVariations.length];
      const variationLayoutInstructions = getLayoutInstructions(variationLayout, positionText);

      // Professional brand prompt with philosophy - adapted for generation mode
      const imagePrompt = `=== DIRETOR DE ARTE SÊNIOR - CRIATIVO PROFISSIONAL - VARIAÇÃO ${i + 1} ===

=== MODO DE GERAÇÃO: ${generationMode.toUpperCase()} ===
${modeInstructions.focus}

${modeInstructions.composition}

=== PRINCÍPIOS FUNDAMENTAIS (OBRIGATÓRIOS) ===
1. IDENTIDADE VISUAL É FIXA - Fundo e cenário são VARIÁVEIS
2. O fundo deve REFORÇAR a mensagem, NUNCA COMPETIR com ela
3. A marca deve ser RECONHECIDA mesmo com fundos diferentes

${generationMode === 'person' ? `=== PROTAGONISTA DESTA ARTE ===
${protagonistInstructions}` : ''}

=== LAYOUT STYLE: ${variationLayout.toUpperCase()} ===
${variationLayoutInstructions}

=== ESTILO: ${decision.style.toUpperCase()} ===
${decision.style === 'dynamic' ? 'High energy, bold colors, movement, urgency cues, action-oriented' : ''}
${decision.style === 'premium' ? 'Sophisticated, luxurious, metallic accents, refined elegance' : ''}
${decision.style === 'festive' ? 'Celebratory, vibrant colors, party elements, joyful atmosphere' : ''}
${decision.style === 'clean' ? 'Professional, minimal, trustworthy, corporate elegance' : ''}

=== REGRAS DE IDENTIDADE VISUAL (OBRIGATÓRIO) ===
1. Usar NO MÍNIMO 2 cores institucionais da marca em cada arte
2. NUNCA trocar cores para "combinar com o fundo"
3. Manter linguagem gráfica consistente
4. Arte deve parecer PARTE DE UMA SÉRIE, não isolada

=== COMPOSIÇÃO PROFISSIONAL ===
- Layout em camadas: fundo contextual > elementos gráficos sutis > protagonista > identidade
- Leitura clara (padrão Z ou F)
- Respiro visual adequado
- Texto ocupando NO MÁXIMO 40% da arte

=== CREATIVE ELEMENTS FOR THIS CONTEXT ===
${contextualElements}

=== SAFE ZONE: 5% minimum from ALL edges ===
Text must NEVER touch or get cut by the frame edges.

=== BRAND IDENTITY (USAR OBRIGATORIAMENTE) ===
PRIMARY COLOR: ${primaryColor}
SECONDARY COLOR: ${secondaryColor}
FULL PALETTE: ${brandColorsString}
REGRA: Usar no mínimo 2 destas cores na arte!

=== TYPOGRAPHY WITH BRAND COLORS ===

HEADLINE: "${headline}"
TYPOGRAPHY STYLE (choose based on context):
- IMPACT: Very bold, condensed, maximum attention (for sales, urgency)
- ELEGANT: Light weight, generous letter spacing (for premium, institutional)
- PLAYFUL: Rounded, friendly letterforms (for celebration, festive)
- CORPORATE: Clean, balanced weight (for business, professional)

TEXT ORIENTATION (vary for creativity):
- Horizontal (classic, reliable)
- Diagonal 15-20° (dynamic, energetic)
- Curved following a path (creative, unique)
- Stacked vertically (modern, impactful)

- Font: Bold modern sans-serif appropriate to style
- Size: ${generationMode === 'text-only' ? 'ENORMOUS, dominates the frame as the main visual element' : decision.protagonist === 'text' ? 'ENORMOUS, dominates the frame' : decision.protagonist === 'person' ? 'Medium, elegant, not dominant' : 'Large but balanced'}
- Color: ${textColors.headline}
- Strong shadow for contrast and legibility
- COPY EXACTLY - NO CHANGES

COLOR CONTRAST RULE (CRITICAL FOR READABILITY):
- If background is DARK → headline should be LIGHT (white, cream, or bright brand color)
- If background is LIGHT → headline should be DARK or saturated brand color
- NEVER use similar tones that reduce readability
- Add text shadow or outline when needed for contrast

${subheadline ? `
SUBHEADLINE: "${subheadline}"
- Font: Light/Regular weight
- Size: 40-50% of headline
- Color: ${textColors.subheadline}
- Position: Based on layout style
- COPY EXACTLY - NO CHANGES
` : ""}

${cta ? `
CTA ELEMENT: "${cta}"
Choose the BEST format for this context (NOT ALWAYS A BUTTON!):
- BUTTON: Pill shape with solid background (for promotions, urgency, flash sales)
- HIGHLIGHTED TEXT: Bold text with subtle underline or glow (for institutional, premium)
- BADGE/TAG: Small floating element with accent color (for launches, novelty)
- INTEGRATED: Text seamlessly integrated with design, arrow pointing (for premium, minimalist)
- TEXT WITH ARROW: Bold CTA text with arrow icon "→" (for actions like "Saiba Mais →")

Background: ${textColors.cta_bg}
Text: ${textColors.cta_text}, bold
Make it look CLICKABLE if button format
- COPY EXACTLY - NO CHANGES
` : ""}

${generationMode === 'person' ? `
=== INTEGRAÇÃO HUMANA (PESSOA COMO ELEMENTO ESTRUTURAL) ===
Position: ${positionText}
Pose: ${decision.pose_suggestion}
Prominence: ${decision.protagonist === 'person' ? 'DOMINANT - 60-70% of frame, pessoa é o herói' : decision.protagonist === 'text' ? 'SUBTLE - smaller, background support, semi-transparent feel' : 'BALANCED - good presence but not overwhelming'}
CRITICAL: Keep IDENTICAL face and features from input photo
Postura profissional, expressão natural
Integração cromática com o fundo (NÃO parecer "colado" ou recortado)
A pessoa deve parecer PARTE DO SISTEMA VISUAL, não um adesivo
` : ''}

${generationMode === 'product' ? `
=== INTEGRAÇÃO DO PRODUTO ===
- Produto deve ser o HERÓI VISUAL da composição
- Posicionar produto com iluminação profissional de estúdio
- Sombra realista e reflexos sutis
- Fundo complementar, não competitivo
- Texto posicionado ao redor, NUNCA sobre o produto
- O produto da imagem de referência deve ser reproduzido FIELMENTE
` : ''}

=== SCENE ===
${decision.scene_prompt}
IMPORTANT: Background supports the message, NEVER competes with it

=== ATMOSPHERE ===
${decision.atmosphere || "Commercial, trustworthy, conversion-focused lighting"}

=== EFFECTS ===
${decision.suggested_effects || "Subtle lens flare, professional depth of field"}

=== CREATIVE ELEMENTS ===
${decision.creative_elements || contextualElements}

=== QUALITY STANDARDS ===
- Commercial advertising photography quality
- Professional studio lighting
- High resolution, print-ready
- NO watermarks, NO logos
- Agency-level output

=== CHECKLIST FINAL (ANTES DE GERAR) ===
1. ✓ Identidade visual respeitada (mínimo 2 cores da marca USADAS)
2. ✓ Fundo coerente com o contexto (sustenta, não compete)
3. ✓ Texto legível em 1 segundo
4. ✓ MODO: ${generationMode.toUpperCase()}
5. ✓ Arte parece parte de uma SÉRIE, não isolada
${generationMode === 'person' ? '6. ✓ Pessoa integrada naturalmente (não parece recortada/colada)' : ''}
${generationMode === 'product' ? '6. ✓ Produto em destaque com iluminação profissional' : ''}
${generationMode === 'text-only' ? '6. ✓ Tipografia como elemento visual principal' : ''}
7. ✓ CTA proeminente e clicável
8. ✓ LAYOUT = ${variationLayout}

"Consistência é reconhecimento, não repetição."`;

      console.log(`[generate-creative-v2] Using layout style: ${variationLayout}, protagonist: ${decision.protagonist}`);

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: imagePrompt },
                { 
                  type: "image_url", 
                  image_url: { url: personImageBase64 }
                }
              ]
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        console.error(`[generate-creative-v2] Image generation error (variation ${i + 1}):`, errText);
        
        if (imageResponse.status === 429) {
          return respond({ 
            success: false, 
            error: "Limite de requisições excedido. Aguarde alguns segundos." 
          }, 429);
        }
        if (imageResponse.status === 402) {
          return respond({ 
            success: false, 
            error: "Créditos insuficientes. Adicione créditos ao workspace." 
          }, 402);
        }
        
        continue;
      }

      const imageData = await imageResponse.json();
      const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (generatedImageUrl) {
        generatedImages.push(generatedImageUrl);
        console.log(`[generate-creative-v2] Variation ${i + 1} generated successfully with layout: ${variationLayout}, protagonist: ${decision.protagonist}`);
      }
    }

    if (generatedImages.length === 0) {
      console.error("[generate-creative-v2] No images generated");
      return respond({ 
        success: false, 
        error: "Não foi possível gerar imagens. Tente novamente." 
      }, 500);
    }

    console.log(`[generate-creative-v2] Success! Generated ${generatedImages.length} PROFESSIONAL BRAND images`);

    return respond({
      success: true,
      images: generatedImages,
      headline: headline,
      subheadline: subheadline || undefined,
      cta: cta || undefined,
      template: decision.template,
      style: decision.style,
      layout_style: decision.layout_style,
      protagonist: decision.protagonist,
      scene_prompt: decision.scene_prompt,
      pose_suggestion: decision.pose_suggestion,
      creative_elements: decision.creative_elements,
      atmosphere: decision.atmosphere,
      text_colors: decision.text_colors,
      // Return logo info for frontend overlay
      logoUrl: logoUrl || null,
      logoPosition: "bottom-right",
      brandApplied: {
        primaryColor,
        secondaryColor,
        hasLogo: !!logoUrl,
        detectedStyle: detectedStyle,
      },
    });

  } catch (error: unknown) {
    console.error("[generate-creative-v2] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return respond({ success: false, error: message }, 500);
  }
});
