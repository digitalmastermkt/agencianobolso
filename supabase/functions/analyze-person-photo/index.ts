import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonAnalysis {
  description: string;
  pose: string;
  suggestedContext: string;
  colorHarmony: {
    skinTone: string;
    hairColor: string;
    clothingColors: string[];
  };
  style: string;
  expression: string;
}

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
    console.error('[ANALYZE-PERSON-PHOTO] Auth error:', authError);
    return new Response(
      JSON.stringify({ error: 'Invalid or expired authentication token' }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = claimsData.claims.sub;
  console.log(`[ANALYZE-PERSON-PHOTO] Authenticated user: ${userId}`);

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Uma imagem é necessária' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Analyzing person photo with OpenAI Vision...');

    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Você é um especialista em fotografia e design. Analise esta foto de uma pessoa e extraia informações úteis para criar arte/banners profissionais.

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem explicações, apenas o JSON puro.

Extraia:
1. **Descrição da pessoa**: Aparência geral, gênero aparente, faixa etária aproximada
2. **Pose**: Tipo de pose (profissional, casual, dinâmica, contemplativa, etc.)
3. **Contexto sugerido**: Cenários/fundos que combinariam bem com esta pessoa
4. **Harmonia de cores**: Tom de pele, cor de cabelo, cores predominantes da roupa
5. **Estilo**: Classificação do estilo (formal, casual, esportivo, elegante, etc.)
6. **Expressão**: Descrição da expressão facial e energia transmitida

Formato de resposta JSON EXATO:
{
  "description": "Descrição geral da pessoa",
  "pose": "tipo de pose",
  "suggestedContext": "cenários sugeridos para combinar",
  "colorHarmony": {
    "skinTone": "tom de pele",
    "hairColor": "cor do cabelo",
    "clothingColors": ["cor1", "cor2"]
  },
  "style": "estilo geral",
  "expression": "descrição da expressão"
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    console.log('Raw OpenAI response:', content);

    // Parse the JSON response
    let personAnalysis: PersonAnalysis;
    try {
      // Clean up the response
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      personAnalysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Return a default structure if parsing fails
      personAnalysis = {
        description: 'Pessoa analisada da foto fornecida',
        pose: 'natural',
        suggestedContext: 'Fundo neutro ou ambiente profissional',
        colorHarmony: {
          skinTone: 'médio',
          hairColor: 'escuro',
          clothingColors: ['neutro']
        },
        style: 'casual',
        expression: 'amigável'
      };
    }

    console.log('Parsed person analysis:', personAnalysis);

    return new Response(
      JSON.stringify({ 
        success: true,
        person: personAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-person-photo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao analisar foto da pessoa';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
