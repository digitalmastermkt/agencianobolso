import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ThemeKey = "promocao" | "lancamento" | "data_comemorativa" | "institucional" | "servico";
type CreativeTypeKey =
  | "trafego_pago"
  | "live_evento"
  | "data_comemorativa"
  | "lancamento"
  | "institucional"
  | "aviso_comunicado";

interface ArtDirectorDecision {
  template: "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda";
  headline: string;
  subheadline?: string;
  cta?: string;
  colors: string[];
  style: "clean" | "minimal" | "premium" | "dynamic" | "festive";
}

const THEME_GUIDELINES: Record<ThemeKey, string> = {
  promocao: "Tema PROMOÇÃO: paleta vibrante (vermelho, laranja, amarelo), estilo 'dynamic', atmosfera urgente e chamativa, composição com destaque para preço/oferta.",
  lancamento: "Tema LANÇAMENTO: paleta moderna e impactante (preto, dourado, cores neon), estilo 'premium' ou 'dynamic', atmosfera de exclusividade e novidade, composição centralizada com foco no produto/serviço.",
  data_comemorativa: "Tema DATA COMEMORATIVA: paleta festiva alinhada à data (cores temáticas), estilo 'festive', atmosfera celebrativa e calorosa, composição com elementos decorativos sutis.",
  institucional: "Tema INSTITUCIONAL: paleta sóbria e corporativa (azul, cinza, branco), estilo 'clean', atmosfera profissional e confiável, composição equilibrada e minimalista.",
  servico: "Tema SERVIÇO: paleta neutra com accent da marca, estilo 'minimal' ou 'clean', atmosfera clara e funcional, composição focada no benefício/transformação.",
};

const CREATIVE_TYPE_GUIDELINES: Record<CreativeTypeKey, string> = {
  trafego_pago: "TIPO TRÁFEGO PAGO: hierarquia headline forte + subheadline de apoio + CTA destacado e clicável. Foco total em conversão. CTA OBRIGATÓRIO.",
  live_evento: "TIPO LIVE/EVENTO: priorize DATA e HORÁRIO em tipografia grande (hierarquia: data/hora > tema > chamada). CTA deve ser 'Participe', 'Assista' ou similar (não venda). Atmosfera dinâmica e energética.",
  data_comemorativa: "TIPO DATA COMEMORATIVA: mensagem afetiva CENTRALIZADA, logo da marca em destaque sutil. NÃO INCLUIR CAMPO 'cta' no JSON. Atmosfera emocional e calorosa. Force template 'pessoa_centro' quando houver pessoa.",
  lancamento: "TIPO LANÇAMENTO: pouco texto, MUITO impacto visual. Pode usar suspense, contagem regressiva ou data de lançamento. CTA é opcional — se incluir, deve ser sutil ('Em breve', 'Saiba mais'). Estilo premium ou dramático.",
  institucional: "TIPO INSTITUCIONAL: equilíbrio visual e tom sóbrio. Destaque para propósito, conquista ou mensagem de marca. NÃO INCLUIR CAMPO 'cta' no JSON. Sem urgência.",
  aviso_comunicado: "TIPO AVISO/COMUNICADO: TEXTO GRANDE E LEGÍVEL é a prioridade absoluta. Layout clean, hierarquia simples, contraste máximo. NÃO INCLUIR CAMPO 'cta' no JSON. Force template 'pessoa_centro'.",
};

