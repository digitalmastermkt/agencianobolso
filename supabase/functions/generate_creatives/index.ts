import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArtDirectorDecision {
  template: "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda";
  headline: string;
  subheadline?: string;
  cta?: string;
  colors: string[];
  style: "clean" | "minimal" | "premium";
}

const artDirectorSystemPrompt = `Você é um Diretor de Arte sênior especializado em criativos publicitários

de alto impacto para redes sociais (Instagram, Stories, Ads).

Sua função é INTERPRETAR a intenção do texto e tomar decisões visuais completas,

como um designer humano experiente faria.

ANTES de responder, analise cuidadosamente:

1. O CONTEXTO da mensagem (festa, oferta, aviso, institucional, anúncio)

2. O OBJETIVO do criativo (atenção, venda, informar, celebrar)

3. O PERFIL da marca (luxo, acessível, moderno, clean, premium)

4. A presença de uma pessoa e a necessidade de preservar identidade facial

REGRAS:

- FESTA / CELEBRAÇÃO → visual premium, luz quente, dourado, elementos festivos sutis

- OFERTA / PROMOÇÃO → hierarquia clara, foco em conversão, CTA forte

- AVISO / COMUNICADO → visual clean, leitura fácil

- INSTITUCIONAL → composição equilibrada, branding discreto

ESCOLHA DE TEMPLATE:

- pessoa_centro → institucional, emocional, autoridade

- pessoa_direita / pessoa_esquerda → ofertas, anúncios, banners

RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO NO FORMATO:

{

  "template": "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda",

  "headline": "texto curto e impactante",

  "subheadline": "texto de apoio opcional",

  "cta": "chamada curta se fizer sentido",

  "colors": ["#HEX1", "#HEX2", "#HEX3"],

  "style": "clean" | "minimal" | "premium"

}

Não inclua texto fora do JSON.`;

const getImageSize = (format: string) => {
  const normalized = format.toLowerCase();
  if (normalized.includes("story") || normalized.includes("vertical")) return "1024x1792";
  if (normalized.includes("banner") || normalized.includes("horizontal") || normalized.includes("landscape")) return "1792x1024";
  return "1024x1024";
};

const normalizeDecision = (raw: ArtDirectorDecision, fallbackHeadline: string): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    template: raw?.template ?? "pessoa_centro",
    headline: raw?.headline ?? fallbackHeadline,
    subheadline: raw?.subheadline,
    cta: raw?.cta,
    colors: Array.isArray(raw?.colors) ? raw.colors.slice(0, 3) : ["#111827", "#F9FAFB", "#6B7280"],
    style: raw?.style ?? "clean",
  };

  if (!(["pessoa_direita", "pessoa_centro", "pessoa_esquerda"] as const).includes(decision.template)) {
    decision.template = "pessoa_centro";
  }
  if (!(["clean", "minimal", "premium"] as const).includes(decision.style)) {
    decision.style = "clean";
  }
  if (!decision.colors.length) decision.colors = ["#111827", "#F9FAFB", "#6B7280"];

  return decision;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) throw new Error("OPENAI_API_KEY is not configured");

    const { description, brandProfile, personImageUrl, format } = await req.json();

    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "O campo description é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!format || typeof format !== "string") {
      return new Response(JSON.stringify({ error: "O campo format é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (brandProfile === null || typeof brandProfile !== "object") {
      return new Response(JSON.stringify({ error: "O campo brandProfile é obrigatório e deve ser JSON." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      // Explicitly exclude: instagram_images, logo_url, person_photos (all can contain large base64)
    };

    const userPrompt = `Briefing: ${description.slice(0, 1000)}
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Formato: ${format}
${personImageUrl ? "Há uma foto de pessoa de referência disponível (considere isso na escolha do template)." : "Não há foto de pessoa."}`;

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
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!artDirectorResponse.ok) {
      const t = await artDirectorResponse.text();
      return new Response(JSON.stringify({ error: `Falha ao consultar Diretor de Arte: ${t}` }), {
        status: artDirectorResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const artDirectorData = await artDirectorResponse.json();
    const raw = artDirectorData.choices?.[0]?.message?.content?.trim() as string | undefined;
    if (!raw) {
      return new Response(JSON.stringify({ error: "Diretor de Arte não retornou dados válidos." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: ArtDirectorDecision;
    try {
      const cleanContent = raw
        .replace(/^```json\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      return new Response(JSON.stringify({ error: "Falha ao interpretar o JSON do Diretor de Arte." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const artDirectorJson = normalizeDecision(parsed, description.slice(0, 60));

    // Se você quiser só as decisões (sem geração de imagem), basta ignorar a chamada abaixo.
    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Crie um criativo publicitário sem texto legível. Use estas decisões (JSON): ${JSON.stringify(artDirectorJson)}. Briefing: ${description}. Formato: ${format}. Não incluir logotipos nem marcas d'água.`,
        n: 1,
        size: getImageSize(format),
        quality: "hd",
      }),
    });

    if (!imageResponse.ok) {
      const t = await imageResponse.text();
      return new Response(JSON.stringify({ error: `Falha ao gerar imagem: ${t}`, artDirectorJson }), {
        status: imageResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data?.[0]?.url as string | undefined;

    return new Response(
      JSON.stringify({
        artDirectorJson,
        imageUrl: imageUrl ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[generate_creatives] Error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
