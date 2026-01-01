import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[BANNER-IMAGES] Request received - Using OpenAI DALL-E 3');

  try {
    const { basePrompt, headline, cta, formato, identidadeVisual } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const styles = [
      { name: 'Profissional Moderno', modifier: 'professional modern design, clean lines, corporate aesthetic' },
      { name: 'Vibrante Energético', modifier: 'vibrant energetic design, bold colors, dynamic composition' },
      { name: 'Minimalista Elegante', modifier: 'minimalist elegant design, subtle gradients, luxury feel' }
    ];

    let size = '1024x1024';
    if (formato?.toLowerCase().includes('story') || formato?.toLowerCase().includes('vertical')) size = '1024x1792';
    else if (formato?.toLowerCase().includes('horizontal') || formato?.toLowerCase().includes('landscape')) size = '1792x1024';

    console.log(`[BANNER-IMAGES] Generating 3 variations with size ${size}`);

    const imagePromises = styles.map(async (style, index) => {
      const enhancedPrompt = `Professional social media banner. Headline: "${headline}". CTA: "${cta}". Style: ${style.modifier}. Brand: ${identidadeVisual}. ${basePrompt}. Ultra high resolution, professional marketing layout.`;

      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'dall-e-3', prompt: enhancedPrompt, n: 1, size, quality: 'hd' })
        });

        if (!response.ok) {
          console.error(`[BANNER-IMAGES] Error for variation ${index + 1}:`, response.status);
          return { style: style.name, imageUrl: null, success: false };
        }

        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;

        console.log(`[BANNER-IMAGES] Variation ${index + 1} generated successfully`);
        return { style: style.name, imageUrl, success: !!imageUrl };
      } catch (error) {
        console.error(`[BANNER-IMAGES] Error:`, error);
        return { style: style.name, imageUrl: null, success: false };
      }
    });

    const results = await Promise.all(imagePromises);
    const successfulImages = results.filter(r => r.success);

    if (successfulImages.length === 0) {
      return new Response(JSON.stringify({ error: 'Failed to generate any images' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    return new Response(JSON.stringify({ success: true, images: results, totalGenerated: successfulImages.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('[BANNER-IMAGES] Request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
