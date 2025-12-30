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
  generationStyle?: string;
}

const STYLE_CONFIGS: Record<string, { name: string; focus: string; lighting: string; composition: string }> = {
  'editorial_premium': {
    name: 'Editorial Premium',
    focus: 'high-fashion editorial aesthetic, dramatic contrast, magazine cover quality',
    lighting: 'dramatic rim light with soft key light, cinematic shadows, luminous highlights',
    composition: 'asymmetric editorial layout with bold negative space, fashion photography framing'
  },
  'corporate_elegante': {
    name: 'Corporate Elegante', 
    focus: 'refined sophistication, clean minimalism, luxury brand aesthetic',
    lighting: 'soft diffused lighting, subtle gradients, professional studio setup',
    composition: 'balanced golden ratio composition, generous white space, elegant restraint'
  },
  'dinamico_impactante': {
    name: 'Dinâmico Impactante',
    focus: 'high-energy visual impact, bold colors, dynamic movement',
    lighting: 'dramatic colored rim lights, strong contrast, energetic light effects',
    composition: 'dynamic diagonal lines, motion blur elements, action-oriented framing'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identity, person, bannerText, cta, formato, additionalInfo, generationStyle }: BannerRequest = await req.json();
    
    const selectedStyleConfig = STYLE_CONFIGS[generationStyle || 'editorial_premium'] || STYLE_CONFIGS['editorial_premium'];
    
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

    console.log('Generating professional agency-quality banners...');

    // PROFESSIONAL SYSTEM PROMPT FOR AGENCY-QUALITY PROMPTS
    const systemPrompt = `Você é o Diretor Criativo de uma agência de publicidade premiada internacionalmente (CANNES LIONS, D&AD, ONE SHOW).

Sua especialidade é criar prompts que geram imagens de campanhas publicitárias de altíssimo nível, comparáveis a trabalhos de agências como Wieden+Kennedy, BBDO, Ogilvy e Apple.

## REGRAS DE OURO PARA PROMPTS PROFISSIONAIS:

### 1. COMPOSIÇÃO CINEMATOGRÁFICA
- Regra dos terços com ponto focal estratégico
- Hierarquia visual clara (pessoa > mensagem > elementos secundários)
- Espaço negativo intencional para texto overlay
- Linhas de fuga e geometria que guiam o olhar

### 2. ILUMINAÇÃO DE ESTÚDIO PROFISSIONAL
- Sempre especificar tipo de iluminação: rim light, key light, fill light, soft diffused
- Efeitos de luz premium: lens flares sutis, bokeh, gradientes atmosféricos
- Iluminação que esculpe o rosto e cria profundidade
- Contraluz para criar separação do fundo

### 3. QUALIDADE TÉCNICA OBRIGATÓRIA
- Sempre incluir: "8K resolution, ultra sharp focus, professional retouching"
- "Commercial photography, advertising campaign quality"
- "Magazine editorial quality, billboard-ready"
- "Professional color grading, cinematic color palette"

### 4. INTEGRAÇÃO PESSOA + MARCA
- A pessoa deve parecer parte orgânica do design, não colada
- Cores da roupa/ambiente devem complementar a paleta da marca
- Expressão e pose devem transmitir o mood da marca
- Iluminação consistente entre pessoa e ambiente

### 5. ELEMENTOS PREMIUM
- Texturas refinadas: gradientes suaves, materiais premium
- Efeitos sutis: sombras longas, reflexos, profundidade de campo
- Atmosfera: partículas de luz, névoa sutil, halos de luz

### O QUE NUNCA FAZER:
- Composições centralizadas sem dinamismo
- Fundos chapados ou genéricos
- Iluminação plana sem drama
- Texto sobreposto em áreas de detalhe
- Cores discordantes da identidade da marca
- Elementos "floating" sem integração

### REFERÊNCIAS VISUAIS:
- Campanhas Apple: minimalismo premium, iluminação perfeita
- Campanhas Nike: dinamismo, energia, movimento congelado
- Campanhas luxury brands: sofisticação, espaço, elegância`;

    // Step 1: Generate optimized professional prompts
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
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Crie 3 prompts ULTRA PROFISSIONAIS para gerar banners de campanha publicitária de alto impacto.

## ESTILO DE GERAÇÃO SELECIONADO: ${selectedStyleConfig.name}
- Foco visual: ${selectedStyleConfig.focus}
- Iluminação preferida: ${selectedStyleConfig.lighting}
- Composição: ${selectedStyleConfig.composition}

IMPORTANTE: Todos os 3 prompts devem seguir o estilo "${selectedStyleConfig.name}" com variações sutis de composição e iluminação.

## IDENTIDADE VISUAL DA MARCA:
- Paleta de cores: ${identity.colors.join(', ')}
- Tipografia: ${identity.typography.style} (${identity.typography.weight})
- Estilo visual: ${identity.visualStyle}
- Mood/Atmosfera: ${identity.mood}
- Elementos recorrentes: ${identity.recurringElements.join(', ') || 'N/A'}
- Descrição geral: ${identity.overallDescription}

## DADOS DA PESSOA (PROTAGONISTA DO BANNER):
- Descrição física: ${person.description}
- Pose atual: ${person.pose}
- Contexto sugerido: ${person.suggestedContext}
- Estilo pessoal: ${person.style}
- Expressão facial: ${person.expression}
- Tom de pele: ${person.colorHarmony.skinTone}
- Cor do cabelo: ${person.colorHarmony.hairColor}
- Cores da roupa: ${person.colorHarmony.clothingColors.join(', ')}

## BRIEFING DO BANNER:
- Headline principal: "${bannerText || 'Mensagem promocional impactante'}"
- Call-to-action: "${cta || 'Saiba mais'}"
- Formato final: ${formato || 'quadrado (1:1)'}
- Contexto adicional: ${additionalInfo || 'Banner para campanha digital'}

## FORMATO DE RESPOSTA (JSON ESTRITO):
{
  "prompts": [
    {
      "style": "${selectedStyleConfig.name} - Variação A",
      "prompt": "prompt ultra detalhado com todos os elementos técnicos..."
    },
    {
      "style": "${selectedStyleConfig.name} - Variação B",
      "prompt": "prompt ultra detalhado com todos os elementos técnicos..."
    },
    {
      "style": "${selectedStyleConfig.name} - Variação C",
      "prompt": "prompt ultra detalhado com todos os elementos técnicos..."
    }
  ]
}

IMPORTANTE: Cada prompt DEVE ter 150-200 palavras e incluir TODOS estes elementos:
1. Descrição detalhada da pessoa integrada naturalmente no design
2. Tipo específico de iluminação conforme o estilo: ${selectedStyleConfig.lighting}
3. Composição: ${selectedStyleConfig.composition}
4. Cores exatas da paleta aplicadas (gradientes, fundos, elementos)
5. Atmosfera e mood específicos
6. Qualidade técnica: "8K, commercial photography, professional retouching"
7. Referência de estilo: ${selectedStyleConfig.focus}
8. DO NOT include any text in the generated image`
          }
        ],
        max_tokens: 4000,
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

    console.log('Generated professional prompts:', promptContent);

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
      console.error('Failed to parse prompts, using professional fallbacks:', parseError);
      // Professional fallback prompts based on selected style
      const primaryColor = identity.colors[0] || '#1a1a1a';
      const secondaryColor = identity.colors[1] || '#ffffff';
      const accentColor = identity.colors[2] || '#ff6b35';
      
      const basePrompt = `Ultra professional advertising campaign photograph. ${person.description} in ${person.pose} pose with ${person.expression} expression, perfectly integrated into a ${identity.visualStyle} environment. ${selectedStyleConfig.lighting}. Color palette: dominant ${primaryColor} with ${secondaryColor} highlights and ${accentColor} accents. ${identity.mood} atmosphere. ${selectedStyleConfig.composition}. Premium textures, professional depth of field. 8K resolution, commercial photography quality, ${selectedStyleConfig.focus}. DO NOT include any text in the image.`;

      generatedPrompts = [
        {
          style: `${selectedStyleConfig.name} - Variação A`,
          prompt: basePrompt + ` Emphasizing dramatic lighting with subject at left third, clean space for headline "${bannerText}".`
        },
        {
          style: `${selectedStyleConfig.name} - Variação B`,
          prompt: basePrompt + ` Centered subject with symmetrical composition, atmospheric gradients blending ${primaryColor} to ${secondaryColor}.`
        },
        {
          style: `${selectedStyleConfig.name} - Variação C`,
          prompt: basePrompt + ` Dynamic diagonal composition with subject at golden ratio point, energetic atmosphere for CTA "${cta}".`
        }
      ];
    }

    // Step 2: Generate images using Nano Banana with professional prompts
    const dimensions = getDimensions(formato);
    
    const imagePromises = generatedPrompts.map(async (promptObj) => {
      try {
        console.log(`Generating professional image for style: ${promptObj.style}`);
        
        // Enhanced prompt with format-specific instructions
        const enhancedPrompt = `${promptObj.prompt}

TECHNICAL SPECIFICATIONS:
- Aspect ratio: ${dimensions.aspectRatio}
- Ultra high resolution, 8K quality, razor sharp focus
- Professional advertising photography standard
- Clean composition optimized for marketing materials
- Clear space reserved for text overlay and call-to-action buttons
- NO TEXT, NO WORDS, NO LETTERS in the generated image
- Pure visual composition only`;

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
                content: enhancedPrompt
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
          console.log(`Successfully generated professional image for ${promptObj.style}`);
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

    console.log(`Generated ${successfulImages.length}/${images.length} professional images successfully`);

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
    case 'feed':
      return { width: 1024, height: 1024, aspectRatio: '1:1 square format, perfect symmetry' };
    case 'retangular':
    case 'landscape':
      return { width: 1200, height: 628, aspectRatio: '1.91:1 landscape wide format' };
    case 'story':
    case 'stories':
    case 'reels':
      return { width: 1080, height: 1920, aspectRatio: '9:16 vertical portrait format, mobile-first' };
    case 'banner':
    case 'header':
      return { width: 1200, height: 400, aspectRatio: '3:1 ultra-wide banner format' };
    default:
      return { width: 1024, height: 1024, aspectRatio: '1:1 square format' };
  }
}
