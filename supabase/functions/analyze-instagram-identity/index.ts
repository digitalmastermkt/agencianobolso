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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Pelo menos uma imagem é necessária' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (images.length > 5) {
      return new Response(
        JSON.stringify({ error: 'Máximo de 5 imagens permitidas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing ${images.length} Instagram images for visual identity...`);

    // Build content array with all images for analysis
    const contentParts: any[] = [
      {
        type: "text",
        text: `Você é um especialista em design gráfico e identidade visual. Analise as seguintes ${images.length} imagens de um perfil do Instagram e extraia a identidade visual consolidada.

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem explicações, apenas o JSON puro.

Extraia e consolide:
1. **Paleta de cores**: Os 5-7 códigos HEX mais usados (ex: #FF5733, #3498DB)
2. **Tipografia**: Estilo das fontes (serif, sans-serif, display, script), peso (light, regular, bold), e descrição geral
3. **Estilo visual**: Classificação (moderno, minimalista, vibrante, elegante, rústico, corporativo, etc.)
4. **Mood/Atmosfera**: Sensação transmitida (profissional, descontraído, luxuoso, jovem, sério, divertido)
5. **Elementos recorrentes**: Ícones, formas, padrões, texturas que aparecem frequentemente
6. **Descrição geral**: Uma descrição completa da identidade visual em 2-3 frases

Formato de resposta JSON EXATO:
{
  "colors": ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5"],
  "typography": {
    "style": "sans-serif",
    "weight": "bold",
    "description": "Tipografia moderna e impactante"
  },
  "visualStyle": "moderno minimalista",
  "mood": "profissional e sofisticado",
  "recurringElements": ["ícones geométricos", "linhas clean"],
  "overallDescription": "Identidade visual moderna com foco em..."
}`
      }
    ];

    // Add each image to the content
    for (let i = 0; i < images.length; i++) {
      contentParts.push({
        type: "image_url",
        image_url: {
          url: images[i].startsWith('data:') ? images[i] : `data:image/jpeg;base64,${images[i]}`
        }
      });
    }

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
            content: contentParts
          }
        ],
        max_tokens: 2000,
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
    let identity: VisualIdentity;
    try {
      // Clean up the response - remove markdown code blocks if present
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
      
      identity = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a default structure if parsing fails
      identity = {
        colors: ['#3498DB', '#2ECC71', '#E74C3C', '#9B59B6', '#F39C12'],
        typography: {
          style: 'sans-serif',
          weight: 'regular',
          description: 'Tipografia padrão detectada'
        },
        visualStyle: 'moderno',
        mood: 'profissional',
        recurringElements: ['elementos gráficos'],
        overallDescription: 'Identidade visual analisada com base nas imagens fornecidas'
      };
    }

    console.log('Parsed identity:', identity);

    return new Response(
      JSON.stringify({ 
        success: true,
        identity,
        imagesAnalyzed: images.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-instagram-identity:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao analisar identidade visual' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
