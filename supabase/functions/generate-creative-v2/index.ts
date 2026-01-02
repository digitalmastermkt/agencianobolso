import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArtDirectorDecision {
  scene_prompt: string;
  style: "clean" | "dynamic" | "premium" | "festive";
  template: "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda";
  pose_suggestion?: string;
  creative_elements?: string;
  atmosphere?: string;
  suggested_effects?: string;
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

// Art Director - More creative and brand-focused
const artDirectorSystemPrompt = `Você é um Diretor de Arte CRIATIVO de uma agência de publicidade premium.

Sua função é analisar o CONTEXTO e criar uma DIREÇÃO VISUAL ÚNICA E IMPACTANTE.

REGRAS CRIATIVAS:
- Pense FORA DA CAIXA - evite composições genéricas
- Sugira elementos visuais RICOS que reforcem a mensagem
- Considere a identidade visual da marca para manter consistência
- Crie atmosferas MEMORÁVEIS

MAPEAMENTO DE CONTEXTO → ELEMENTOS CRIATIVOS:
- Promoção/Black Friday/Desconto → explosão de cores, etiquetas de preço flutuantes, confetes, raios de energia, urgência visual
- Lançamento/Novidade → holofotes dramáticos, partículas brilhantes, efeito de palco, holográfico, futurista
- Aniversário/Parabéns → balões coloridos explodindo, confetes em movimento, bolo, atmosfera festiva
- Ano Novo/Réveillon → fogos de artifício, champagne, relógio, estrelas, dourado e prata, celebração noturna
- Natal → neve caindo, decorações natalinas, vermelho e dourado, aconchegante
- Corporativo/Institucional → linhas geométricas elegantes, vidro e metal, cityscape moderno
- Motivacional/Sucesso → horizonte épico, luz dourada, montanhas, natureza grandiosa

RESPONDA APENAS com JSON válido:
{
  "scene_prompt": "descrição DETALHADA e CRIATIVA do cenário em INGLÊS - seja específico com luz, cores, atmosfera",
  "style": "clean" | "dynamic" | "premium" | "festive",
  "template": "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda",
  "pose_suggestion": "pose EXPRESSIVA apropriada ao contexto em INGLÊS",
  "creative_elements": "elementos visuais ESPECÍFICOS que reforçam a mensagem (em INGLÊS)",
  "atmosphere": "descrição da atmosfera visual - luz, cores, mood (em INGLÊS)",
  "suggested_effects": "efeitos visuais sugeridos - lens flare, particles, gradients (em INGLÊS)"
}`;

const normalizeDecision = (raw: Partial<ArtDirectorDecision>): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Modern professional environment with dramatic lighting",
    style: raw?.style ?? "dynamic",
    template: raw?.template ?? "pessoa_centro",
    pose_suggestion: raw?.pose_suggestion ?? "confident dynamic pose, natural smile, engaging with camera",
    creative_elements: raw?.creative_elements ?? "subtle geometric shapes, light particles",
    atmosphere: raw?.atmosphere ?? "vibrant, professional, energetic lighting",
    suggested_effects: raw?.suggested_effects ?? "subtle lens flare, bokeh background",
  };

  if (!(["pessoa_direita", "pessoa_centro", "pessoa_esquerda"] as const).includes(decision.template)) {
    decision.template = "pessoa_centro";
  }
  if (!(["clean", "dynamic", "premium", "festive"] as const).includes(decision.style)) {
    decision.style = "dynamic";
  }

  return decision;
};

