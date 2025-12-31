import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas for each agent type
const baseFieldSchema = z.string().trim().max(500, 'Campo muito longo (máximo 500 caracteres)');
const shortFieldSchema = z.string().trim().max(200, 'Campo muito longo (máximo 200 caracteres)');

const vendasSchema = z.object({
  nome_negocio: shortFieldSchema,
  produto: baseFieldSchema,
  localizacao: shortFieldSchema.optional().default(''),
  publico_alvo: baseFieldSchema,
  beneficio: baseFieldSchema,
  prova_social: baseFieldSchema.optional().default(''),
  oferta: baseFieldSchema,
  tom: shortFieldSchema,
});

const storytellingSchema = z.object({
  nome_negocio: shortFieldSchema,
  produto: baseFieldSchema,
  localizacao: shortFieldSchema.optional().default(''),
  publico_alvo: baseFieldSchema,
  valores_marca: baseFieldSchema,
  tom: shortFieldSchema,
});

const viralSchema = z.object({
  nome_negocio: shortFieldSchema,
  produto: baseFieldSchema,
  localizacao: shortFieldSchema.optional().default(''),
  publico_alvo: baseFieldSchema,
  beneficio: baseFieldSchema,
  oferta: baseFieldSchema,
  tom: shortFieldSchema,
});

const interacaoSchema = z.object({
  publico_alvo: baseFieldSchema,
  produto: baseFieldSchema,
  acao_desejada: baseFieldSchema,
});

const conexaoSchema = z.object({
  nome_negocio: shortFieldSchema,
  produto: baseFieldSchema,
  objetivo_story: baseFieldSchema,
  publico_alvo: baseFieldSchema,
  tom: shortFieldSchema,
  link_ou_acao: baseFieldSchema,
});

const bannerSchema = z.object({
  produto: baseFieldSchema,
  beneficio: baseFieldSchema,
  identidade_visual: baseFieldSchema,
  publico_alvo: baseFieldSchema,
  imagem_produto: baseFieldSchema.optional().default(''),
  objetivo_post: baseFieldSchema,
  formato_imagem: shortFieldSchema,
  informacoes_obrigatorias: baseFieldSchema.optional().default(''),
});

const validationSchemas = {
  vendas: vendasSchema,
  storytelling: storytellingSchema,
  viral: viralSchema,
  interacao: interacaoSchema,
  conexao: conexaoSchema,
  banner: bannerSchema,
};

function secureLog(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) {
  const sanitizedMetadata = metadata ? {
    ...metadata,
    userId: metadata.userId ? '***' : undefined,
    email: metadata.email ? '***' : undefined,
    formData: metadata.formData ? '[REDACTED]' : undefined,
  } : {};
  
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...sanitizedMetadata }));
}

function sanitizeInput(input: string): string {
  return input
    .replace(/\bignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)\b/gi, '')
    .replace(/\byou\s+are\s+(now|a)\s+/gi, '')
    .replace(/\bsystem\s*:/gi, '')
    .replace(/\bassistant\s*:/gi, '')
    .replace(/\buser\s*:/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .trim();
}

