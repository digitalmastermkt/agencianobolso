import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

const artDirectorSystemPrompt = `Você é um Diretor de Arte sênior especializado em criativos publicitários
para Instagram, Stories e anúncios. Você está dirigindo uma sessão de geração de imagens com IA.

Seu papel é definir a DIREÇÃO VISUAL COMPLETA onde a pessoa da foto será RECRIADA em um novo cenário,
mantendo sua identidade facial mas em uma pose e contexto profissional.

RESPONDA APENAS com JSON válido neste formato:
{
  "scene_prompt": "descrição detalhada do cenário onde a pessoa será colocada, iluminação, ambiente, elementos decorativos",
  "style": "clean" | "minimal" | "premium",
  "template": "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda",
  "headline": "texto principal curto e impactante",
  "subheadline": "texto secundário opcional",
  "cta": "texto do botão opcional",
  "pose_suggestion": "descrição da pose e expressão ideal para o contexto"
}

REGRAS:
- O cenário deve ser PROFISSIONAL e adequado para publicidade
- Para FESTA/CELEBRAÇÃO → ambiente elegante, luz quente, elementos festivos sutis
- Para OFERTA/VENDA → visual de conversão, fundo limpo, alto contraste
- Para INSTITUCIONAL → escritório moderno, tecnologia, profissionalismo
- Sempre sugira uma POSE natural e profissional

Não inclua texto fora do JSON.`;

// Map format to OpenAI supported sizes
const getImageSize = (format: string): "1024x1024" | "1536x1024" | "1024x1536" => {
  const normalized = format.toLowerCase();
  if (normalized === "stories") return "1024x1536";
  if (normalized === "retrato") return "1024x1536";
  if (normalized === "quadrado") return "1024x1024";
  return "1024x1024";
};

const normalizeDecision = (raw: Partial<ArtDirectorDecision>, fallbackHeadline: string): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Cenário profissional moderno, iluminação suave cinematográfica, ambiente corporativo elegante",
    style: raw?.style ?? "clean",
    template: raw?.template ?? "pessoa_centro",
    headline: raw?.headline ?? fallbackHeadline,
    subheadline: raw?.subheadline,
    cta: raw?.cta,
    pose_suggestion: raw?.pose_suggestion ?? "postura confiante e profissional, sorriso natural, olhando para câmera",
  };

  if (!(["pessoa_direita", "pessoa_centro", "pessoa_esquerda"] as const).includes(decision.template)) {
    decision.template = "pessoa_centro";
  }
  if (!(["clean", "minimal", "premium"] as const).includes(decision.style)) {
    decision.style = "clean";
  }

  return decision;
};

