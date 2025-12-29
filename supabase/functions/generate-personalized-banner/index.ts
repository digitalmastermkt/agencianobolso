import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisualIdentity {
  colors: string[];
  typography: {
    style: string;
    weight: string;
    description: string;
  };
  visualStyle: string;
  mood: string;
  recurringElements: string[];
  overallDescription: string;
}

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

interface BannerRequest {
  identity: VisualIdentity;
  person: PersonAnalysis;
  bannerText: string;
  cta: string;
  formato: string;
  additionalInfo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identity, person, bannerText, cta, formato, additionalInfo }: BannerRequest = await req.json();
    
    if (!identity || !person) {
      return new Response(
        JSON.stringify({ error: 'Identidade visual e dados da pessoa são necessários' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating personalized banner with identity and person data...');

    // Step 1: Generate optimized prompts using Gemini 2.5 Flash
    const promptGenerationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Você é um especialista em criação de prompts para geração de imagens profissionais.

Com base nas seguintes informações, crie 3 prompts otimizados para gerar banners/artes profissionais:

## IDENTIDADE VISUAL DO INSTAGRAM:
- Cores: ${identity.colors.join(', ')}
- Tipografia: ${identity.typography.style}, ${identity.typography.weight} - ${identity.typography.description}
- Estilo Visual: ${identity.visualStyle}
- Mood: ${identity.mood}
- Elementos recorrentes: ${identity.recurringElements.join(', ')}
- Descrição geral: ${identity.overallDescription}

## PESSOA (para incluir no design):
- Descrição: ${person.description}
- Pose: ${person.pose}
- Contexto sugerido: ${person.suggestedContext}
- Estilo: ${person.style}
- Expressão: ${person.expression}
- Tom de pele: ${person.colorHarmony.skinTone}
- Cores da roupa: ${person.colorHarmony.clothingColors.join(', ')}

## INFORMAÇÕES DO BANNER:
- Texto principal: ${bannerText || 'Texto promocional'}
- Call-to-action: ${cta || 'Saiba mais'}
- Formato: ${formato || 'quadrado'}
- Informações adicionais: ${additionalInfo || 'N/A'}

IMPORTANTE: Retorne APENAS um JSON válido com 3 prompts diferentes, cada um com um estilo diferente (mas todos respeitando a identidade visual).

Formato JSON EXATO:
{
  "prompts": [
    {
      "style": "Elegante e Sofisticado",
      "prompt": "prompt detalhado aqui..."
    },
    {
      "style": "Moderno e Dinâmico",
      "prompt": "prompt detalhado aqui..."
    },
    {
      "style": "Clean e Minimalista",
      "prompt": "prompt detalhado aqui..."
    }
  ]
}

Cada prompt deve:
1. Descrever um banner profissional com a pessoa integrada naturalmente
2. Usar as cores da paleta da identidade visual
3. Respeitar o mood e estilo identificados
4. Incluir espaço para texto e CTA
5. Ser específico sobre composição, iluminação e atmosfera
6. Ter no máximo 150 palavras cada`
          }
        ],
        max_tokens: 2500,
      }),
    });

    if (!promptGenerationResponse.ok) {
      const errorText = await promptGenerationResponse.text();
      console.error('Prompt generation error:', promptGenerationResponse.status, errorText);
      
      if (promptGenerationResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (promptGenerationResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione mais créditos na sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${promptGenerationResponse.status}`);
    }

    const promptData = await promptGenerationResponse.json();
    const promptContent = promptData.choices?.[0]?.message?.content;

    if (!promptContent) {
      throw new Error('No prompts generated');
    }

    console.log('Generated prompts:', promptContent);

    // Parse the prompts
    let generatedPrompts: { style: string; prompt: string }[];
    try {
      let cleanContent = promptContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      const parsed = JSON.parse(cleanContent);
      generatedPrompts = parsed.prompts;
    } catch (parseError) {
      console.error('Failed to parse prompts:', parseError);
      // Fallback prompts
      generatedPrompts = [
        {
          style: "Elegante e Sofisticado",
          prompt: `Professional banner design featuring a ${person.description} in ${person.pose} pose. Color palette: ${identity.colors.slice(0, 3).join(', ')}. ${identity.visualStyle} style with ${identity.mood} atmosphere. Clean layout with space for text "${bannerText}". High-end professional photography look.`
        },
        {
          style: "Moderno e Dinâmico",
          prompt: `Dynamic modern banner with ${person.description} showing ${person.expression} expression. Bold colors: ${identity.colors.slice(0, 3).join(', ')}. ${identity.visualStyle} aesthetic, energetic composition. Text area for "${bannerText}" and CTA "${cta}". Professional marketing design.`
        },
        {
          style: "Clean e Minimalista",
          prompt: `Minimalist clean banner design featuring ${person.description}. Subtle color accents: ${identity.colors[0]}. ${identity.mood} mood, spacious layout. Elegant typography area for "${bannerText}". ${identity.visualStyle} minimal professional aesthetic.`
        }
      ];
    }

    // Step 2: Generate images using Nano Banana
    const dimensions = getDimensions(formato);
    
    const imagePromises = generatedPrompts.map(async (promptObj) => {
      try {
        console.log(`Generating image for style: ${promptObj.style}`);
        
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
                content: `${promptObj.prompt}

Image specifications:
- Aspect ratio: ${dimensions.aspectRatio}
- Ultra high resolution, professional quality
- Clean composition suitable for marketing materials
- Space reserved for overlay text and call-to-action buttons`
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (!imageResponse.ok) {
          console.error(`Image generation failed for ${promptObj.style}:`, imageResponse.status);
          return {
            style: promptObj.style,
            success: false,
            error: `Failed to generate: ${imageResponse.status}`
          };
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          console.log(`Successfully generated image for ${promptObj.style}`);
          return {
            style: promptObj.style,
            imageUrl,
            success: true,
            prompt: promptObj.prompt
          };
        } else {
          return {
            style: promptObj.style,
            success: false,
            error: 'No image URL returned'
          };
        }
      } catch (error) {
        console.error(`Error generating image for ${promptObj.style}:`, error);
        return {
          style: promptObj.style,
          success: false,
          error: error.message
        };
      }
    });

    const images = await Promise.all(imagePromises);
    const successfulImages = images.filter(img => img.success);

    console.log(`Generated ${successfulImages.length}/${images.length} images successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        images,
        totalGenerated: successfulImages.length,
        prompts: generatedPrompts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-personalized-banner:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar banner personalizado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDimensions(formato: string): { width: number; height: number; aspectRatio: string } {
  switch (formato) {
    case 'quadrado':
      return { width: 1024, height: 1024, aspectRatio: '1:1 square' };
    case 'retangular':
      return { width: 1200, height: 628, aspectRatio: '1.91:1 landscape' };
    case 'story':
      return { width: 1080, height: 1920, aspectRatio: '9:16 vertical/portrait' };
    case 'banner':
      return { width: 1200, height: 400, aspectRatio: '3:1 wide banner' };
    default:
      return { width: 1024, height: 1024, aspectRatio: '1:1 square' };
  }
}
