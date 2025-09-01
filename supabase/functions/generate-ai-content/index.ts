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
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em marketing digital e criação de conteúdo para redes sociais. Sempre responda em português brasileiro e siga exatamente o formato solicitado.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Save to database and track credits if userId is provided
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get user's subscription and current credits usage
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const [userProfile, creditsUsage, planSettings] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            *,
            subscribers!subscribers_user_id_fkey (
              subscription_tier,
              subscribed
            )
          `)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_credits_usage')
          .select('credits_used')
          .eq('user_id', userId)
          .eq('month_year', currentMonth),
        supabase
          .from('plan_settings')
          .select('plan, monthly_credits')
      ]);

      if (userProfile.error || !userProfile.data) {
        throw new Error('User not found');
      }

      const subscription = userProfile.data.subscribers?.[0];
      const userPlan = subscription?.subscribed ? (subscription.subscription_tier || 'Gratuito') : 'Gratuito';
      
      // Get plan limits
      const planConfig = planSettings.data?.find(p => p.plan === userPlan);
      const monthlyLimit = planConfig?.monthly_credits || 0;
      
      // Calculate current usage
      const currentUsage = (creditsUsage.data || []).reduce((total, usage) => total + usage.credits_used, 0);
      
      // Free users get special treatment for 'vendas' agent
      if (!subscription?.subscribed && agentType !== 'vendas') {
        throw new Error('Este agente requer um plano pago. Usuários gratuitos podem usar apenas o agente de vendas.');
      }
      
      // Check credit limits for paid users
      if (subscription?.subscribed && currentUsage >= monthlyLimit) {
        throw new Error(`Limite de créditos mensais excedido. Seu plano ${userPlan} permite ${monthlyLimit} créditos por mês.`);
      }
      
      // Record the AI generation
      await supabase
        .from('ai_generations')
        .insert({
          user_id: userId,
          agent_type: agentType,
          input_data: formData,
          generated_content: generatedContent
        });
      
      // Record credit usage (only for paid users or free users using vendas)
      if (subscription?.subscribed || agentType === 'vendas') {
        await supabase
          .from('user_credits_usage')
          .insert({
            user_id: userId,
            agent_type: agentType,
            credits_used: 1,
            month_year: currentMonth
          });
      }
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