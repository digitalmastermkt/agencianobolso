import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtDirectorDecision {
  template: "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda";
  headline: string;
  subheadline?: string;
  cta?: string;
  colors: string[];
  style: "clean" | "minimal" | "premium";
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const STORAGE_BUCKET = 'generated-creatives';

const getImageSize = (format: string) => {
  const normalized = format.toLowerCase();
  if (normalized.includes('story') || normalized.includes('vertical')) return '1024x1792';
  if (normalized.includes('banner') || normalized.includes('horizontal') || normalized.includes('landscape')) return '1792x1024';
  return '1024x1024';
};

const ensureEnv = () => {
  if (!openAIApiKey) throw new Error('OPENAI_API_KEY not configured');
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured');
};

const buildCreativePrompt = (
  decision: ArtDirectorDecision,
  description: string,
  brandProfile: Record<string, unknown>,
  format: string,
  personImageUrl?: string | null,
) => {
  const palette = decision.colors?.length ? decision.colors.join(', ') : 'neutras sofisticadas';
  const brandNotes = typeof brandProfile === 'object' ? JSON.stringify(brandProfile) : String(brandProfile);
  const identityNote = personImageUrl
    ? 'Preserve a identidade facial e traços da pessoa da referência fornecida.'
    : 'Sem pessoa identificável no centro da composição.';

  return [
    'Banner publicitário premium, clean e moderno.',
    `Formato: ${format}.`,
    `Briefing: ${description}.`,
    `Paleta de cores: ${palette}.`,
    `Estilo: ${decision.style}.`,
    `Composição: ${decision.template.replace('_', ' ')} com área segura para texto.`,
    'Cenário: ambiente coerente com a marca e com o briefing. Fundo sofisticado, sem textos legíveis.',
    'Iluminação: suave, realista, com destaque para o assunto principal.',
    'Clima: profissional, confiável, premium.',
    `Diretrizes de marca: ${brandNotes}.`,
    identityNote,
    'Não incluir textos, logotipos ou marcas d’água.',
    'Imagem base para posterior aplicação de texto.',
  ].join(' ');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    ensureEnv();
    const { description, brandProfile, personImageUrl, format } = await req.json();

    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'O campo description é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!format || typeof format !== 'string') {
      return new Response(
        JSON.stringify({ error: 'O campo format é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!brandProfile || typeof brandProfile !== 'object') {
      return new Response(
        JSON.stringify({ error: 'O campo brandProfile é obrigatório e deve ser JSON.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artDirectorSystemPrompt = `
Você é um Diretor de Arte sênior especializado em criativos publicitários de alto impacto
para redes sociais (Instagram, Stories, Ads).

Sua função é INTERPRETAR a intenção do texto e tomar decisões visuais completas,
como um designer humano experiente faria.

ANTES de responder, analise cuidadosamente:
1. O CONTEXTO da mensagem (ex: festa, oferta, aviso, institucional, anúncio)
2. O OBJETIVO do criativo (atenção, venda, informar, celebrar)
3. O PERFIL da marca (luxo, acessível, moderno, clean, premium)
4. A presença de uma pessoa e a necessidade de preservar identidade facial

REGRAS OBRIGATÓRIAS:
- Se o texto indicar FESTA ou CELEBRAÇÃO:
  • Visual premium
  • Tons dourados, luz quente, elementos festivos sutis (confete, brilho, fogos desfocados)
  • Tipografia elegante
- Se indicar OFERTA ou PROMOÇÃO:
  • Visual de conversão
  • Hierarquia clara: headline > valor > CTA
  • Fundo limpo com contraste
- Se indicar AVISO ou COMUNICADO:
  • Visual clean
  • Leitura fácil
  • Poucos elementos
- Se indicar INSTITUCIONAL:
  • Visual sofisticado
  • Composição equilibrada
  • Branding discreto

ESCOLHA O TEMPLATE:
- pessoa_centro → mensagens institucionais ou emocionais
- pessoa_direita / pessoa_esquerda → ofertas, anúncios, banners

ESCOLHA CORES coerentes com o perfil da marca e contexto emocional.

RESPONDA EXCLUSIVAMENTE com JSON válido no formato abaixo
(sem explicações, sem markdown, sem texto fora do JSON):

{
  "template": "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda",
  "headline": "texto curto e impactante",
  "subheadline": "texto de apoio se necessário",
  "cta": "chamada curta se fizer sentido",
  "colors": ["#HEX1", "#HEX2", "#HEX3"],
  "style": "clean" | "minimal" | "premium"
}
`;

    const artDirectorUserPrompt = `Briefing: ${description}
Perfil da marca (JSON): ${JSON.stringify(brandProfile)}
Formato: ${format}
${personImageUrl ? `Há uma pessoa de referência para preservar identidade facial: ${personImageUrl}` : ''}`;

    const artDirectorResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: artDirectorSystemPrompt },
          { role: 'user', content: artDirectorUserPrompt },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!artDirectorResponse.ok) {
      const errorText = await artDirectorResponse.text();
      return new Response(
        JSON.stringify({ error: `Falha ao consultar Diretor de Arte: ${errorText}` }),
        { status: artDirectorResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artDirectorData = await artDirectorResponse.json();
    const artDirectorRaw = artDirectorData.choices?.[0]?.message?.content?.trim();

    if (!artDirectorRaw) {
      return new Response(
        JSON.stringify({ error: 'Diretor de Arte não retornou dados válidos.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let artDirectorJson: ArtDirectorDecision;
    try {
      const cleanContent = artDirectorRaw
        .replace(/^```json\n?/, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
      artDirectorJson = JSON.parse(cleanContent);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Falha ao interpretar o JSON do Diretor de Arte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptUsed = buildCreativePrompt(
      artDirectorJson,
      description,
      brandProfile as Record<string, unknown>,
      format,
      personImageUrl
    );

    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: promptUsed,
        n: 1,
        size: getImageSize(format),
        quality: 'hd',
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      return new Response(
        JSON.stringify({ error: `Falha ao gerar imagem: ${errorText}` }),
        { status: imageResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível obter a imagem gerada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageFetch = await fetch(imageUrl);
    if (!imageFetch.ok) {
      return new Response(
        JSON.stringify({ error: 'Falha ao baixar a imagem gerada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBuffer = await imageFetch.arrayBuffer();
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const filePath = `creatives/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar a imagem no storage.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrlData.publicUrl,
        artDirectorJson,
        promptUsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate_creatives] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro inesperado ao gerar creative.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
