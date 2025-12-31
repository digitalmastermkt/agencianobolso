import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, bannerText, ctaText } = await req.json();
    
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

    console.log(`[ArtDirector] Analyzing ${images.length} images for design decisions...`);

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
  "cta": "chamada para ação curta opcional (máximo 4 palavras)",
  "colors": ["#HEX1", "#HEX2", "#HEX3"],
  "style": "clean" | "minimal" | "premium"
}

CRITÉRIOS DE DECISÃO:
- template: baseado no equilíbrio visual e espaço para texto
- headline: extraído ou adaptado do texto fornecido pelo usuário
- colors: extraídas da identidade visual dos prints (paleta dominante)
- style: inferido a partir da estética geral dos prints

RESPONDA APENAS O JSON. NADA MAIS.`;

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
      if (!['clean', 'minimal', 'premium'].includes(decision.style)) {
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

  } catch (error) {
    console.error('[ArtDirector] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
