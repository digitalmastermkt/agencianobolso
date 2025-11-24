import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  try {
    const { agentType, formData, userId } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get the appropriate prompt template
    const promptTemplate = agentPrompts[agentType as keyof typeof agentPrompts];
    if (!promptTemplate) {
      return new Response(
        JSON.stringify({ error: 'Invalid agent type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Replace variables in prompt with form data
    let prompt = promptTemplate;
    Object.entries(formData).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em marketing digital e criação de conteúdo para redes sociais. Sempre responda em português brasileiro e siga exatamente o formato solicitado.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Save to database and track credits if userId is provided
    if (userId) {
      console.log(`🔍 Verificando créditos para usuário: ${userId}`);
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Buscar informações do usuário incluindo dados do trial
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, trial_start_date, trial_end_date, daily_credits_limit, is_trial_active')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        throw new Error('Erro ao verificar dados do usuário');
      }

      // Verificar se está em trial ativo
      const isTrialActive = profile?.is_trial_active && 
        profile?.trial_end_date && 
        new Date(profile.trial_end_date) > new Date();

      console.log('🎯 Status do trial:', { 
        isTrialActive, 
        trialEnd: profile?.trial_end_date,
        dailyLimit: profile?.daily_credits_limit 
      });

      if (isTrialActive) {
        // Verificar limite diário de créditos para usuários em trial
        const { data: dailyUsage, error: dailyUsageError } = await supabase
          .rpc('get_user_daily_credits_usage', { p_user_id: userId });

        if (dailyUsageError) {
          console.error('❌ Erro ao buscar uso diário:', dailyUsageError);
          throw new Error('Erro ao verificar uso diário de créditos');
        }

        const dailyLimit = profile?.daily_credits_limit || 10;
        const dailyUsed = dailyUsage || 0;

        console.log(`📊 Trial - Créditos diários: ${dailyUsed}/${dailyLimit}`);

        if (dailyUsed >= dailyLimit) {
          console.log('🚫 Limite diário de créditos excedido no trial');
          throw new Error(`Limite diário de créditos excedido (${dailyUsed}/${dailyLimit}). Volte amanhã ou faça upgrade para acesso ilimitado.`);
        }
      } else {
        // Verificar status da assinatura para usuários fora do trial
        const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription');
        
        if (subscriptionError) {
          console.error('❌ Erro ao verificar assinatura:', subscriptionError);
          throw new Error('Erro ao verificar assinatura');
        }

        console.log('📊 Status da assinatura:', subscriptionData);

        // Verificar acesso ao agente para usuários não-trial
        if (!subscriptionData.subscribed && agentType !== 'vendas') {
          throw new Error('Este agente requer um plano pago. Usuários gratuitos podem usar apenas o agente de vendas.');
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
        
        console.log(`📈 Plano: ${subscriptionData.subscription_tier}`);
        console.log(`💳 Créditos mensais permitidos: ${planSettings?.monthly_credits || 0}`);
        console.log(`🔥 Créditos usados este mês: ${monthlyUsage}`);

        // Verificar se excedeu o limite mensal
        if (planSettings && monthlyUsage >= planSettings.monthly_credits) {
          console.log('🚫 Limite mensal de créditos excedido');
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
        console.error('❌ Erro ao salvar geração:', insertError);
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
        console.error('❌ Erro ao registrar créditos:', creditsError);
        // Não bloquear a resposta por erro de registro
      }

      console.log('✅ Geração salva e créditos registrados com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: generatedContent,
        agentType 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-content function:', error);
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