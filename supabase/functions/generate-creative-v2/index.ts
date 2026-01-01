import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArtDirectorDecision {
  scene_prompt: string;
  style: "clean" | "minimal" | "premium";
  template: "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda";
  headline: string;
  subheadline?: string;
  cta?: string;
  pose_suggestion?: string;
}

const artDirectorSystemPrompt = `Você é um Diretor de Arte sênior especializado em criativos publicitários.

Seu papel é definir a DIREÇÃO VISUAL COMPLETA para um banner onde a pessoa da foto será RECRIADA em um novo cenário, mantendo sua identidade facial.

RESPONDA APENAS com JSON válido neste formato:
{
  "scene_prompt": "descrição detalhada do cenário em INGLÊS - ambiente, iluminação, elementos decorativos",
  "style": "clean" | "minimal" | "premium",
  "template": "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda",
  "headline": "texto principal curto e impactante em português",
  "subheadline": "texto secundário opcional em português",
  "cta": "texto do botão opcional em português",
  "pose_suggestion": "descrição da pose ideal em INGLÊS"
}

REGRAS:
- scene_prompt e pose_suggestion devem ser em INGLÊS para melhor resultado na IA de imagem
- headline, subheadline e cta devem ser em PORTUGUÊS
- Cenário deve ser profissional e adequado para publicidade
- Sugira poses naturais e profissionais`;

const normalizeDecision = (raw: Partial<ArtDirectorDecision>, fallbackHeadline: string): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Modern professional office with soft cinematic lighting, clean background with subtle gradient",
    style: raw?.style ?? "clean",
    template: raw?.template ?? "pessoa_centro",
    headline: raw?.headline ?? fallbackHeadline,
    subheadline: raw?.subheadline,
    cta: raw?.cta,
    pose_suggestion: raw?.pose_suggestion ?? "confident professional pose, natural smile, looking at camera",
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

    const { description, brandProfile, personImageBase64, format, variationsCount = 1 } = await req.json();

    if (!description || typeof description !== "string") {
      return respond({ success: false, error: "O campo description é obrigatório." }, 400);
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
      overall_description: typeof brandProfile?.overall_description === "string" 
        ? brandProfile.overall_description.slice(0, 500) 
        : "",
    };

    console.log("[generate-creative-v2] Starting with Gemini...");
    console.log("[generate-creative-v2] Format:", format);

    // ============ STEP 1: Get Art Director Decision via Gemini ============
    const userPrompt = `Briefing: ${description.slice(0, 800)}
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Formato: ${format}

Defina a direção visual para um banner onde a pessoa da foto será recriada no cenário.`;

    console.log("[generate-creative-v2] Getting Art Director decision...");

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

    const decision = normalizeDecision(parsed, description.slice(0, 50));
    console.log("[generate-creative-v2] Art Director decision:", decision);

    // ============ STEP 2: Generate Image with Gemini (Character Consistency) ============
    const positionText = decision.template === "pessoa_direita" 
      ? "on the right side of the frame"
      : decision.template === "pessoa_esquerda"
        ? "on the left side of the frame"
        : "centered in the frame";

    // Optimized prompt for Gemini character consistency
    const imagePrompt = `CHARACTER CONSISTENCY TASK - CRITICAL INSTRUCTION:
You MUST keep the EXACT SAME PERSON from the input photo.
The face, facial features, skin tone, and identity must be IDENTICAL to the input image.
DO NOT create a different person. Preserve the person's appearance exactly.

CREATE A PROFESSIONAL ADVERTISING BANNER:

PERSON (from input photo):
- Keep EXACT face identity from input photo
- Position: ${positionText}
- Pose: ${decision.pose_suggestion}
- Expression: confident, professional, approachable
- The person must look NATURAL in the new environment
- You may adjust clothing to match professional context

BACKGROUND/SCENE:
${decision.scene_prompt}

TYPOGRAPHY (render as part of image):
- Main headline: "${decision.headline}" 
  Style: large, bold, modern sans-serif, white color with subtle shadow
${decision.subheadline ? `- Subheadline: "${decision.subheadline}"
  Style: smaller, elegant, below headline` : ''}
${decision.cta ? `- CTA button: "${decision.cta}"
  Style: rounded button, vibrant color, positioned at bottom` : ''}

VISUAL STYLE:
- Style: ${decision.style} (${decision.style === 'premium' ? 'luxurious, sophisticated' : decision.style === 'minimal' ? 'clean, simple' : 'balanced, professional'})
- Brand colors: ${sanitizedBrandProfile.colors.join(', ') || 'modern professional palette'}
- Add subtle decorative elements (geometric shapes or accent lines) using brand colors

QUALITY:
- Commercial advertising quality
- Professional studio lighting
- High resolution, crisp details
- No watermarks, no extra text

REMEMBER: The person's face MUST be identical to the input photo.`;

    console.log("[generate-creative-v2] Generating image with Gemini...");

    // Generate requested number of variations (max 3)
    const actualVariations = Math.min(Math.max(1, variationsCount), 3);
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
        
        // Continue to next variation if one fails
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
      headline: decision.headline,
      subheadline: decision.subheadline,
      cta: decision.cta,
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
