import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_CONFIGS: Record<string, { name: string; focus: string; lighting: string }> = {
  'editorial_premium': { name: 'Editorial Premium', focus: 'high-fashion editorial, magazine cover quality', lighting: 'dramatic rim light, cinematic shadows' },
  'corporate_elegante': { name: 'Corporate Elegante', focus: 'refined sophistication, luxury brand aesthetic', lighting: 'soft diffused lighting, professional studio' },
  'dinamico_impactante': { name: 'Dinâmico Impactante', focus: 'high-energy visual impact, bold colors', lighting: 'dramatic colored rim lights, strong contrast' },
  'minimalista': { name: 'Minimalista', focus: 'ultra clean design, maximum white space, zen aesthetic', lighting: 'soft even lighting, ethereal glow' },
  'luxo': { name: 'Luxo Premium', focus: 'luxury brand aesthetic, gold accents, opulent feel', lighting: 'warm golden hour, jewel-like highlights' },
  'jovem_vibrante': { name: 'Jovem e Vibrante', focus: 'Gen-Z aesthetic, bold neon colors, TikTok native', lighting: 'colorful neon rim lights, RGB glow' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { identity, person, personPhotoUrl, bannerText, cta, formato, generationStyle } = await req.json();
    
    const styleConfig = STYLE_CONFIGS[generationStyle || 'editorial_premium'] || STYLE_CONFIGS['editorial_premium'];
    
    if (!identity || !person) {
      return new Response(JSON.stringify({ error: 'Identidade visual e dados da pessoa são necessários' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OPENAI_API_KEY is not configured');

    console.log('Generating personalized banners with OpenAI...');

    // Step 1: Generate prompts with GPT-5 Mini
    const promptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Você é um diretor criativo de agência premiada. Crie prompts profissionais para banners publicitários. Estilo: ${styleConfig.name}` },
          { role: 'user', content: `Crie 3 prompts para banner. Cores: ${identity.colors?.join(', ')}. Mood: ${identity.mood}. Pessoa: ${person.description}. Headline: "${bannerText}". CTA: "${cta}". Formato: ${formato}. Retorne JSON: {"prompts": [{"style": "nome", "prompt": "texto"}]}` }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!promptResponse.ok) throw new Error(`Prompt generation failed: ${promptResponse.status}`);

    const promptData = await promptResponse.json();
    let prompts: Array<{ style: string; prompt: string }> = [];
    
    try {
      const content = promptData.choices?.[0]?.message?.content?.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      prompts = JSON.parse(content).prompts;
    } catch {
      const basePrompt = `Professional advertising banner. ${person.description} with ${person.expression} expression. Colors: ${identity.colors?.join(', ')}. ${styleConfig.focus}. ${styleConfig.lighting}. Headline: "${bannerText}". CTA button: "${cta}". 8K, commercial quality.`;
      prompts = [
        { style: `${styleConfig.name} A`, prompt: basePrompt },
        { style: `${styleConfig.name} B`, prompt: basePrompt + ' Dynamic composition.' },
        { style: `${styleConfig.name} C`, prompt: basePrompt + ' Elegant framing.' }
      ];
    }

    // Step 2: Generate images with GPT Image 1
    let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
    if (formato === 'story') size = '1024x1792';
    else if (formato === 'retangular') size = '1792x1024';

    const imagePromises = prompts.slice(0, 3).map(async (promptObj) => {
      try {
        const enhancedPrompt = `${promptObj.prompt}. Ultra high resolution, professional advertising photography. Must include headline text "${bannerText}" and CTA button "${cta}".`;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'dall-e-3', prompt: enhancedPrompt, n: 1, size, quality: 'hd' }),
        });

        if (!response.ok) return { style: promptObj.style, success: false };

        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;

        return { style: promptObj.style, imageUrl, prompt: promptObj.prompt, success: !!imageUrl };
      } catch {
        return { style: promptObj.style, success: false };
      }
    });

    const results = await Promise.all(imagePromises);
    const successfulImages = results.filter(r => r.success);

    if (successfulImages.length === 0) throw new Error('Failed to generate any images');

    console.log(`Successfully generated ${successfulImages.length} images`);

    return new Response(JSON.stringify({
      success: true,
      images: successfulImages.map(r => ({ style: r.style, imageUrl: r.imageUrl, prompt: r.prompt })),
      totalGenerated: successfulImages.length
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
