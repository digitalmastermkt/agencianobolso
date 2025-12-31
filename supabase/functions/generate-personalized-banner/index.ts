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
  personPhotoUrl?: string;  // URL da foto original para preservar identidade
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
  },
  // NOVOS ESTILOS
  'minimalista': {
    name: 'Minimalista',
    focus: 'ultra clean design, maximum white space, single focal point, zen aesthetic, scandinavian simplicity',
    lighting: 'soft even lighting, no harsh shadows, ethereal glow, natural light feeling',
    composition: 'centered subject with extreme negative space, geometric simplicity, breathing room'
  },
  'luxo': {
    name: 'Luxo Premium',
    focus: 'luxury brand aesthetic, gold accents, rich textures, opulent feel, Chanel/Dior quality',
    lighting: 'warm golden hour lighting, subtle sparkles, reflective surfaces, jewel-like highlights',
    composition: 'elegant framing, sophisticated restraint, high-end magazine quality, premium materials'
  },
  'jovem_vibrante': {
    name: 'Jovem e Vibrante',
    focus: 'Gen-Z aesthetic, bold neon colors, playful energy, trendy vibes, TikTok native design',
    lighting: 'colorful neon rim lights, vibrant gradients, energetic atmosphere, RGB glow effects',
    composition: 'dynamic angles, overlapping elements, social media native design, Y2K influences'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identity, person, personPhotoUrl, bannerText, cta, formato, additionalInfo, generationStyle }: BannerRequest = await req.json();
    
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
    console.log('Person photo URL provided:', !!personPhotoUrl);

    // PROFESSIONAL SYSTEM PROMPT FOR AGENCY-QUALITY PROMPTS
    const systemPrompt = `Você é o Diretor Criativo de uma agência de publicidade premiada internacionalmente (CANNES LIONS, D&AD, ONE SHOW).

Sua especialidade é criar prompts que geram imagens de campanhas publicitárias de altíssimo nível, comparáveis a trabalhos de agências como Wieden+Kennedy, BBDO, Ogilvy e Apple.

## REGRAS DE OURO PARA PROMPTS PROFISSIONAIS:

### 1. PRESERVAÇÃO DE IDENTIDADE (CRÍTICO!)
- A pessoa na foto de referência DEVE ser preservada EXATAMENTE como é
- Traços faciais: manter formato do rosto, olhos, nariz, boca IDÊNTICOS
- Proporções corporais: manter altura, estrutura, silhueta EXATA
- Tom de pele: preservar exatamente o tom original, sem clarear ou escurecer
- Cabelo: manter cor, textura e estilo originais
- Características únicas: sardas, marcas, expressão natural

### 2. COMPOSIÇÃO CINEMATOGRÁFICA
- Regra dos terços com ponto focal estratégico
- Hierarquia visual clara (pessoa > mensagem > elementos secundários)
- Espaço negativo intencional para texto overlay
- Linhas de fuga e geometria que guiam o olhar

### 3. ILUMINAÇÃO DE ESTÚDIO PROFISSIONAL
- Sempre especificar tipo de iluminação: rim light, key light, fill light, soft diffused
- Efeitos de luz premium: lens flares sutis, bokeh, gradientes atmosféricos
- Iluminação que esculpe o rosto e cria profundidade
- Contraluz para criar separação do fundo

### 4. QUALIDADE TÉCNICA OBRIGATÓRIA
- Sempre incluir: "8K resolution, ultra sharp focus, professional retouching"
- "Commercial photography, advertising campaign quality"
- "Magazine editorial quality, billboard-ready"
- "Professional color grading, cinematic color palette"

### 5. INTEGRAÇÃO PESSOA + MARCA
- A pessoa deve parecer parte orgânica do design, não colada
- Cores da roupa/ambiente devem complementar a paleta da marca
- Expressão e pose devem transmitir o mood da marca
- Iluminação consistente entre pessoa e ambiente

### O QUE NUNCA FAZER:
- ALTERAR traços faciais, tom de pele ou características físicas da pessoa
- Composições centralizadas sem dinamismo
- Fundos chapados ou genéricos
- Iluminação plana sem drama
- Texto sobreposto em áreas de detalhe
- Cores discordantes da identidade da marca`;

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