// Convert base64/data URL to Blob for API
const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (data: Record<string, unknown>) => {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return respond({ success: false, error: "OPENAI_API_KEY is not configured" });
    }

    const { description, brandProfile, personImageBase64, format, variationsCount = 1 } = await req.json();

    if (!description || typeof description !== "string") {
      return respond({ success: false, error: "O campo description é obrigatório." });
    }

    if (!format || typeof format !== "string") {
      return respond({ success: false, error: "O campo format é obrigatório." });
    }

    if (!personImageBase64 || typeof personImageBase64 !== "string") {
      return respond({ success: false, error: "A foto da pessoa é obrigatória para este modo." });
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

    console.log("[generate-creative-v2] Starting AI-powered creative generation...");

    // Step 1: Get Art Director decision
    const userPrompt = `Briefing: ${description.slice(0, 1000)}
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Formato: ${format}
IMPORTANTE: A pessoa da foto de referência será RECRIADA no cenário. Defina um cenário profissional onde ela será integrada naturalmente.`;

    console.log("[generate-creative-v2] Calling Art Director...");

    const artDirectorResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: artDirectorSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.4,
      }),
    });

    if (!artDirectorResponse.ok) {
      const t = await artDirectorResponse.text();
      console.error("[generate-creative-v2] Art Director error:", t);
      return respond({ success: false, error: `Falha ao consultar Diretor de Arte: ${t}` });
    }

    const artDirectorData = await artDirectorResponse.json();
    const raw = artDirectorData.choices?.[0]?.message?.content?.trim() as string | undefined;
    
    if (!raw) {
      return respond({ success: false, error: "Diretor de Arte não retornou dados válidos." });
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
      return respond({ success: false, error: "Falha ao interpretar o JSON do Diretor de Arte." });
    }

    const decision = normalizeDecision(parsed, description.slice(0, 60));
    console.log("[generate-creative-v2] Art Director decision:", decision);

    // Step 2: Generate image using gpt-image-1 with image editing API
    // This API preserves facial identity from the input image
    
    const positionText = decision.template === "pessoa_direita" 
      ? "positioned on the right side of the frame"
      : decision.template === "pessoa_esquerda"
        ? "positioned on the left side of the frame"
        : "centered in the frame";

    // Build detailed prompt for image editing with identity preservation
    const imageEditPrompt = `Create a professional advertising banner image.

CRITICAL INSTRUCTIONS - IDENTITY PRESERVATION:
- Preserve the EXACT face identity from the input image
- Keep all facial features, skin tone, and characteristics identical
- The person should look EXACTLY like in the reference photo

SCENE AND COMPOSITION:
${decision.scene_prompt}

PERSON PLACEMENT:
- Person ${positionText}
- Pose: ${decision.pose_suggestion}
- The person should naturally integrate with the professional scene
- You may adjust clothing to match the professional context
- Full body or 3/4 shot, professional framing

TYPOGRAPHY (render as part of the image):
- Headline: "${decision.headline}" - bold modern sans-serif font, white text with subtle drop shadow, placed prominently
${decision.subheadline ? `- Subheadline: "${decision.subheadline}" - smaller elegant font below headline` : ''}
${decision.cta ? `- CTA Button: "${decision.cta}" - rounded button with brand color background` : ''}

BRAND STYLING:
- Primary colors: ${sanitizedBrandProfile.colors.join(', ') || 'modern professional palette'}
- Style: ${decision.style} - ${decision.style === 'premium' ? 'luxurious and sophisticated' : decision.style === 'minimal' ? 'clean and simple' : 'balanced and professional'}
- Add subtle decorative elements using brand colors (geometric shapes, gradients, or accent lines)

TECHNICAL REQUIREMENTS:
- Commercial photography quality
- Cinematic lighting with professional shadows
- 8K resolution appearance
- No watermarks, no extra text, no logos except as specified
- The final image should look like a high-end advertising creative`;

    console.log("[generate-creative-v2] Generating image with gpt-image-1 edit API...");

    // Use FormData for image editing API
    const formData = new FormData();
    
    // Convert base64 to blob
    const imageBlob = await dataUrlToBlob(personImageBase64);
    formData.append('image', imageBlob, 'person.png');
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', imageEditPrompt);
    formData.append('size', getImageSize(format));
    formData.append('quality', 'high');
    
    // Limit variations to max 3
    const actualVariations = Math.min(Math.max(1, variationsCount), 3);
    formData.append('n', String(actualVariations));

    const imageResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("[generate-creative-v2] Image edit API error:", errorText);
      
      // Fallback: try generation API without reference image
      console.log("[generate-creative-v2] Falling back to generation API...");
      
      const fallbackResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: imageEditPrompt,
          n: actualVariations,
          size: getImageSize(format),
          quality: "high",
        }),
      });

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        console.error("[generate-creative-v2] Fallback also failed:", fallbackError);
        return respond({ 
          success: true, 
          images: [],
          headline: decision.headline,
          subheadline: decision.subheadline,
          cta: decision.cta,
          template: decision.template,
          style: decision.style,
          scene_prompt: decision.scene_prompt,
          imageError: `Falha ao gerar imagem. Tente novamente.`,
        });
      }

      const fallbackData = await fallbackResponse.json();
      const images = (fallbackData.data || []).map((item: { b64_json?: string; url?: string }) => {
        if (item.b64_json) {
          return `data:image/png;base64,${item.b64_json}`;
        }
        return item.url || null;
      }).filter(Boolean);

      console.log("[generate-creative-v2] Generated", images.length, "images via fallback");

      return respond({
        success: true,
        images,
        headline: decision.headline,
        subheadline: decision.subheadline,
        cta: decision.cta,
        template: decision.template,
        style: decision.style,
        scene_prompt: decision.scene_prompt,
        pose_suggestion: decision.pose_suggestion,
        usedFallback: true,
      });
    }

    const imageData = await imageResponse.json();
    
    // Extract all generated images
    const images = (imageData.data || []).map((item: { b64_json?: string; url?: string }) => {
      if (item.b64_json) {
        return `data:image/png;base64,${item.b64_json}`;
      }
      return item.url || null;
    }).filter(Boolean);

    console.log("[generate-creative-v2] Generated", images.length, "images with identity preservation");

    return respond({
      success: true,
      images,
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
    return respond({ success: false, error: message });
  }
});
