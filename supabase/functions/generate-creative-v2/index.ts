import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArtDirectorDecision {
  scene_prompt: string;
  style: "clean" | "minimal" | "premium";
  template: "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda";
  pose_suggestion?: string;
  decorative_elements?: string;
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

// Art Director analyzes context to define scene + considers brand identity
const artDirectorSystemPrompt = `Você é um Diretor de Arte sênior de uma agência de publicidade premium.

Sua função é analisar o CONTEXTO fornecido e definir o CENÁRIO VISUAL apropriado, considerando a identidade visual da marca.

IMPORTANTE:
- NÃO crie ou sugira textos - os textos são fornecidos pelo usuário e são IMUTÁVEIS
- Analise SEMANTICAMENTE o contexto para definir cenário, estilo e pose
- CONSIDERE o mood e estilo visual da marca para manter consistência

MAPEAMENTO DE CONTEXTO → CENÁRIO:
- Aniversário/Parabéns/Feliz aniversário → cenário festivo com balões coloridos, confete, bolo, cores vibrantes e alegres
- Ano Novo/Réveillon/Feliz 2025/2026 → fogos de artifício, confete dourado, celebração noturna, champagne
- Natal/Feliz Natal → decoração natalina, neve, árvore de natal, cores vermelhas e douradas
- Promoção/Black Friday/Desconto → ambiente comercial moderno, elementos de urgência, cores vibrantes
- Lançamento/Novidade → palco moderno, holofotes, elementos de destaque
- Corporativo/Institucional → escritório moderno, ambiente profissional, cores neutras
- Motivacional/Sucesso → paisagem inspiradora, luz dourada, horizonte, natureza épica
- Casamento/Noivado → flores, ambiente romântico, tons suaves e elegantes

RESPONDA APENAS com JSON válido:
{
  "scene_prompt": "descrição detalhada do cenário em INGLÊS baseado no contexto analisado",
  "style": "clean" | "minimal" | "premium",
  "template": "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda",
  "pose_suggestion": "descrição da pose apropriada ao contexto em INGLÊS",
  "decorative_elements": "elementos decorativos sutis usando cores da marca (em INGLÊS)"
}`;

const normalizeDecision = (raw: Partial<ArtDirectorDecision>): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Modern professional environment with soft lighting",
    style: raw?.style ?? "clean",
    template: raw?.template ?? "pessoa_centro",
    pose_suggestion: raw?.pose_suggestion ?? "confident pose, natural smile, looking at camera",
    decorative_elements: raw?.decorative_elements ?? "",
  };

  if (!(["pessoa_direita", "pessoa_centro", "pessoa_esquerda"] as const).includes(decision.template)) {
    decision.template = "pessoa_centro";
  }
  if (!(["clean", "minimal", "premium"] as const).includes(decision.style)) {
    decision.style = "clean";
  }

  return decision;
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
      context,           // For AI to understand scene
      headline,          // Exact text to render
      subheadline,       // Exact text to render
      cta,               // Exact text to render
      brandProfile, 
      personImageBase64, 
      format, 
      variationsCount = 1,
      // NEW: Logo and brand identity for professional design
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

    // Sanitize brandProfile
    const sanitizedBrandProfile = {
      name: brandProfile?.name || "",
      colors: Array.isArray(brandProfile?.colors) ? brandProfile.colors.slice(0, 5) : [],
      mood: brandProfile?.mood || "",
      visual_style: brandProfile?.visual_style || "",
    };

    // Sanitize brandIdentity
    const sanitizedBrandIdentity: BrandIdentity = {
      colors: Array.isArray(brandIdentity?.colors) ? brandIdentity.colors.slice(0, 5) : sanitizedBrandProfile.colors,
      typography: brandIdentity?.typography || {},
      visualStyle: brandIdentity?.visualStyle || sanitizedBrandProfile.visual_style,
      mood: brandIdentity?.mood || sanitizedBrandProfile.mood,
      recurringElements: Array.isArray(brandIdentity?.recurringElements) ? brandIdentity.recurringElements : [],
    };

    console.log("[generate-creative-v2] Starting...");
    console.log("[generate-creative-v2] Context:", context);
    console.log("[generate-creative-v2] Headline:", headline);
    console.log("[generate-creative-v2] Subheadline:", subheadline || "(none)");
    console.log("[generate-creative-v2] CTA:", cta || "(none)");
    console.log("[generate-creative-v2] Format:", format);
    console.log("[generate-creative-v2] Has Logo:", !!logoUrl);
    console.log("[generate-creative-v2] Brand Colors:", sanitizedBrandIdentity.colors);

    // ============ STEP 1: Art Director analyzes CONTEXT + BRAND ============
    const userPrompt = `Contexto da arte: ${context.slice(0, 300)}
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Identidade visual: Cores ${sanitizedBrandIdentity.colors?.join(', ') || 'não definidas'}, Mood: ${sanitizedBrandIdentity.mood || 'profissional'}, Estilo: ${sanitizedBrandIdentity.visualStyle || 'moderno'}
Formato: ${format}

Analise o contexto e defina o cenário visual apropriado, mantendo consistência com a identidade da marca. NÃO sugira textos.`;

    console.log("[generate-creative-v2] Getting Art Director decision for scene...");

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
    console.log("[generate-creative-v2] Art Director decision:", decision);

    // ============ STEP 2: Generate Image with PROFESSIONAL PROMPT ============
    const positionText = decision.template === "pessoa_direita" 
      ? "on the right side of the frame"
      : decision.template === "pessoa_esquerda"
        ? "on the left side of the frame"
        : "centered in the frame";

    // Build brand colors string
    const primaryColor = sanitizedBrandIdentity.colors?.[0] || "#3B82F6";
    const secondaryColor = sanitizedBrandIdentity.colors?.[1] || sanitizedBrandIdentity.colors?.[0] || "#8B5CF6";
    const brandColorsString = sanitizedBrandIdentity.colors?.length 
      ? sanitizedBrandIdentity.colors.join(", ") 
      : "professional blue and purple palette";

    // Professional advertising prompt with safe zones and brand identity
    const imagePrompt = `=== PROFESSIONAL ADVERTISING CREATIVE ===

=== CRITICAL LAYOUT RULES (MUST FOLLOW) ===
SAFE ZONE: Keep ALL text and important elements at least 5% away from ALL edges.
- Top margin: minimum 5% from top edge before any text
- Bottom margin: minimum 5% from bottom edge after CTA
- Left/Right margins: minimum 5% padding on both sides
NO TEXT OR IMPORTANT ELEMENTS SHOULD TOUCH THE EDGES. This is CRITICAL for professional design.

=== BRAND IDENTITY (MUST APPLY) ===
PRIMARY COLOR: ${primaryColor}
SECONDARY COLOR: ${secondaryColor}
FULL PALETTE: ${brandColorsString}
TYPOGRAPHY STYLE: ${sanitizedBrandIdentity.typography?.style || "Modern bold sans-serif (Montserrat Bold style)"}
VISUAL MOOD: ${sanitizedBrandIdentity.mood || "Professional and engaging"}
VISUAL STYLE: ${sanitizedBrandIdentity.visualStyle || "Clean and modern"}
BRAND ELEMENTS: ${sanitizedBrandIdentity.recurringElements?.join(", ") || "clean geometric accents"}

Apply brand colors to:
- CTA button background: Use PRIMARY brand color (${primaryColor})
- Accent elements and decorations: Use brand palette
- Subtle gradient overlays: Use brand colors with transparency
- Text shadows/glows: Subtle brand color tint

=== LOGO PLACEMENT ===
${logoUrl ? `
INCLUDE BRAND LOGO:
- Position: Bottom-right corner OR top-left corner (choose best for composition)
- Size: Small, non-intrusive (about 8-10% of image width)
- Must be clearly visible but not dominant
- Apply subtle shadow for visibility on any background
- DO NOT stretch or distort the logo
` : "NO LOGO - Do not add any logo or brand mark to this creative."}

=== TYPOGRAPHY HIERARCHY (PROFESSIONAL ADVERTISING STANDARD) ===

HEADLINE: "${headline}"
- Font: Bold, modern sans-serif (Montserrat Bold or similar weight)
- Size: Large, dominant - main visual text element
- Color: White with subtle dark shadow for contrast
- Position: Upper third of image, respecting 5% top margin
- Alignment: Left-aligned or centered based on person position
- COPY THIS TEXT EXACTLY - DO NOT MODIFY ANY CHARACTER

${subheadline ? `
SUBHEADLINE: "${subheadline}"
- Font: Light/Regular weight, same font family
- Size: 40-50% of headline size
- Color: White with 90% opacity
- Position: Directly below headline with 8-12px spacing
- COPY THIS TEXT EXACTLY - DO NOT MODIFY ANY CHARACTER
` : ""}

${cta ? `
CTA BUTTON: "${cta}"
- Shape: Rounded rectangle (pill shape) with 20-30px border radius
- Background: PRIMARY BRAND COLOR (${primaryColor}) - solid fill
- Text: White or contrasting color, bold weight
- Size: Prominent but not overwhelming
- Position: Bottom area, respecting 5% bottom margin
- Add subtle shadow for depth and clickability appearance
- COPY THIS TEXT EXACTLY - DO NOT MODIFY ANY CHARACTER
` : ""}

=== VISUAL COMPOSITION ===

PERSON FROM INPUT PHOTO:
- CRITICAL: Keep IDENTICAL face and features from input photo
- Position: ${positionText}
- Pose: ${decision.pose_suggestion}
- Natural integration with environment
- Professional attire appropriate to context
- Good lighting on face

BACKGROUND SCENE (based on context "${context}"):
${decision.scene_prompt}

DECORATIVE ELEMENTS (to reinforce brand identity):
- ${decision.decorative_elements || "Subtle geometric shapes using brand colors"}
- Light gradient overlays using brand palette with low opacity
- Consistent visual style matching brand mood: ${sanitizedBrandIdentity.visualStyle || "modern"}
- DO NOT overdo decorations - keep it professional

=== QUALITY STANDARDS ===
- Commercial advertising photography quality
- Professional studio-quality lighting
- High resolution, print-ready output
- NO watermarks of any kind
- NO extra text beyond what is specified
- NO duplicate text elements
- Balanced composition following rule of thirds

=== FINAL CRITICAL REMINDERS ===
1. Person's face = IDENTICAL to input photo (same person, same features)
2. All text = EXACTLY as written above (character by character, no changes, no corrections)
3. Safe zones = 5% minimum from all edges
4. Brand colors = Applied to CTA, accents, and decorative elements
5. Professional quality = Agency-level advertising creative`;

    console.log("[generate-creative-v2] Professional prompt prepared with brand identity");
    console.log("[generate-creative-v2] User texts - Headline:", headline, "| Subheadline:", subheadline, "| CTA:", cta);

    // Generate requested number of variations
    const validCounts = [1, 2, 4];
    const actualVariations = validCounts.includes(variationsCount) ? variationsCount : 1;
    const generatedImages: string[] = [];

    for (let i = 0; i < actualVariations; i++) {
      console.log(`[generate-creative-v2] Generating variation ${i + 1}/${actualVariations}...`);
      
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
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
        console.error(`[generate-creative-v2] Gemini image error (variation ${i + 1}):`, errText);
        
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
        console.log(`[generate-creative-v2] Variation ${i + 1} generated successfully`);
      }
    }

    if (generatedImages.length === 0) {
      console.error("[generate-creative-v2] No images generated");
      return respond({ 
        success: false, 
        error: "Não foi possível gerar imagens. Tente novamente." 
      }, 500);
    }

    console.log(`[generate-creative-v2] Success! Generated ${generatedImages.length} images with professional branding`);

    return respond({
      success: true,
      images: generatedImages,
      // Return user's original texts (not AI-modified)
      headline: headline,
      subheadline: subheadline || undefined,
      cta: cta || undefined,
      template: decision.template,
      style: decision.style,
      scene_prompt: decision.scene_prompt,
      pose_suggestion: decision.pose_suggestion,
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