## PRESERVAÇÃO DE IDENTIDADE (OBRIGATÓRIO):
${personPhotoUrl ? `FOTO DE REFERÊNCIA DISPONÍVEL - A identidade da pessoa DEVE ser preservada EXATAMENTE:
- Manter traços faciais idênticos à foto original
- Preservar tom de pele original sem alterações
- Manter proporções corporais exatas
- Preservar estilo de cabelo e cor originais` : 'Sem foto de referência - criar com base na descrição'}

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
1. Descrição detalhada da pessoa COM ÊNFASE NA PRESERVAÇÃO DE IDENTIDADE
2. Tipo específico de iluminação conforme o estilo: ${selectedStyleConfig.lighting}
3. Composição: ${selectedStyleConfig.composition}
4. Cores exatas da paleta aplicadas (gradientes, fundos, elementos)
5. Atmosfera e mood específicos
6. Qualidade técnica: "8K, commercial photography, professional retouching"
7. Referência de estilo: ${selectedStyleConfig.focus}
8. TEXTO OBRIGATÓRIO NO BANNER: O headline "${bannerText}" deve aparecer em destaque com tipografia profissional, legível e integrada ao design
9. BOTÃO CTA OBRIGATÓRIO: Incluir botão com o texto "${cta}" em posição estratégica para conversão
10. PRESERVAÇÃO DE IDENTIDADE: "Preserve exactly the facial features, skin tone, and body proportions from the reference photo"`
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
      
      const basePrompt = `Ultra professional advertising campaign photograph. ${person.description} in ${person.pose} pose with ${person.expression} expression, perfectly integrated into a ${identity.visualStyle} environment. CRITICAL: Preserve exactly the facial features, skin tone (${person.colorHarmony.skinTone}), and body proportions from the reference. ${selectedStyleConfig.lighting}. Color palette: dominant ${primaryColor} with ${secondaryColor} highlights and ${accentColor} accents. ${identity.mood} atmosphere. ${selectedStyleConfig.composition}. Premium textures, professional depth of field. 8K resolution, commercial photography quality, ${selectedStyleConfig.focus}.`;

      generatedPrompts = [
        {
          style: `${selectedStyleConfig.name} - Variação A`,
          prompt: basePrompt + ` Bold headline text "${bannerText}" prominently displayed with professional typography at top, CTA button "${cta}" at bottom right. Sharp, legible text with excellent contrast.`
        },
        {
          style: `${selectedStyleConfig.name} - Variação B`,
          prompt: basePrompt + ` Professional advertising layout with bold headline "${bannerText}" in center-left, call-to-action button "${cta}" positioned for maximum conversion. Clean typography, perfect readability.`
        },
        {
          style: `${selectedStyleConfig.name} - Variação C`,
          prompt: basePrompt + ` Dynamic composition with impactful headline "${bannerText}" and prominent CTA button "${cta}". Magazine-quality typography, professional text hierarchy.`
        }
      ];
    }

    // Step 2: Generate images using multimodal approach with photo reference
    const dimensions = getDimensions(formato);
    
    const imagePromises = generatedPrompts.map(async (promptObj) => {
      try {
        console.log(`Generating professional image for style: ${promptObj.style}`);
        
        // Build message content - use multimodal if photo URL is available
        let messageContent: any;
        
        if (personPhotoUrl) {
          // MULTIMODAL: Use the photo as reference for identity preservation
          const enhancedPrompt = `Create a professional advertising banner using this person as the protagonist.

CRITICAL IDENTITY PRESERVATION RULES:
- Keep EXACTLY the same facial features as in the reference photo
- Preserve the EXACT skin tone - do not lighten or darken
- Maintain the exact body proportions and silhouette
- Keep the same hair color, texture, and style
- Preserve any unique features (freckles, marks, expression)

ONLY MODIFY:
- Background/environment: ${selectedStyleConfig.focus}
- Lighting style: ${selectedStyleConfig.lighting}
- Composition: ${selectedStyleConfig.composition}
- Outfit can be updated to match brand colors: ${identity.colors.join(', ')}

BANNER CONTENT:
- Headline text (MUST BE VISIBLE AND LEGIBLE): "${bannerText}"
- CTA button text: "${cta}"
- Typography: Clean, bold, professional advertising quality
- Text contrast: High contrast for perfect readability

VISUAL STYLE: ${promptObj.prompt}

TECHNICAL SPECS:
- Aspect ratio: ${dimensions.aspectRatio}
- Quality: 8K, ultra sharp, professional retouching, commercial photography standard`;

          messageContent = [
            {
              type: "text",
              text: enhancedPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: personPhotoUrl
              }
            }
          ];
        } else {
          // Text-only generation without photo reference
          const enhancedPrompt = `${promptObj.prompt}

TECHNICAL SPECIFICATIONS:
- Aspect ratio: ${dimensions.aspectRatio}
- Ultra high resolution, 8K quality, razor sharp focus
- Professional advertising photography standard

MANDATORY TEXT REQUIREMENTS:
- Include the headline "${bannerText}" as bold, prominent text in the banner
- Include a CTA button with text "${cta}" 
- Typography must be clean, sharp, perfectly legible, professional advertising quality
- Text should have excellent contrast against background for maximum readability
- Use modern, professional font styling (bold sans-serif for headlines)
- Text placement should follow professional advertising layout principles`;

          messageContent = enhancedPrompt;
        }

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
                content: messageContent
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