const agentPrompts = {
  vendas: `Você é um especialista em vídeos de vendas curtos. Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Localização: {{localizacao}}
- Público-alvo: {{publico_alvo}}
- Principal benefício: {{beneficio}}
- Prova social: {{prova_social}}
- Oferta: {{oferta}}
- Tom: {{tom}}

Crie um roteiro CURTO (máximo 130 palavras) com: HOOK forte, DOR, TRANSFORMAÇÃO, OFERTA irresistível, CTA direto.`,

  storytelling: `Você é um especialista em storytelling para vídeos. Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Localização: {{localizacao}}
- Público-alvo: {{publico_alvo}}
- Valores da marca: {{valores_marca}}
- Tom: {{tom}}

Crie um mini-roteiro com storytelling (máximo 130 palavras) que abra com conexão emocional, conte uma microhistória e termine com CTA.`,

  viral: `Você é um especialista em conteúdo viral para Reels. Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Localização: {{localizacao}}
- Público-alvo: {{publico_alvo}}
- Principal benefício: {{beneficio}}
- Oferta: {{oferta}}
- Tom: {{tom}}

Crie um roteiro viral (máximo 130 palavras) com HOOK que para o scroll, problema relatable, benefício surpreendente e CTA.`,

  interacao: `Você é um especialista em stories interativos. Baseado nas informações:
- Público-alvo: {{publico_alvo}}
- Produto/serviço: {{produto}}
- Ação desejada: {{acao_desejada}}

Crie uma sequência de 3-5 stories provocativos com enquetes e perguntas.`,

  conexao: `Você é um especialista em stories que criam vínculo emocional. Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Objetivo do story: {{objetivo_story}}
- Público-alvo: {{publico_alvo}}
- Tom: {{tom}}
- Link/ação: {{link_ou_acao}}

Crie até 5 cenas de stories que mostrem bastidores autênticos e criem conexão pessoal.`,

  banner: `Você é um especialista em design de banners publicitários. Baseado nos dados:
- Produto/Serviço: {{produto}}
- Benefício principal: {{beneficio}}
- Público-alvo: {{publico_alvo}}
- Objetivo do post: {{objetivo_post}}
- Identidade visual: {{identidade_visual}}
- Informações obrigatórias: {{informacoes_obrigatorias}}
- Formato: {{formato_imagem}}

Crie: HEADLINE (até 8 palavras), CTA direto, COPY PUBLICITÁRIA, DESCRIÇÃO VISUAL, PALETA SUGERIDA e PROMPT BASE PARA GERAÇÃO DE IMAGEM.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  secureLog('info', 'Request received', { requestId });

  try {
    const { agentType, formData, userId } = await req.json();
    
    if (!openAIApiKey) {
      secureLog('error', 'OPENAI_API_KEY not configured', { requestId });
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const promptTemplate = agentPrompts[agentType as keyof typeof agentPrompts];
    if (!promptTemplate) {
      return new Response(
        JSON.stringify({ error: 'Invalid agent type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validationSchema = validationSchemas[agentType as keyof typeof validationSchemas];
    let validatedData;
    try {
      validatedData = validationSchema.parse(formData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Dados inválidos', details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      throw validationError;
    }

    const sanitizedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(validatedData)) {
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeInput(value);
      }
    }

    let prompt = promptTemplate;
    Object.entries(sanitizedData).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    secureLog('info', 'Calling OpenAI GPT-5 Mini', { requestId });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'Você é um especialista em marketing digital e criação de conteúdo para redes sociais. Sempre responda em português brasileiro.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      secureLog('error', 'OpenAI API error', { requestId, status: response.status });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: userRoles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
      const isAdmin = userRoles?.some(r => r.role === 'admin');

      if (!isAdmin) {
        const { data: profile } = await supabase.from('profiles').select('is_trial_active, trial_end_date, daily_credits_limit').eq('user_id', userId).single();
        
        if (profile?.is_trial_active && profile?.trial_end_date) {
          const trialEnd = new Date(profile.trial_end_date);
          if (new Date() > trialEnd) {
            const { data: subscriber } = await supabase.from('subscribers').select('subscribed').eq('user_id', userId).single();
            if (!subscriber?.subscribed) {
              return new Response(JSON.stringify({ error: 'Período de teste expirado. Assine um plano para continuar.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } else {
            const today = new Date().toISOString().split('T')[0];
            const { data: todayUsage } = await supabase.rpc('get_user_daily_credits_usage', { p_user_id: userId, p_date: today });
            if ((todayUsage || 0) >= (profile.daily_credits_limit || 10)) {
              return new Response(JSON.stringify({ error: `Limite diário atingido. Tente novamente amanhã.` }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          }
        }
      }

      await supabase.from('ai_generations').insert({ user_id: userId, agent_type: agentType, input_data: sanitizedData, generated_content: generatedContent });
      
      const today = new Date().toISOString().split('T')[0];
      const monthYear = new Date().toISOString().slice(0, 7);
      await supabase.from('user_credits_usage').insert({ user_id: userId, agent_type: agentType, credits_used: 1, date_used: today, month_year: monthYear });
    }

    return new Response(JSON.stringify({ content: generatedContent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    secureLog('error', 'Request failed', { requestId, error: error.message });
    return new Response(JSON.stringify({ error: 'Erro ao gerar conteúdo', details: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
