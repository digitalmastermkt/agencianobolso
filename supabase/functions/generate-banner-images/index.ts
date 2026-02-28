import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.error('[BANNER-IMAGES] Auth error:', authError);
    return new Response(
      JSON.stringify({ error: 'Invalid or expired authentication token' }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = claimsData.claims.sub;
  console.log(`[BANNER-IMAGES] Authenticated user: ${userId}`);

  console.log('[BANNER-IMAGES] Request received - Using OpenAI DALL-E 3');

  try {
    const { basePrompt, headline, cta, formato, identidadeVisual } = await req.json();

    // Input validation and sanitization
    const sanitizeInput = (input: string, maxLength: number): string => {
      if (typeof input !== 'string') return '';
      return input
        .trim()
        .slice(0, maxLength)
        .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/gi, '')
        .replace(/system\s*:/gi, '')
        .replace(/assistant\s*:/gi, '')
        .replace(/\bforget\b.*\binstructions?\b/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/[\r\n]+/g, ' ')
        .trim();
    };

    const safeHeadline = sanitizeInput(headline || '', 100);
    const safeCta = sanitizeInput(cta || '', 50);
    const safeBasePrompt = sanitizeInput(basePrompt || '', 500);
    const safeIdentidade = sanitizeInput(identidadeVisual || '', 300);
    const safeFormato = sanitizeInput(formato || '', 50);

    if (!safeHeadline) {
      return new Response(JSON.stringify({ error: 'Headline é obrigatório' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

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
    if (safeFormato.toLowerCase().includes('story') || safeFormato.toLowerCase().includes('vertical')) size = '1024x1792';
    else if (safeFormato.toLowerCase().includes('horizontal') || safeFormato.toLowerCase().includes('landscape')) size = '1792x1024';

    console.log(`[BANNER-IMAGES] Generating 3 variations with size ${size}`);

    const imagePromises = styles.map(async (style, index) => {
      const enhancedPrompt = `Professional social media banner. Headline: "${safeHeadline}". CTA: "${safeCta}". Style: ${style.modifier}. Brand: ${safeIdentidade}. ${safeBasePrompt}. Ultra high resolution, professional marketing layout.`;

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