// Get creative elements based on context and campaign template
const getContextualElements = (context: string, campaignTemplate?: string): string => {
  // First check campaign template for more specific styling
  if (campaignTemplate) {
    const templateElements: Record<string, string> = {
      'black-friday': "Explosive dramatic burst effects, floating 3D price tags with neon glow, shopping bags flying, colorful confetti explosion, bold red/black/yellow electric accents, pulsating urgency cues like lightning bolts and timer icons, aggressive diagonal stripes, glowing sale badges, speed lines, impact effects",
      'natal': "Magical snow gently falling, beautifully decorated Christmas tree with glowing ornaments, warm rich red and gold decorations, cozy fireplace lighting glow, elegant gift boxes with silk ribbons, holly leaves and berries, enchanting twinkling fairy lights bokeh, winter wonderland magic atmosphere, candy canes, snowflakes",
      'ano-novo': "Spectacular golden fireworks bursting across midnight sky, crystal champagne glasses with bubbles rising, elegant ornate clock striking midnight, deep starry night backdrop, luxurious golden sparkles cascading down, glowing countdown numbers, celebration confetti and streamers, sophisticated silver and gold palette, party elements",
      'lancamento': "Dramatic theatrical spotlight beams, premium stage with velvet curtains, spectacular sparkles and glitter particles trail, luxurious metallic gold and chrome accents, futuristic holographic elements floating, sleek glass and mirror reflections, product pedestal with dramatic shadows, reveal moment energy, innovation particles",
      'promocao': "Bold eye-catching burst graphics, floating discount percentage badges, dynamic arrow elements pointing to action, bright vibrant color splashes, opportunity visual cues like stars and sparkles, energetic diagonal composition, attention-grabbing price displays, urgency timer elements, limited time visual effects",
      'institucional': "Sophisticated minimal geometric patterns, elegant glass and brushed steel textures, impressive modern city skyline silhouette, subtle floating abstract data visualization, clean professional gradient transitions, refined corporate blue and gray tones, precision grid alignment, professional photography style, trust symbols",
    };
    
    if (templateElements[campaignTemplate]) {
      return templateElements[campaignTemplate];
    }
  }
  
  const contextLower = context.toLowerCase();
  
  if (contextLower.includes('black friday') || contextLower.includes('promoção') || contextLower.includes('desconto')) {
    return "Explosive burst effects, floating price tags with dramatic shadows, shopping bags, colorful confetti, bold red/black/yellow color accents, urgency visual cues like lightning bolts, diagonal dynamic stripes, sale stickers";
  }
  if (contextLower.includes('lançamento') || contextLower.includes('novidade') || contextLower.includes('novo')) {
    return "Dramatic spotlight effects, stage lighting with rays, sparkles and glitter particles, premium metallic gold/silver accents, holographic rainbow elements, futuristic floating particles, sleek glass reflections";
  }
  if (contextLower.includes('aniversário') || contextLower.includes('parabéns')) {
    return "Colorful balloons bursting upward, confetti explosion in motion, party streamers, birthday cake elements, festive bokeh lights, joyful atmosphere, golden and colorful accents, celebration ribbons";
  }
  if (contextLower.includes('ano novo') || contextLower.includes('réveillon') || contextLower.includes('2025') || contextLower.includes('2026')) {
    return "Spectacular fireworks bursting in night sky, champagne bubbles and glasses, elegant clock elements, starry night backdrop, golden sparkles rain, countdown visual elements, celebration particles, silver and gold palette";
  }
  if (contextLower.includes('natal') || contextLower.includes('feliz natal')) {
    return "Gentle snow falling, Christmas tree with ornaments, warm red and gold decorations, cozy lighting, gift boxes with ribbons, holly leaves, twinkling fairy lights, winter magic atmosphere";
  }
  if (contextLower.includes('corporativo') || contextLower.includes('institucional') || contextLower.includes('empresa')) {
    return "Sleek geometric patterns, glass and steel architecture reflections, modern city skyline, floating data visualization elements, clean gradient backgrounds, professional blue tones, subtle grid patterns";
  }
  if (contextLower.includes('motivacional') || contextLower.includes('sucesso') || contextLower.includes('conquista')) {
    return "Epic mountain peak vista, golden hour light rays, inspirational horizon, soaring birds, achievement symbols, warm gradient sky, powerful natural elements, triumphant atmosphere";
  }
  
  return "Dynamic geometric shapes, subtle particle effects, professional gradient overlays, elegant accent elements matching brand colors";
};

