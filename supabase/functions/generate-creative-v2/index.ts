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

// Art Director - COMMERCIAL SALES FOCUS with LAYOUT VARIATION
const artDirectorSystemPrompt = `Você é um DIRETOR DE ARTE COMERCIAL especializado em ANÚNCIOS QUE VENDEM.

Sua função é analisar o CONTEXTO e criar uma DIREÇÃO VISUAL focada em CONVERSÃO e VENDAS.

=== FOCO PRINCIPAL: VENDER ===
- Artes que CONVERTEM, não que ganham prêmios de design
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

=== CORES DE TEXTO VARIADAS ===
NÃO use sempre branco! Sugira cores que combinam com a marca:
- Pode usar cores da marca no headline
- CTA com cor contrastante (não sempre a primária)
- Subheadline pode ter cor diferente do headline

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

    if (!personImageBase64 || typeof personImageBase64 !== "string") {
      return respond({ success: false, error: "A foto da pessoa é obrigatória." }, 400);
    }

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

    console.log("[generate-creative-v2] Starting COMMERCIAL SALES-FOCUSED generation...");
    console.log("[generate-creative-v2] Context:", context);
    console.log("[generate-creative-v2] Headline:", headline);
    console.log("[generate-creative-v2] Format:", format);
    console.log("[generate-creative-v2] Has Logo for overlay:", !!logoUrl);

    // ============ STEP 1: Art Director - COMMERCIAL FOCUS ============
    const userPrompt = `Contexto da arte: ${context.slice(0, 300)}

ESTILO DETECTADO AUTOMATICAMENTE: ${detectedStyle}
(baseado nas palavras-chave do contexto)

Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Cores da marca: ${sanitizedBrandIdentity.colors?.join(', ') || 'não definidas'}
Mood: ${sanitizedBrandIdentity.mood || 'comercial, profissional'}

Formato: ${format}

IMPORTANTE: 
1. Foque em CONVERSÃO e VENDAS, não em arte
2. Escolha um LAYOUT DIFERENTE do padrão (não sempre classic!)
3. Sugira CORES DE TEXTO que combinem com a marca (não sempre branco!)
4. Crie uma arte que faça as pessoas CLICAREM e COMPRAREM`;

    console.log("[generate-creative-v2] Getting Commercial Art Director decision...");

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
    console.log("[generate-creative-v2] Commercial Art Director decision:", decision);
    console.log("[generate-creative-v2] Layout Style:", decision.layout_style);

    // ============ STEP 2: Generate Image with COMMERCIAL SALES PROMPT ============
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

      // Commercial professional prompt - SALES FOCUSED
      const imagePrompt = `=== COMMERCIAL ADVERTISING CREATIVE FOR SALES - VARIATION ${i + 1} ===

GOAL: This ad must CONVERT. Make people CLICK and BUY.

=== LAYOUT STYLE: ${variationLayout.toUpperCase()} ===
${variationLayoutInstructions}

=== STYLE: ${decision.style.toUpperCase()} ===
${decision.style === 'dynamic' ? 'High energy, bold colors, movement, urgency cues, action-oriented' : ''}
${decision.style === 'premium' ? 'Sophisticated, luxurious, metallic accents, refined elegance' : ''}
${decision.style === 'festive' ? 'Celebratory, vibrant colors, party elements, joyful atmosphere' : ''}
${decision.style === 'clean' ? 'Professional, minimal, trustworthy, corporate elegance' : ''}

=== CRITICAL SALES DESIGN PRINCIPLES ===
1. HEADLINE MUST POP - It's the first thing people see
2. CTA MUST BE PROMINENT - Make it look clickable
3. PERSON CREATES TRUST - Human connection sells
4. CLEAR HIERARCHY - Guide the eye to the message
5. PROFESSIONAL BUT NOT BORING - Stand out in the feed

=== CREATIVE ELEMENTS FOR THIS CONTEXT ===
${contextualElements}

=== SAFE ZONE: 5% minimum from ALL edges ===
Text must NEVER touch or get cut by the frame edges.

=== BRAND IDENTITY ===
PRIMARY COLOR: ${primaryColor}
SECONDARY COLOR: ${secondaryColor}
FULL PALETTE: ${brandColorsString}

=== TYPOGRAPHY WITH VARIED COLORS ===

HEADLINE: "${headline}"
- Font: Bold modern sans-serif (Montserrat Bold style)
- Size: Large, dominant, attention-grabbing
- Color: ${textColors.headline} (NOT always white - use brand colors when appropriate)
- Strong shadow for contrast
- COPY EXACTLY - NO CHANGES

${subheadline ? `
SUBHEADLINE: "${subheadline}"
- Font: Light/Regular weight
- Size: 40-50% of headline
- Color: ${textColors.subheadline}
- Position: Based on layout style
- COPY EXACTLY - NO CHANGES
` : ""}

${cta ? `
CTA BUTTON: "${cta}"
- Shape: Rounded rectangle (pill shape)
- Background: ${textColors.cta_bg} (can be different from primary!)
- Text: ${textColors.cta_text}, bold
- Make it look CLICKABLE - add subtle shadow/glow
- COPY EXACTLY - NO CHANGES
` : ""}

=== PERSON COMPOSITION ===
Position: ${positionText}
Pose: ${decision.pose_suggestion}
CRITICAL: Keep IDENTICAL face and features from input photo
Natural integration with commercial environment
Professional lighting on face, rim light for separation

=== SCENE ===
${decision.scene_prompt}

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
- Agency-level output that SELLS

=== FINAL CHECKLIST ===
1. Person's face = IDENTICAL to input photo
2. All text = EXACTLY as specified (character by character)
3. Safe zones = 5% minimum from all edges
4. Brand colors = Applied strategically
5. LAYOUT = ${variationLayout} (NOT always the same!)
6. FOCUS = This must CONVERT, not just look pretty`;

      console.log(`[generate-creative-v2] Using layout style: ${variationLayout}`);

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
        console.log(`[generate-creative-v2] Variation ${i + 1} generated successfully with layout: ${variationLayout}`);
      }
    }

    if (generatedImages.length === 0) {
      console.error("[generate-creative-v2] No images generated");
      return respond({ 
        success: false, 
        error: "Não foi possível gerar imagens. Tente novamente." 
      }, 500);
    }

    console.log(`[generate-creative-v2] Success! Generated ${generatedImages.length} COMMERCIAL SALES images`);

    return respond({
      success: true,
      images: generatedImages,
      headline: headline,
      subheadline: subheadline || undefined,
      cta: cta || undefined,
      template: decision.template,
      style: decision.style,
      layout_style: decision.layout_style,
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
