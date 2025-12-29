import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Uma imagem é necessária' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing person photo...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
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
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione mais créditos na sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    console.log('Raw AI response:', content);

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
      console.error('Failed to parse AI response as JSON:', parseError);
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

  } catch (error) {
    console.error('Error in analyze-person-photo:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao analisar foto da pessoa' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
