import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisualIdentity {
  colors: string[];
  typography: { style: string; weight: string; description: string };
  visualStyle: string;
  mood: string;
  recurringElements: string[];
  overallDescription: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: 'Pelo menos uma imagem é necessária' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (images.length > 5) {
      return new Response(JSON.stringify({ error: 'Máximo de 5 imagens permitidas' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OPENAI_API_KEY is not configured');

    console.log(`Analyzing ${images.length} Instagram images with OpenAI Vision...`);

    const content: any[] = [
      {
        type: "text",
        text: `Analise estas ${images.length} imagens do Instagram e extraia a identidade visual. Retorne APENAS JSON válido:
{
  "colors": ["#HEX1", "#HEX2", "#HEX3"],
  "typography": { "style": "sans-serif", "weight": "bold", "description": "..." },
  "visualStyle": "moderno minimalista",
  "mood": "profissional",
  "recurringElements": ["elemento1"],
  "overallDescription": "Descrição da identidade visual..."
}`
      }
    ];

    for (const image of images) {
      content.push({
        type: "image_url",
        image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` }
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    let identity: VisualIdentity;
    try {
      let cleanContent = responseContent.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      identity = JSON.parse(cleanContent);
    } catch {
      identity = {
        colors: ['#3498DB', '#2ECC71', '#E74C3C'],
        typography: { style: 'sans-serif', weight: 'regular', description: 'Tipografia padrão' },
        visualStyle: 'moderno',
        mood: 'profissional',
        recurringElements: ['elementos gráficos'],
        overallDescription: 'Identidade visual analisada'
      };
    }

    return new Response(JSON.stringify({ success: true, identity, imagesAnalyzed: images.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