const TYPES_WITHOUT_CTA: CreativeTypeKey[] = ["data_comemorativa", "institucional", "aviso_comunicado"];
const TYPES_FORCE_CENTRO: CreativeTypeKey[] = ["data_comemorativa", "aviso_comunicado"];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authentication check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
  
  if (authError || !claimsData?.claims) {
    console.error('[ArtDirector] Auth error:', authError);
    return new Response(
      JSON.stringify({ error: 'Invalid or expired authentication token' }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = claimsData.claims.sub;
  console.log(`[ArtDirector] Authenticated user: ${userId}`);

  try {
    const { images, bannerText, ctaText, theme, creativeType } = await req.json();
    const themeKey = (theme && THEME_GUIDELINES[theme as ThemeKey]) ? (theme as ThemeKey) : null;
    const ctKey = (creativeType && CREATIVE_TYPE_GUIDELINES[creativeType as CreativeTypeKey])
      ? (creativeType as CreativeTypeKey)
      : null;
    const omitCta = ctKey ? TYPES_WITHOUT_CTA.includes(ctKey) : false;
    const forceCentro = ctKey ? TYPES_FORCE_CENTRO.includes(ctKey) : false;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Pelo menos uma imagem de referência é necessária' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (images.length > 5) {
      return new Response(
        JSON.stringify({ error: 'Máximo de 5 imagens permitidas' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log(`[ArtDirector] Analyzing ${images.length} images. creativeType=${ctKey ?? 'default'} theme=${themeKey ?? 'none'}`);

    const systemPrompt = `Você é um DIRETOR DE ARTE especializado em design de banners para Instagram.

REGRAS ABSOLUTAS:
1. Responda EXCLUSIVAMENTE com um JSON válido
2. NÃO escreva NADA fora do JSON
3. NÃO adicione comentários, explicações ou texto adicional
4. NÃO descreva pessoas, rostos, corpos ou aparências
5. NÃO invente marcas ou logotipos
6. NÃO use linguagem criativa desnecessária
7. Seja objetivo e previsível

Sua função é analisar prints de Instagram e retornar DECISÕES DE DESIGN em JSON.

ESTRUTURA OBRIGATÓRIA DO JSON:
{
  "template": "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda",
  "headline": "texto curto e impactante (máximo 8 palavras)",
  "subheadline": "texto de apoio opcional (máximo 12 palavras)",
${omitCta ? '  // NÃO INCLUA o campo "cta" — este tipo de criativo não usa CTA\n' : '  "cta": "chamada para ação curta opcional (máximo 4 palavras)",\n'}  "colors": ["#HEX1", "#HEX2", "#HEX3"],
  "style": "clean" | "minimal" | "premium" | "dynamic" | "festive"
}

CRITÉRIOS DE DECISÃO:
- template: baseado no equilíbrio visual e espaço para texto${forceCentro ? ' — OBRIGATORIAMENTE use "pessoa_centro" para este tipo de criativo' : ''}
- headline: extraído ou adaptado do texto fornecido pelo usuário
- colors: extraídas da identidade visual dos prints (paleta dominante), ajustadas ao tema quando informado
- style: inferido a partir da estética geral dos prints e do tema da arte

${ctKey ? `DIRETRIZES OBRIGATÓRIAS DE TIPO DE CRIATIVO:\n${CREATIVE_TYPE_GUIDELINES[ctKey]}\n` : ''}${themeKey ? `DIRETRIZES OBRIGATÓRIAS DE TEMA:\n${THEME_GUIDELINES[themeKey]}\n` : ''}RESPONDA APENAS O JSON. NADA MAIS.`;

    const userPrompt = `Analise estas imagens de referência do Instagram e retorne suas decisões de design.

${bannerText ? `Texto principal para o banner: "${bannerText}"` : ''}
${ctaText ? `CTA desejado: "${ctaText}"` : ''}

Retorne APENAS o JSON com suas decisões. Nenhum texto adicional.`;

    const content: any[] = [
      { type: "text", text: userPrompt }
    ];

    for (const image of images) {
      content.push({
        type: "image_url",
        image_url: { 
          url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
          detail: "low"
        }
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${openAIApiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ArtDirector] OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em alguns segundos.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    console.log('[ArtDirector] Raw response:', responseContent);

    let decision: ArtDirectorDecision;
    try {
      // Clean JSON from markdown code blocks if present
      let cleanContent = responseContent.trim()
        .replace(/^```json\n?/, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
      
      decision = JSON.parse(cleanContent);
      
      // Validate required fields
      if (!decision.template || !decision.headline || !decision.colors || !decision.style) {
        throw new Error('Missing required fields in decision');
      }
      
      // Validate template value
      if (!['pessoa_direita', 'pessoa_centro', 'pessoa_esquerda'].includes(decision.template)) {
        decision.template = 'pessoa_centro';
      }
      
      // Validate style value
      if (!['clean', 'minimal', 'premium', 'dynamic', 'festive'].includes(decision.style)) {
        decision.style = 'clean';
      }
      
      // Ensure colors is an array with max 3 items
      if (!Array.isArray(decision.colors)) {
        decision.colors = ['#333333', '#666666', '#999999'];
      } else {
        decision.colors = decision.colors.slice(0, 3);
      }
      
    } catch (parseError) {
      console.error('[ArtDirector] Failed to parse decision JSON:', parseError);
      
      // Return a default decision if parsing fails
      decision = {
        template: 'pessoa_centro',
        headline: bannerText?.slice(0, 50) || 'Seu texto aqui',
        subheadline: undefined,
        cta: ctaText || undefined,
        colors: ['#3498DB', '#2ECC71', '#333333'],
        style: 'clean'
      };
    }

    console.log('[ArtDirector] Final decision:', JSON.stringify(decision));

    return new Response(
      JSON.stringify({ 
        success: true, 
        decision,
        imagesAnalyzed: images.length 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ArtDirector] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
