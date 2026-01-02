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
}

// Art Director now ONLY analyzes context to define scene - NO TEXT CREATION
const artDirectorSystemPrompt = `Você é um Diretor de Arte sênior. Sua ÚNICA função é analisar o CONTEXTO fornecido e definir o CENÁRIO VISUAL apropriado.

IMPORTANTE:
- NÃO crie ou sugira textos - os textos são fornecidos pelo usuário e são IMUTÁVEIS
- Analise SEMANTICAMENTE o contexto para definir cenário, estilo e pose

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
  "pose_suggestion": "descrição da pose apropriada ao contexto em INGLÊS"
}`;

const normalizeDecision = (raw: Partial<ArtDirectorDecision>): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Modern professional environment with soft lighting",
    style: raw?.style ?? "clean",
    template: raw?.template ?? "pessoa_centro",
    pose_suggestion: raw?.pose_suggestion ?? "confident pose, natural smile, looking at camera",
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

    // NEW: Receive separate fields - context for AI, texts directly for image
    const { 
      context,           // For AI to understand scene (e.g., "Aniversário de 30 anos")
      headline,          // Exact text to render (e.g., "Parabéns, João!")
      subheadline,       // Exact text to render
      cta,               // Exact text to render
      brandProfile, 
      personImageBase64, 
      format, 
      variationsCount = 1 
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

    console.log("[generate-creative-v2] Starting...");
    console.log("[generate-creative-v2] Context:", context);
    console.log("[generate-creative-v2] Headline:", headline);
    console.log("[generate-creative-v2] Subheadline:", subheadline || "(none)");
    console.log("[generate-creative-v2] CTA:", cta || "(none)");
    console.log("[generate-creative-v2] Format:", format);

    // ============ STEP 1: Art Director analyzes CONTEXT only (not texts) ============
    const userPrompt = `Contexto da arte: ${context.slice(0, 300)}
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Formato: ${format}

Analise o contexto e defina o cenário visual apropriado. NÃO sugira textos.`;

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
    console.log("[generate-creative-v2] Art Director scene decision:", decision);

    // ============ STEP 2: Generate Image with USER'S EXACT TEXTS ============
    const positionText = decision.template === "pessoa_direita" 
      ? "on the right side of the frame"
      : decision.template === "pessoa_esquerda"
        ? "on the left side of the frame"
        : "centered in the frame";

    // Build text section - texts come DIRECTLY from user, not from AI
    const textSection = `=== TEXT TO RENDER - COPY EXACTLY CHARACTER BY CHARACTER ===
DO NOT modify, translate, correct spelling, or change ANY character.
Even if text appears misspelled, keep it EXACTLY as provided. This is CRITICAL.

HEADLINE (large bold text at top): "${headline}"
${subheadline ? `SUBHEADLINE (smaller text below headline): "${subheadline}"` : ''}
${cta ? `CTA BUTTON (button text at bottom): "${cta}"` : ''}

COPY THESE STRINGS EXACTLY. ANY MODIFICATION IS A CRITICAL ERROR.`;

    const imagePrompt = `=== CRITICAL RULES ===

1. CHARACTER IDENTITY: The person in output MUST be the EXACT SAME PERSON from input photo. Same face, same features, same skin tone. DO NOT create a different person.

2. TEXT PRESERVATION - EXTREMELY IMPORTANT:
${textSection}

=== VISUAL COMPOSITION ===

PERSON FROM INPUT PHOTO:
- Keep IDENTICAL face and features from input
- Position: ${positionText}
- Pose: ${decision.pose_suggestion}
- Natural integration with environment
- Professional attire if needed

BACKGROUND SCENE (based on context "${context}"):
${decision.scene_prompt}

TYPOGRAPHY STYLING:
- Headline: Large, bold, modern sans-serif font (Montserrat Bold style), white with subtle shadow
- Position headline in upper area with good contrast
${subheadline ? '- Subheadline: Smaller elegant font below headline, slightly transparent white' : ''}
${cta ? '- CTA Button: Rounded rectangle with brand color, white text, at bottom' : ''}

DESIGN STYLE: ${decision.style}

BRAND COLORS: ${sanitizedBrandProfile.colors.length > 0 ? sanitizedBrandProfile.colors.join(', ') : 'professional palette'}

QUALITY:
- Commercial advertising photography
- Professional lighting
- High resolution
- NO watermarks
- NO extra text beyond specified

=== FINAL REMINDER ===
1. Person's face = IDENTICAL to input photo
2. Text = EXACTLY as written above (character by character, no changes)`;

    console.log("[generate-creative-v2] Image prompt prepared");
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

    console.log(`[generate-creative-v2] Success! Generated ${generatedImages.length} images`);

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
    });

  } catch (error: unknown) {
    console.error("[generate-creative-v2] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return respond({ success: false, error: message }, 500);
  }
});