// Get visual style instructions
const getVisualStyleInstructions = (style?: string): string => {
  const styles: Record<string, string> = {
    'minimalista': `
MINIMALIST STYLE DIRECTION:
- Clean, uncluttered composition with generous negative space
- Subtle, refined color palette - avoid loud colors
- Elegant typography with plenty of breathing room
- Soft, diffused lighting with gentle shadows
- Geometric simplicity - avoid complex decorations
- Premium white space usage
- Less is more approach`,
    'dinamico': `
DYNAMIC STYLE DIRECTION:
- High energy composition with diagonal lines and movement
- Bold, contrasting colors that pop
- Dynamic angles and asymmetric layouts
- Action-oriented elements suggesting motion
- Speed lines, blur effects, energy particles
- Aggressive typography with impact
- Visual tension and excitement`,
    'premium': `
PREMIUM STYLE DIRECTION:
- Luxurious, sophisticated aesthetic
- Rich metallic accents (gold, silver, rose gold)
- Deep, rich colors with elegant gradients
- Dramatic lighting with rim lights and highlights
- High-end textures (silk, velvet, leather suggestions)
- Refined, elegant typography
- Exclusive, aspirational mood`,
    'festivo': `
FESTIVE STYLE DIRECTION:
- Vibrant celebration atmosphere
- Colorful, joyful palette
- Party elements (confetti, balloons, sparkles)
- Warm, inviting lighting
- Fun, playful typography
- Celebratory decorations
- Happy, energetic mood`,
  };
  
  return styles[style || 'dinamico'] || styles['dinamico'];
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
      visualStyle,
      campaignTemplate,
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

    console.log("[generate-creative-v2] Starting with SUPERIOR MODEL...");
    console.log("[generate-creative-v2] Context:", context);
    console.log("[generate-creative-v2] Headline:", headline);
    console.log("[generate-creative-v2] Format:", format);
    console.log("[generate-creative-v2] Visual Style:", visualStyle || "dinamico");
    console.log("[generate-creative-v2] Campaign Template:", campaignTemplate || "none");
    console.log("[generate-creative-v2] Has Logo for overlay:", !!logoUrl);

    // ============ STEP 1: Art Director - More Creative ============
    const userPrompt = `Contexto da arte: ${context.slice(0, 300)}
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Identidade visual: Cores ${sanitizedBrandIdentity.colors?.join(', ') || 'não definidas'}, Mood: ${sanitizedBrandIdentity.mood || 'profissional'}, Estilo: ${sanitizedBrandIdentity.visualStyle || 'moderno'}
Formato: ${format}

IMPORTANTE: Seja CRIATIVO! Sugira elementos visuais RICOS e IMPACTANTES que façam esta arte se destacar. Evite composições genéricas.`;

    console.log("[generate-creative-v2] Getting Creative Art Director decision...");

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
    console.log("[generate-creative-v2] Creative Art Director decision:", decision);

    // ============ STEP 2: Generate Image with CREATIVE PROMPT ============
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

    // Get contextual creative elements based on template or context
    const contextualElements = getContextualElements(context, campaignTemplate);
    
    // Get visual style instructions
    const visualStyleInstructions = getVisualStyleInstructions(visualStyle);

    // Generate requested number of variations
    const validCounts = [1, 2, 4];
    const actualVariations = validCounts.includes(variationsCount) ? variationsCount : 1;
    const generatedImages: string[] = [];

    for (let i = 0; i < actualVariations; i++) {
      console.log(`[generate-creative-v2] Generating variation ${i + 1}/${actualVariations} with SUPERIOR MODEL...`);
      
      // Variation-specific creative direction
      const variationStyles = [
        "More minimalist and elegant, clean composition with strategic negative space",
        "More dynamic and energetic, with movement, diagonal lines and visual tension",
        "More decorative and rich, abundant brand elements and visual details",
        "More dramatic and bold, high contrast lighting and powerful atmosphere"
      ];
      const variationInstruction = variationStyles[i % variationStyles.length];

      // Creative professional prompt - NO LOGO (will be added via overlay)
      const imagePrompt = `=== PROFESSIONAL ADVERTISING CREATIVE - VARIATION ${i + 1} ===

${visualStyleInstructions}

=== CREATIVE DIRECTION (BREAK THE MOLD) ===
This is NOT a generic stock photo. Create something VISUALLY STRIKING and MEMORABLE.
VARIATION STYLE: ${variationInstruction}
${campaignTemplate ? `CAMPAIGN: ${campaignTemplate.toUpperCase()} themed creative` : ''}

CREATIVE ELEMENTS FOR THIS CONTEXT:
${contextualElements}

COMPOSITION TECHNIQUES TO APPLY:
- Dynamic diagonal lines and asymmetric layouts that create visual tension
- Depth through foreground/background elements and atmospheric perspective
- Light effects: lens flares, god rays, rim lighting, dramatic shadows
- Color blocking with brand palette for visual impact
- Movement and energy through particle effects and dynamic shapes

=== CRITICAL LAYOUT RULES ===
SAFE ZONE: Keep ALL text and elements at least 5% away from ALL edges.
Text must NEVER touch or get cut by the frame edges.

=== BRAND IDENTITY ===
PRIMARY COLOR: ${primaryColor}
SECONDARY COLOR: ${secondaryColor}
FULL PALETTE: ${brandColorsString}
VISUAL MOOD: ${sanitizedBrandIdentity.mood || "Professional and engaging"}

Apply brand colors to:
- CTA button background: PRIMARY brand color (${primaryColor})
- Accent elements, decorations, and effects
- Gradient overlays with brand colors at low opacity

=== NO LOGO ===
DO NOT add any logo, watermark, or brand mark to the image.
The logo will be added separately as an overlay.

=== TYPOGRAPHY HIERARCHY ===

HEADLINE: "${headline}"
- Font: Bold modern sans-serif (Montserrat Bold style)
- Size: Large, dominant
- Color: White with dark shadow for contrast
- Position: Upper third, respecting 5% safe margin
- COPY EXACTLY - NO CHANGES

${subheadline ? `
SUBHEADLINE: "${subheadline}"
- Font: Light/Regular weight
- Size: 40-50% of headline
- Color: White with 90% opacity
- Position: Below headline
- COPY EXACTLY - NO CHANGES
` : ""}

${cta ? `
CTA BUTTON: "${cta}"
- Shape: Rounded rectangle (pill shape)
- Background: ${primaryColor} (solid)
- Text: White, bold
- Position: Bottom area, respecting 5% margin
- Add subtle shadow for depth
- COPY EXACTLY - NO CHANGES
` : ""}

=== VISUAL COMPOSITION ===

PERSON:
- Position: ${positionText}
- Pose: ${decision.pose_suggestion}
- CRITICAL: Keep IDENTICAL face and features from input photo
- Natural integration with environment
- Good lighting on face, rim light for separation

SCENE:
${decision.scene_prompt}

ATMOSPHERE:
${decision.atmosphere || "Vibrant, professional, with dramatic lighting"}

EFFECTS TO INCLUDE:
${decision.suggested_effects || "Subtle lens flare, bokeh, particle effects"}

CREATIVE ELEMENTS:
${decision.creative_elements || contextualElements}

=== QUALITY STANDARDS ===
- Commercial advertising photography quality
- Dramatic, professional lighting
- High resolution, print-ready
- NO watermarks, NO logos
- NO duplicate text
- Agency-level creative output

=== FINAL REMINDERS ===
1. Person's face = IDENTICAL to input photo
2. All text = EXACTLY as specified (character by character)
3. Safe zones = 5% minimum from all edges
4. Brand colors = Applied throughout
5. BE CREATIVE = This should be visually stunning, not generic`;

      console.log("[generate-creative-v2] Using SUPERIOR MODEL: google/gemini-3-pro-image-preview");

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview", // SUPERIOR MODEL
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
        console.log(`[generate-creative-v2] Variation ${i + 1} generated successfully with SUPERIOR MODEL`);
      }
    }

    if (generatedImages.length === 0) {
      console.error("[generate-creative-v2] No images generated");
      return respond({ 
        success: false, 
        error: "Não foi possível gerar imagens. Tente novamente." 
      }, 500);
    }

    console.log(`[generate-creative-v2] Success! Generated ${generatedImages.length} CREATIVE images`);

    return respond({
      success: true,
      images: generatedImages,
      headline: headline,
      subheadline: subheadline || undefined,
      cta: cta || undefined,
      template: decision.template,
      style: decision.style,
      scene_prompt: decision.scene_prompt,
      pose_suggestion: decision.pose_suggestion,
      creative_elements: decision.creative_elements,
      atmosphere: decision.atmosphere,
      // Return logo info for frontend overlay
      logoUrl: logoUrl || null,
      logoPosition: "bottom-right", // Frontend will use this for overlay
      brandApplied: {
        primaryColor,
        secondaryColor,
        hasLogo: !!logoUrl,
      },
    });

  } catch (error: unknown) {
    console.error("[generate-creative-v2] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return respond({ success: false, error: message }, 500);
  }
});
