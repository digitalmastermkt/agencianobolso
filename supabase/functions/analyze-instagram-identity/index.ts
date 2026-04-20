import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Master user email - sourced from MASTER_USER_EMAIL secret (no hardcoding).
const MASTER_USER_EMAIL = (Deno.env.get("MASTER_USER_EMAIL") ?? "").toLowerCase();

// Credit costs
const CREDITS_CREATE_BRAND = 2;
const CREDITS_UPDATE_BRAND = 1;

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

  const respond = (data: Record<string, unknown>, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  let transactionId: string | null = null;
  let userId = "anonymous";
  let userEmail: string | null = null;
  let isMasterUser = false;
  let creditsCost = CREDITS_CREATE_BRAND; // Default to create cost

  try {
    const { images, isUpdate = false } = await req.json();
    
    // Set credit cost based on operation type
    creditsCost = isUpdate ? CREDITS_UPDATE_BRAND : CREDITS_CREATE_BRAND;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return respond({ error: 'Pelo menos uma imagem é necessária' }, 400);
    }

    if (images.length > 5) {
      return respond({ error: 'Máximo de 5 imagens permitidas' }, 400);
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!openAIApiKey) throw new Error('OPENAI_API_KEY is not configured');

    // Create Supabase client for credits operations
    let supabaseClient: ReturnType<typeof createClient> | null = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    // Get user ID and email from auth header
    const authHeader = req.headers.get("Authorization");
    if (authHeader && supabaseClient) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (user?.id) {
          userId = user.id;
          userEmail = user.email || null;
          isMasterUser = !!MASTER_USER_EMAIL && (userEmail || "").toLowerCase() === MASTER_USER_EMAIL;
        }
      } catch (e) {
        console.log("[analyze-instagram-identity] Could not get user from token");
      }
    }

    // ============ CREDIT VERIFICATION AND DEBIT ============
    if (userId !== "anonymous" && !isMasterUser && supabaseClient) {
      console.log(`[analyze-instagram-identity] Checking credits for user ${userId}, cost: ${creditsCost}`);
      
      const { data: debitResult, error: debitError } = await supabaseClient
        .rpc('debit_user_credits', {
          p_user_id: userId,
          p_amount: creditsCost,
          p_action_type: isUpdate ? 'update_brand_profile' : 'create_brand_profile',
          p_description: isUpdate ? 'Atualização de perfil de marca' : 'Criação de perfil de marca'
        });

      if (debitError) {
        console.error("[analyze-instagram-identity] Credit debit error:", debitError);
        return respond({
          success: false,
          error: "Erro ao verificar créditos. Tente novamente.",
          credits_error: true
        }, 500);
      }

      if (!debitResult?.success) {
        console.log("[analyze-instagram-identity] Insufficient credits:", debitResult);
        return respond({
          success: false,
          error: debitResult?.error || "Créditos insuficientes. Adquira mais créditos para continuar.",
          credits_required: creditsCost,
          credits_available: debitResult?.balance || 0,
          insufficient_credits: true
        }, 402);
      }

      transactionId = debitResult.transaction_id;
      console.log(`[analyze-instagram-identity] Credits debited. Transaction: ${transactionId}`);
    } else if (isMasterUser) {
      console.log("[analyze-instagram-identity] Master user - bypassing credit check");
    }

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
      
      // Refund on API error
      if (transactionId && supabaseClient) {
        await supabaseClient.rpc('refund_user_credits', {
          p_user_id: userId,
          p_amount: creditsCost,
          p_original_transaction_id: transactionId,
          p_reason: 'Falha na API OpenAI'
        });
        console.log("[analyze-instagram-identity] Credits refunded due to API error");
      }
      
      if (response.status === 429) {
        return respond({ error: 'Rate limit exceeded.' }, 429);
      }
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

    return respond({ success: true, identity, imagesAnalyzed: images.length });

  } catch (error: unknown) {
    console.error('Error:', error);
    
    // Refund on technical failure
    if (transactionId && userId !== "anonymous") {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          await supabaseClient.rpc('refund_user_credits', {
            p_user_id: userId,
            p_amount: creditsCost,
            p_original_transaction_id: transactionId,
            p_reason: 'Falha técnica na análise de identidade'
          });
          console.log("[analyze-instagram-identity] Credits refunded due to error");
        }
      } catch (refundErr) {
        console.error("[analyze-instagram-identity] Refund error:", refundErr);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return respond({ error: errorMessage }, 500);
  }
});
