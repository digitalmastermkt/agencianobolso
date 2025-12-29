import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
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

// Secure logging utility - removes PII
function secureLog(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) {
  const sanitizedMetadata = metadata ? {
    ...metadata,
    userId: metadata.userId ? '***' : undefined,
    email: metadata.email ? '***' : undefined,
    formData: metadata.formData ? '[REDACTED]' : undefined,
  } : {};
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizedMetadata
  };
  
  console.log(JSON.stringify(logEntry));
}

// Sanitize input to prevent prompt injection
function sanitizeInput(input: string): string {
  // Remove suspicious patterns that could be prompt injection attempts
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

// Agent prompts for different content types
const agentPrompts = {
  vendas: `Você é um especialista em vídeos de vendas curtos, inspirado no estilo do Bruno Ladeira ("Ladeirinha").

Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Localização: {{localizacao}}
- Público-alvo: {{publico_alvo}}
- Principal benefício: {{beneficio}}
- Prova social: {{prova_social}}
- Oferta: {{oferta}}
- Tom: {{tom}}

Crie um roteiro de vídeo CURTO (máximo 130 palavras) seguindo essa estrutura:
1. HOOK forte (gancho emocional)
2. DOR (problema do público)
3. TRANSFORMAÇÃO (como o produto resolve)
4. OFERTA irresistível
5. CTA direto

Use:
- Frases curtas e impactantes
- Emojis estratégicos
- Tom persuasivo e urgente
- Linguagem simples
- Foco na transformação emocional

Formato de entrega:
**ROTEIRO:**
[Texto do roteiro]

**TÍTULO SUGERIDO:**
[Título atrativo de até 60 caracteres]

**CTA PRINCIPAL:**
[Call-to-action específico]`,

  storytelling: `Você é um especialista em storytelling para vídeos, inspirado no Leandro Aguiari.

Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Localização: {{localizacao}}
- Público-alvo: {{publico_alvo}}
- Valores da marca: {{valores_marca}}
- Tom: {{tom}}

Crie um mini-roteiro com storytelling (máximo 130 palavras) que:
1. Abra com conexão emocional
2. Conte uma microhistória (problema → transformação)
3. Conecte com os valores da marca
4. Termine com CTA sutil mas direto

Use:
- Narrativa pessoal ou de cliente
- Linguagem empática
- Elementos visuais sugeridos
- Foco na jornada emocional

Formato de entrega:
**ROTEIRO:**
[Texto do roteiro storytelling]

**LEGENDA OPCIONAL:**
[Texto para acompanhar o vídeo]

**SUGESTÕES VISUAIS:**
[3-4 ideias de cenas/imagens]`,

  viral: `Você é um especialista em conteúdo viral para Reels, inspirado no Camilo Coutinho.

Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Localização: {{localizacao}}
- Público-alvo: {{publico_alvo}}
- Principal benefício: {{beneficio}}
- Oferta: {{oferta}}
- Tom: {{tom}}

Crie um roteiro viral (máximo 130 palavras) com:
1. HOOK que para o scroll
2. PROBLEMA relatable
3. BENEFÍCIO surpreendente
4. CTA que engaja

Use:
- Linguagem jovem e dinâmica
- Trends atuais
- Elementos de curiosidade
- Ritmo acelerado

Formato de entrega:
**TÍTULO:**
[Título viral de até 50 caracteres]

**ROTEIRO:**
[Texto com timing de cortes]

**SUGESTÕES DE CORTE:**
[Indicações de timing: 0-3s, 3-7s, etc.]

**HASHTAGS:**
[5-8 hashtags relevantes]`,

  interacao: `Você é um especialista em stories interativos, inspirado no Rafael Bem.

Baseado nas informações:
- Público-alvo: {{publico_alvo}}
- Produto/serviço: {{produto}}
- Ação desejada: {{acao_desejada}}

Crie uma sequência de 3-5 stories provocativos que:
1. Despertem curiosidade
2. Gerem engajamento (enquetes, perguntas)
3. Direcionem para a ação desejada

Use:
- Perguntas diretas
- Emojis estratégicos
- CTAs para caixinha, botões, swipe
- Tom provocativo mas amigável

Formato de entrega:
**STORY 1:**
[Texto + tipo de interação]

**STORY 2:**
[Texto + tipo de interação]

[Continue até 5 stories]

**RESUMO DE INTERAÇÕES:**
[Lista das interações usadas]`,

  conexao: `Você é um especialista em stories que criam vínculo emocional.

Baseado nas informações:
- Nome do negócio: {{nome_negocio}}
- Produto/serviço: {{produto}}
- Objetivo do story: {{objetivo_story}}
- Público-alvo: {{publico_alvo}}
- Tom: {{tom}}
- Link/ação: {{link_ou_acao}}

Crie até 5 cenas de stories que:
1. Mostrem bastidores autênticos
2. Criem conexão pessoal
3. Humanizem a marca
4. Direcionem sutilmente para a ação

Use:
- Linguagem pessoal
- Elementos de transparência
- CTAs suaves
- Foco na experiência

Formato de entrega:
**CENA 1:** [Tipo: foto/vídeo]
[Descrição da cena + legenda]

**CENA 2:** [Tipo: foto/vídeo]
[Descrição da cena + legenda]

[Continue até 5 cenas]

**EXTRAS/BASTIDORES:**
[Sugestões adicionais]`,

  banner: `Você é um especialista em design de banners para redes sociais.

Baseado nas informações:
- Produto/serviço: {{produto}}
- Principal benefício: {{beneficio}}
- Identidade visual: {{identidade_visual}}
- Público-alvo: {{publico_alvo}}
- Imagem do produto: {{imagem_produto}}
- Objetivo do post: {{objetivo_post}}
- Formato: {{formato_imagem}}
- Informações obrigatórias: {{informacoes_obrigatorias}}

Crie um conceito completo de banner que:
1. Comunique o benefício claramente
2. Seja visualmente atraente
3. Gere ação imediata

Formato de entrega:
**COPY PUBLICITÁRIA:**
[Texto curto e persuasivo]

**TÍTULO PRINCIPAL:**
[Título de destaque]

**DESCRIÇÃO VISUAL DO BANNER:**
[Layout, cores, elementos, disposição]

**PALETA SUGERIDA:**
[3-4 cores específicas]

**PROMPT PARA GERAÇÃO DE IMAGEM:**
[Prompt detalhado para Midjourney/DALL-E]

**CTA VISUAL:**
[Como destacar o call-to-action]`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  secureLog('info', 'Request received', { requestId, method: req.method });

  try {
    const { agentType, formData, userId } = await req.json();
    
    secureLog('info', 'Processing request', { 
      requestId, 
      agentType, 
      hasUserId: !!userId,
      fieldCount: Object.keys(formData || {}).length 
    });

    if (!lovableApiKey) {
      secureLog('error', 'LOVABLE_API_KEY not configured', { requestId });
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Validate agent type
    const promptTemplate = agentPrompts[agentType as keyof typeof agentPrompts];
    if (!promptTemplate) {
      secureLog('warn', 'Invalid agent type', { requestId, agentType });
      return new Response(
        JSON.stringify({ error: 'Invalid agent type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate input data based on agent type
    const validationSchema = validationSchemas[agentType as keyof typeof validationSchemas];
    if (!validationSchema) {
      secureLog('error', 'No validation schema for agent type', { requestId, agentType });
      return new Response(
        JSON.stringify({ error: 'Agent type not supported' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = validationSchema.parse(formData);
      secureLog('info', 'Input validation passed', { requestId, agentType });
    } catch (validationError) {
      secureLog('warn', 'Input validation failed', { 
        requestId, 
        agentType,
        errors: validationError instanceof z.ZodError ? validationError.errors.length : 'unknown'
      });
      
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            error: 'Dados inválidos', 
            details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      throw validationError;
    }

    // Sanitize all input fields to prevent prompt injection
    const sanitizedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(validatedData)) {
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeInput(value);
      }
    }
    
    secureLog('info', 'Input sanitization completed', { requestId });

    // Replace variables in prompt with sanitized data
    let prompt = promptTemplate;
    Object.entries(sanitizedData).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    secureLog('info', 'Prompt prepared', { requestId, promptLength: prompt.length });

    // Call Lovable AI Gateway
    secureLog('info', 'Calling Lovable AI Gateway', { requestId, model: 'google/gemini-2.5-flash' });
    const startTime = Date.now();
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em marketing digital e criação de conteúdo para redes sociais. Sempre responda em português brasileiro e siga exatamente o formato solicitado.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      secureLog('error', 'Lovable AI Gateway error', { 
        requestId, 
        status: response.status,
        hasErrorText: !!errorText
      });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos na sua conta Lovable.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    const duration = Date.now() - startTime;
    
    secureLog('info', 'Lovable AI response received', { 
      requestId, 
      durationMs: duration,
      contentLength: generatedContent?.length || 0
    });

    // Save to database and track credits if userId is provided
    if (userId) {
      secureLog('info', 'Processing credit check', { requestId, hasUserId: true });

      // Reutiliza o token de autorização do request original para checar assinatura
      const authHeader = req.headers.get('Authorization') || undefined;

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: authHeader
            ? { Authorization: authHeader }
            : {},
        },
      });

      // Check if user is admin - admins bypass all restrictions
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const isAdmin = !rolesError && userRoles?.some(r => r.role === 'admin');
      
      secureLog('info', 'Admin status checked', { requestId, isAdmin });

      if (isAdmin) {
        secureLog('info', 'Admin user - bypassing all restrictions', { requestId });
        // Admin users bypass all trial/subscription/credit checks
        // Just save the generation and return
        await supabase.from('ai_generations').insert({
          user_id: userId,
          agent_type: agentType,
          input_data: formData,
          output_content: generatedContent,
          credits_used: 0 // Admins don't use credits
        });

        return new Response(
          JSON.stringify({ content: generatedContent }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Buscar informações do usuário incluindo dados do trial
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, trial_start_date, trial_end_date, daily_credits_limit, is_trial_active')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        secureLog('error', 'Profile fetch error', { requestId });
        throw new Error('Erro ao verificar dados do usuário');
      }

      // Verificar se está em trial ativo
      const isTrialActive = profile?.is_trial_active && 
        profile?.trial_end_date && 
        new Date(profile.trial_end_date) > new Date();

      secureLog('info', 'Trial status checked', { 
        requestId,
        isTrialActive, 
        hasTrialEndDate: !!profile?.trial_end_date
      });

      if (isTrialActive) {
        // Verificar limite diário de créditos para usuários em trial
        const { data: dailyUsage, error: dailyUsageError } = await supabase
          .rpc('get_user_daily_credits_usage', { p_user_id: userId });

        if (dailyUsageError) {
          secureLog('error', 'Daily usage fetch error', { requestId });
          throw new Error('Erro ao verificar uso diário de créditos');
        }

        const dailyLimit = profile?.daily_credits_limit || 10;
        const dailyUsed = dailyUsage || 0;

        secureLog('info', 'Daily credits checked', { requestId, dailyUsed, dailyLimit });

        if (dailyUsed >= dailyLimit) {
          secureLog('warn', 'Daily limit exceeded', { requestId, dailyUsed, dailyLimit });
          return new Response(
            JSON.stringify({ error: `Limite diário de créditos excedido (${dailyUsed}/${dailyLimit}). Volte amanhã ou faça upgrade para acesso ilimitado.` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
      } else {
        // Verificar status da assinatura para usuários fora do trial
        const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription');
        
        if (subscriptionError) {
          secureLog('error', 'Subscription check error', { requestId });
          throw new Error('Erro ao verificar assinatura');
        }

        secureLog('info', 'Subscription checked', { 
          requestId, 
          subscribed: subscriptionData.subscribed,
          hasTier: !!subscriptionData.subscription_tier
        });

        // Verificar acesso ao agente para usuários não-trial
        if (!subscriptionData.subscribed && agentType !== 'vendas') {
          secureLog('warn', 'User blocked - no subscription for premium agent', { requestId, agentType });
          return new Response(
            JSON.stringify({ error: 'Este agente requer um plano pago. Usuários gratuitos podem usar apenas o agente de vendas.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }

        // Obter configurações do plano e uso mensal de créditos
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        const [planSettingsRes, monthlyUsageRes] = await Promise.all([
          supabase
            .from('plan_settings')
            .select('monthly_credits')
            .eq('plan', subscriptionData.subscription_tier || 'Gratuito')
            .single(),
          supabase.rpc('get_user_monthly_credits_usage', { 
            p_user_id: userId, 
            p_month_year: currentMonth 
          })
        ]);

        const planSettings = planSettingsRes.data;
        const monthlyUsage = monthlyUsageRes.data || 0;
        
        secureLog('info', 'Monthly credits checked', { 
          requestId,
          monthlyUsage,
          monthlyLimit: planSettings?.monthly_credits || 0
        });

        // Verificar se excedeu o limite mensal
        if (planSettings && monthlyUsage >= planSettings.monthly_credits) {
          secureLog('warn', 'Monthly limit exceeded', { 
            requestId,
            monthlyUsage,
            monthlyLimit: planSettings.monthly_credits
          });
          throw new Error(`Limite mensal de créditos excedido (${monthlyUsage}/${planSettings.monthly_credits}). Seu plano ${subscriptionData.subscription_tier} permite ${planSettings.monthly_credits} créditos por mês.`);
        }
      }

      // Salvar geração no banco
      const { error: insertError } = await supabase
        .from('ai_generations')
        .insert({
          user_id: userId,
          agent_type: agentType,
          input_data: formData,
          generated_content: generatedContent
        });

      if (insertError) {
        secureLog('error', 'Failed to save generation', { requestId });
        // Não bloquear a resposta por erro de salvamento
      }

      // Registrar uso de créditos
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { error: creditsError } = await supabase
        .from('user_credits_usage')
        .insert({
          user_id: userId,
          agent_type: agentType,
          credits_used: 1,
          month_year: currentMonth,
          date_used: currentDate
        });

      if (creditsError) {
        secureLog('error', 'Failed to register credits', { requestId });
        // Não bloquear a resposta por erro de registro
      }

      secureLog('info', 'Generation saved and credits registered', { requestId });
    }

    secureLog('info', 'Request completed successfully', { requestId });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: generatedContent,
        agentType 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    secureLog('error', 'Request failed', { 
      requestId,
      errorMessage: error.message,
      errorType: error.constructor.name
    });
    
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