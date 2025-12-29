import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageGenerationRequest {
  basePrompt: string;
  headline: string;
  cta: string;
  formato: string;
  identidadeVisual: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[BANNER-IMAGES] Request received');

  try {
    const { basePrompt, headline, cta, formato, identidadeVisual }: ImageGenerationRequest = await req.json();

    if (!lovableApiKey) {
      console.error('[BANNER-IMAGES] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('[BANNER-IMAGES] Headline:', headline);
    console.log('[BANNER-IMAGES] CTA:', cta);

    // Define 3 diferentes estilos visuais
    const styles = [
      {
        name: 'Profissional Moderno',
        modifier: 'professional modern design, clean lines, corporate aesthetic, sophisticated color palette, minimalist layout'
      },
      {
        name: 'Vibrante Energético',
        modifier: 'vibrant energetic design, bold colors, dynamic composition, eye-catching elements, playful and engaging'
      },
      {
        name: 'Minimalista Elegante',
        modifier: 'minimalist elegant design, subtle gradients, refined typography, luxury feel, sophisticated simplicity'
      }
    ];

    // Determinar dimensões baseado no formato
    let width = 1080;
    let height = 1080;
    
    if (formato.toLowerCase().includes('landscape') || formato.toLowerCase().includes('horizontal')) {
      width = 1920;
      height = 1080;
    } else if (formato.toLowerCase().includes('portrait') || formato.toLowerCase().includes('vertical') || formato.toLowerCase().includes('story')) {
      width = 1080;
      height = 1920;
    }

    console.log(`[BANNER-IMAGES] Generating 3 variations with dimensions ${width}x${height}`);

    // Gerar 3 imagens em paralelo
    const imagePromises = styles.map(async (style, index) => {
      // Template de prompt conforme especificação
      const enhancedPrompt = `Create a professional social media banner.

MAIN HEADLINE (must be clearly readable):
"${headline}"

CTA BUTTON TEXT:
"${cta}"

Visual style: ${style.modifier}
Brand identity: ${identidadeVisual}
Format: ${formato}

${basePrompt}

Professional marketing layout, high contrast typography, ultra high resolution.`;

      console.log(`[BANNER-IMAGES] Generating variation ${index + 1}: ${style.name}`);

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [
              {
                role: 'user',
                content: enhancedPrompt
              }
            ],
            modalities: ['image', 'text']
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[BANNER-IMAGES] API error for variation ${index + 1}:`, response.status, errorText);
          throw new Error(`Failed to generate image: ${response.status}`);
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error(`[BANNER-IMAGES] No image URL in response for variation ${index + 1}`);
          throw new Error('No image generated');
        }

        console.log(`[BANNER-IMAGES] Variation ${index + 1} generated successfully`);

        return {
          style: style.name,
          imageUrl: imageUrl,
          success: true
        };
      } catch (error) {
        console.error(`[BANNER-IMAGES] Error generating variation ${index + 1}:`, error);
        return {
          style: style.name,
          imageUrl: null,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(imagePromises);
    const successfulImages = results.filter(r => r.success);

    console.log(`[BANNER-IMAGES] Generated ${successfulImages.length}/3 images successfully`);

    if (successfulImages.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate any images',
          details: results.map(r => r.error).filter(Boolean)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: results,
        totalGenerated: successfulImages.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BANNER-IMAGES] Request failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
