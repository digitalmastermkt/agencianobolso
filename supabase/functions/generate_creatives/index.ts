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
}

const artDirectorSystemPrompt = `Você é um Diretor de Arte sênior especializado em criativos publicitários
para Instagram, Stories e anúncios.

Seu papel é DECIDIR como a imagem final deve ser gerada por IA,
como se estivesse dirigindo um ensaio fotográfico profissional.

Você NÃO cria layout.
Você NÃO escreve explicações.
Você SOMENTE define a DIREÇÃO VISUAL da imagem.

ANTES de responder, analise:
1. Contexto da mensagem (festa, oferta, aviso, institucional)
2. Objetivo (celebrar, vender, informar)
3. Perfil da marca
4. Se existe uma pessoa que precisa manter identidade facial

RESPONDA APENAS com JSON válido neste formato:
{
  "scene_prompt": "descrição detalhada do cenário, iluminação, estilo fotográfico, clima emocional, composição e estética",
  "style": "clean" | "minimal" | "premium",
  "template": "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda",
  "headline": "texto curto",
  "subheadline": "texto opcional",
  "cta": "texto opcional"
}

REGRAS:
- Se for FESTA ou CELEBRAÇÃO → ambiente elegante, luz quente, elementos festivos sutis
- Se for OFERTA → visual de conversão, fundo limpo, alto contraste
- Se for AVISO → visual clean e leitura fácil
- Preserve SEMPRE a identidade facial da pessoa, se houver imagem de referência

Não inclua texto fora do JSON.`;

// Formatos fixos com dimensões exatas (matching frontend)
const BANNER_FORMATS: Record<string, { width: number; height: number }> = {
  stories: { width: 1080, height: 1920 },
  retrato: { width: 1080, height: 1350 },
  quadrado: { width: 1080, height: 1080 },
};

// Map format to OpenAI supported sizes (closest match)
const getImageSize = (format: string): "1024x1024" | "1536x1024" | "1024x1536" => {
  const normalized = format.toLowerCase();
  // Stories (9:16) -> 1024x1536 (vertical)
  if (normalized === "stories") return "1024x1536";
  // Retrato (4:5) -> 1024x1536 (closest vertical)
  if (normalized === "retrato") return "1024x1536";
  // Quadrado (1:1) -> 1024x1024
  if (normalized === "quadrado") return "1024x1024";
  // Fallback
  return "1024x1024";
};

const normalizeDecision = (raw: Partial<ArtDirectorDecision>, fallbackHeadline: string): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Cenário profissional, iluminação suave, fundo neutro elegante",
    style: raw?.style ?? "clean",
    template: raw?.template ?? "pessoa_centro",
    headline: raw?.headline ?? fallbackHeadline,
    subheadline: raw?.subheadline,
    cta: raw?.cta,
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

  // Helper to always return 200 with structured JSON
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

    const { description, brandProfile, personImageUrl, format, preserve_identity = false } = await req.json();

    if (!description || typeof description !== "string") {
      return respond({ success: false, error: "O campo description é obrigatório." });
    }

    if (!format || typeof format !== "string") {
      return respond({ success: false, error: "O campo format é obrigatório." });
    }

    if (brandProfile === null || typeof brandProfile !== "object") {
      return respond({ success: false, error: "O campo brandProfile é obrigatório e deve ser JSON." });
    }

    // Sanitize brandProfile - remove large data like base64 images to prevent token overflow
    const sanitizedBrandProfile = {
      name: brandProfile.name || "",
      colors: Array.isArray(brandProfile.colors) ? brandProfile.colors.slice(0, 5) : [],
      mood: brandProfile.mood || "",
      visual_style: brandProfile.visual_style || "",
      overall_description: typeof brandProfile.overall_description === "string" 
        ? brandProfile.overall_description.slice(0, 500) 
        : "",
      recurring_elements: Array.isArray(brandProfile.recurring_elements) 
        ? brandProfile.recurring_elements.slice(0, 5) 
        : [],
    };

    console.log("[generate_creatives] preserve_identity:", preserve_identity);

    const userPrompt = `Briefing: ${description.slice(0, 1000)}
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Formato: ${format}
${preserve_identity 
  ? "ATENÇÃO: O usuário irá sobrepor a pessoa original na imagem. Gere APENAS o cenário/fundo, SEM pessoas." 
  : (personImageUrl ? "Há uma foto de pessoa de referência disponível (preserve a identidade facial na direção visual)." : "Não há foto de pessoa.")}`;

    console.log("[generate_creatives] Calling Art Director...");

    // Step 1: Get Art Director decision
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
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!artDirectorResponse.ok) {
      const t = await artDirectorResponse.text();
      console.error("[generate_creatives] Art Director error:", t);
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
      console.error("[generate_creatives] JSON parse error:", parseError, "Raw:", raw);
      return respond({ success: false, error: "Falha ao interpretar o JSON do Diretor de Arte.", rawResponse: raw });
    }

    const decision = normalizeDecision(parsed, description.slice(0, 60));
    console.log("[generate_creatives] Art Director decision:", decision);

    // Step 2: Generate image using gpt-image-1 with scene_prompt
    let imagePrompt: string;
    
    if (preserve_identity) {
      // Generate ONLY background/scene without people
      imagePrompt = `${decision.scene_prompt}

Background scene only. No people, no faces, no humans, no figures.
Empty professional environment ready for compositing.
Fotografia realista, alta qualidade, estética profissional,
iluminação cinematográfica, profundidade de campo,
estilo ${decision.style}.
Não incluir texto, logotipos ou marcas d'água na imagem.
IMPORTANTE: Gere apenas o cenário vazio, sem nenhuma pessoa.`;
    } else {
      // Generate complete image with person + scene
      imagePrompt = `${decision.scene_prompt}

Fotografia realista, alta qualidade, estética profissional,
sem distorções faciais, mantendo identidade da pessoa,
iluminação cinematográfica, profundidade de campo,
estilo ${decision.style}.
Não incluir texto, logotipos ou marcas d'água na imagem.`;
    }

    console.log("[generate_creatives] Generating image with gpt-image-1...");

    // Build the request for image generation
    const imageRequestBody: Record<string, unknown> = {
      model: "gpt-image-1",
      prompt: imagePrompt,
      n: 1,
      size: getImageSize(format),
      quality: "high",
    };

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imageRequestBody),
    });

    if (!imageResponse.ok) {
      const t = await imageResponse.text();
      console.error("[generate_creatives] Image generation error:", t);
      // Return decision even if image fails
      return respond({ 
        success: true, 
        imageUrl: null,
        headline: decision.headline,
        subheadline: decision.subheadline,
        cta: decision.cta,
        template: decision.template,
        style: decision.style,
        scene_prompt: decision.scene_prompt,
        imageError: `Falha ao gerar imagem: ${t}`,
      });
    }

    const imageData = await imageResponse.json();
    
    // gpt-image-1 returns base64 data
    let imageUrl: string | null = null;
    if (imageData.data?.[0]?.b64_json) {
      imageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
    } else if (imageData.data?.[0]?.url) {
      imageUrl = imageData.data[0].url;
    }

    console.log("[generate_creatives] Image generated successfully");

    // Return different field name based on preserve_identity mode
    const responseData: Record<string, unknown> = {
      success: true,
      headline: decision.headline,
      subheadline: decision.subheadline,
      cta: decision.cta,
      template: decision.template,
      style: decision.style,
      scene_prompt: decision.scene_prompt,
    };

    if (preserve_identity) {
      responseData.backgroundImageUrl = imageUrl;
    } else {
      responseData.imageUrl = imageUrl;
    }

    return respond(responseData);

  } catch (error: unknown) {
    console.error("[generate_creatives] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
