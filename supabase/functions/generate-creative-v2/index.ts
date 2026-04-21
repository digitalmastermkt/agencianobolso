// =============================================================================
// generate-creative-v2 — ÚNICA FUNÇÃO DE GERAÇÃO DE CRIATIVOS
// -----------------------------------------------------------------------------
// Esta é a única Edge Function de geração de criativos do projeto. Substitui e
// consolida as funções legadas (deletadas em 2026-04):
//   - generate_creatives
//   - generate-banner-images
//   - generate-personalized-banner
// Motivo da consolidação: eliminar duplicação de lógica, centralizar controle
// de créditos, retries e progressão sequencial em um único pipeline.
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to upload base64 image to Supabase Storage
async function uploadToStorage(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  base64Image: string,
  index: number
): Promise<string | null> {
  try {
    // Extract base64 data (remove data:image/... prefix if present)
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;
    
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}-${index}.png`;
    
    // Upload to storage
    const { error } = await supabaseClient.storage
      .from('generated-creatives')
      .upload(filename, bytes, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      console.error('[generate-creative-v2] Storage upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('generated-creatives')
      .getPublicUrl(filename);
    
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('[generate-creative-v2] Error uploading to storage:', err);
    return null;
  }
}

interface ArtDirectorDecision {
  scene_prompt: string;
  style: "clean" | "dynamic" | "premium" | "festive";
  template: "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda";
  layout_style: "classic" | "diagonal" | "centered_bold" | "inverted" | "side_text";
  protagonist: "text" | "person" | "balanced";
  pose_suggestion?: string;
  creative_elements?: string;
  atmosphere?: string;
  suggested_effects?: string;
  text_colors?: {
    headline: string;
    subheadline: string;
    cta_bg: string;
    cta_text: string;
  };
}

interface BrandIdentity {
  colors?: string[];
  typography?: {
    primaryFont?: string;
    secondaryFont?: string;
    style?: string;
  };
  visualStyle?: string;
  mood?: string;
  recurringElements?: string[];
}

// ==========================================
// BIBLIOTECA DE PROMPTS PROFISSIONAIS POR CONTEXTO
// ==========================================
const PROFESSIONAL_PHOTO_PROMPTS: Record<string, string> = {
  executivo: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em estúdio profissional, com sorriso sutil e postura de liderança. Cabelo polido e alinhado, mantendo a cor natural. Vestuário: terno/blazer escuro com camisa clara; gravata opcional. Acessórios/insígnias: relógio discreto ou bloco de notas genérico (sem marcas). Cenário ao fundo: sala de reuniões moderna desfocada com bokeh. Iluminação: janela lateral suave com preenchimento discreto e luz de recorte sutil no cabelo. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  marketing: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em estúdio profissional, com sorriso criativo e olhar estratégico. Cabelo alinhado e estilizado de forma discreta, mantendo a cor natural. Vestuário: blazer casual com camisa básica. Acessórios/insígnias: tablet exibindo gráfico genérico sem texto legível (sem marcas). Cenário ao fundo: espaço criativo com post-its e telas desfocados com bokeh. Iluminação: mista (janela + letreiros suaves) balanceada, com luz de recorte sutil no cabelo. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  saude: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em estúdio profissional, com postura segura e acolhedora. Cabelo bem penteado, mechas controladas; manter a cor natural. Vestuário: jaleco branco impecável. Acessórios/insígnias: estetoscópio genérico no pescoço, sem marcas. Cenário ao fundo: sala clínica contemporânea desfocada com bokeh. Iluminação: janela lateral suave com preenchimento discreto e luz de recorte sutil no cabelo. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  tech: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em ambiente tech moderno, com olhar visionário e postura inovadora. Cabelo estilizado moderno, mantendo a cor natural. Vestuário: suéter premium ou hoodie sofisticado em tons neutros escuros. Acessórios: laptop ou smartphone com tela genérica sem marcas. Cenário ao fundo: ambiente futurista com luzes neon suaves, HUD elements desfocados, estética tech com bokeh. Iluminação: luzes RGB sutis combinadas com luz natural, efeito dramático moderno. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  educacao: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em ambiente educacional, com expressão acolhedora e sorriso de mentor. Cabelo arrumado e profissional, mantendo a cor natural. Vestuário: blazer casual com camisa ou suéter elegante. Acessórios: livros empilhados ou óculos discretos (opcionais). Cenário ao fundo: biblioteca ou sala de aula moderna desfocada com bokeh, prateleiras de livros. Iluminação: janela lateral suave, ambiente acolhedor e convidativo. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  vendas: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em ambiente comercial dinâmico, com sorriso confiante e energia persuasiva. Cabelo impecável e estilizado, mantendo a cor natural. Vestuário: terno moderno bem cortado ou blazer ajustado com camisa sem gravata. Acessórios: smartphone em mãos (opcional), postura de ação. Cenário ao fundo: ambiente comercial moderno, escritório dinâmico desfocado com bokeh. Iluminação: luz forte e vibrante, energia alta, atmosfera de sucesso. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  juridico: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em escritório elegante, com expressão séria e confiante, postura de autoridade. Cabelo formal e polido, mantendo a cor natural. Vestuário: terno formal escuro impecável com camisa branca, gravata opcional clássica. Acessórios: caneta ou pasta de documentos em couro (sem marcas). Cenário ao fundo: escritório jurídico elegante, estantes de livros de direito desfocadas com bokeh. Iluminação: clássica de estúdio, sofisticada e imponente. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  fitness: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em ambiente fitness/academia, com expressão motivadora e energia atlética. Cabelo dinâmico e esportivo, mantendo a cor natural. Vestuário: roupa esportiva profissional (camiseta técnica ou regata de qualidade). Acessórios: cronômetro ou garrafa de água (opcionais, sem marcas). Cenário ao fundo: academia moderna ou espaço fitness desfocado com bokeh, equipamentos sutis. Iluminação: luz energética, contraste dramático, atmosfera de motivação. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  imobiliario: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em ambiente sofisticado, com sorriso acolhedor e postura de consultor. Cabelo elegante e bem cuidado, mantendo a cor natural. Vestuário: visual business casual elegante, blazer moderno. Acessórios: prancheta ou chaves decorativas (sem marcas). Cenário ao fundo: imóvel moderno, sala ampla ou vista de cidade desfocada com bokeh. Iluminação: luz natural abundante, atmosfera de sucesso e aspiração. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  gastronomia: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em ambiente de cozinha profissional, com expressão apaixonada e sorriso caloroso. Cabelo arrumado com touca de chef ou penteado limpo, mantendo a cor natural. Vestuário: dólmã de chef branco impecável. Acessórios: utensílios de cozinha genéricos (sem marcas). Cenário ao fundo: cozinha profissional moderna desfocada com bokeh, ambiente gastronômico. Iluminação: luz quente e acolhedora, atmosfera de restaurante premium. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  beleza: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em ambiente de beleza/salão, com expressão sofisticada e sorriso elegante. Cabelo perfeito e estilizado profissionalmente, mantendo a cor natural. Vestuário: roupa elegante e moderna, visual fashion. Acessórios: pincéis de maquiagem ou tesoura estilista (opcionais, sem marcas). Cenário ao fundo: salão de beleza moderno ou estúdio fashion desfocado com bokeh. Iluminação: ring light suave, beleza cinematográfica, pele impecável. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`,
  
  geral: `Use a imagem enviada como base e preserve a identidade (traços, proporções e tom de pele). Gere um retrato meio corpo em estúdio profissional neutro, com expressão confiante e sorriso natural. Cabelo bem cuidado e arrumado, mantendo a cor natural. Vestuário: business casual elegante (blazer ou camisa de qualidade). Cenário ao fundo: estúdio fotográfico com fundo gradiente suave em tons neutros com bokeh. Iluminação: setup profissional de estúdio com janela lateral suave, preenchimento discreto e luz de recorte sutil no cabelo. Lente 85mm f/1.8, nitidez natural, pele realista sem 'plástico'. Evitar: distorções, mãos extras, texto legível/logos de marcas, artefatos. Foto profissional.`
};

// Detectar contexto profissional baseado no texto
function detectProfessionalContext(context: string, headline: string): string {
  const text = `${context} ${headline}`.toLowerCase();
  
  // Executivo/Corporativo
  if (text.match(/ceo|diretor|executivo|liderança|negócio|empresário|gestão|board|c-level|presidente|fundador|sócio/)) {
    return 'executivo';
  }
  
  // Marketing/Criativo
  if (text.match(/marketing|digital|criativo|agência|redes sociais|conteúdo|branding|social media|tráfego|growth|copywriter/)) {
    return 'marketing';
  }
  
  // Saúde
  if (text.match(/médico|médica|saúde|clínica|hospital|dentista|enfermeiro|nutrição|fisio|psicólogo|terapeuta|wellness|bem-estar/)) {
    return 'saude';
  }
  
  // Tech
  if (text.match(/tech|tecnologia|ia|inteligência artificial|programação|software|startup|dev|developer|código|programador|dados|data/)) {
    return 'tech';
  }
  
  // Educação
  if (text.match(/professor|educação|curso|mentor|treinamento|ensino|aula|coach|mentoria|capacitação|formação|workshop/)) {
    return 'educacao';
  }
  
  // Vendas
  if (text.match(/vendas|comercial|representante|closer|prospecção|cliente|negociação|corretor|consultor de vendas|inside sales/)) {
    return 'vendas';
  }
  
  // Jurídico
  if (text.match(/advogado|advocacia|jurídico|direito|justiça|tribunal|lei|contrato|compliance|legal/)) {
    return 'juridico';
  }
  
  // Fitness
  if (text.match(/fitness|personal|academia|treino|esporte|atleta|musculação|crossfit|yoga|pilates|corrida/)) {
    return 'fitness';
  }
  
  // Imobiliário
  if (text.match(/imobiliário|corretor|imóvel|apartamento|casa|venda de imóvel|locação|construtora|incorporadora/)) {
    return 'imobiliario';
  }
  
  // Gastronomia
  if (text.match(/chef|cozinha|restaurante|gastronomia|culinária|comida|food|confeitaria|padaria/)) {
    return 'gastronomia';
  }
  
  // Beleza
  if (text.match(/beleza|estética|maquiagem|cabelo|salão|beauty|skincare|spa|nail|manicure|cabeleireiro/)) {
    return 'beleza';
  }
  
  return 'geral'; // Business casual neutro
}

// Gerar foto profissional otimizada
async function generateProfessionalPhoto(
  originalPhotoBase64: string,
  professionalContext: string,
  apiKey: string
): Promise<string | null> {
  try {
    const prompt = PROFESSIONAL_PHOTO_PROMPTS[professionalContext] || PROFESSIONAL_PHOTO_PROMPTS.geral;
    
    console.log(`[generate-creative-v2] Generating professional photo with context: ${professionalContext}`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: originalPhotoBase64 } }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-creative-v2] Professional photo generation error:", errText);
      return null;
    }

    const data = await response.json();
    const enhancedPhotoBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (enhancedPhotoBase64) {
      console.log("[generate-creative-v2] Professional photo generated successfully");
      return enhancedPhotoBase64;
    }
    
    console.warn("[generate-creative-v2] Professional photo generation returned no image");
    return null;
  } catch (err) {
    console.error("[generate-creative-v2] Error generating professional photo:", err);
    return null;
  }
}

// ==========================================
// DIRETOR DE ARTE SÊNIOR - FILOSOFIA PROFISSIONAL
// ==========================================
const artDirectorSystemPrompt = `Você é um DIRETOR DE ARTE SÊNIOR com mais de 20 anos de experiência em branding, publicidade e criação de criativos para empresas de tecnologia, estratégia e educação premium.

Seu objetivo é criar artes visuais PROFISSIONAIS, COERENTES com a identidade visual da marca, respeitando o contexto da mensagem, sem engessar o design.

=== PRINCÍPIOS FUNDAMENTAIS (OBRIGATÓRIOS) ===
1. IDENTIDADE VISUAL É FIXA - Fundo e cenário são VARIÁVEIS
2. O fundo deve REFORÇAR o contexto da mensagem, NUNCA COMPETIR com ela
3. A marca deve ser RECONHECIDA mesmo com fundos diferentes
4. APENAS UM PROTAGONISTA por arte (texto OU pessoa OU ideia visual)

=== REGRAS DE IDENTIDADE VISUAL (NÃO ALTERAR) ===
Paleta de cores:
- Use EXCLUSIVAMENTE as cores institucionais da marca
- Toda arte deve conter NO MÍNIMO 2 cores institucionais
- Tons neutros de apoio são permitidos

Tipografia:
- Respeite a hierarquia por peso, tamanho, cor e espaçamento
- NUNCA trocar fonte ou cores para "combinar com o fundo"

Linguagem gráfica:
- Mantenha padrão recorrente de elementos visuais entre as artes
- Shapes, setas, linhas, margens e ritmo visual devem ser consistentes

=== FOCO PRINCIPAL: ARTES QUE VENDEM ===
- Criativos que CONVERTEM, não que ganham prêmios de design
- Hierarquia visual clara: mensagem principal DESTACA
- CTA proeminente e clicável
- Pessoa cria CONEXÃO HUMANA e CONFIANÇA
- Cores que CHAMAM ATENÇÃO sem ser amadoras

=== DEDUÇÃO AUTOMÁTICA DE ESTILO ===
Analise o contexto e DEDUZA o estilo apropriado:
- Palavras como "black friday, promoção, desconto, urgente, últimos" → style: "dynamic" (urgência, energia)
- Palavras como "lançamento, novo, exclusivo, premium" → style: "premium" (sofisticação)
- Palavras como "natal, ano novo, aniversário, festa, celebrar" → style: "festive" (celebração)
- Palavras como "institucional, empresa, profissional, corporativo" → style: "clean" (elegância)
- Se não identificar padrão → style: "dynamic" (energia comercial)

=== LAYOUTS VARIADOS (NÃO SEMPRE O MESMO!) ===
Escolha layouts diferentes para cada arte:
- "classic": Título em cima, subtítulo abaixo, CTA embaixo (padrão)
- "diagonal": Título em diagonal, CTA flutuante, composição dinâmica
- "centered_bold": Título GIGANTE centralizado, texto mínimo, impacto máximo
- "inverted": Título embaixo, imagem domina, CTA no topo
- "side_text": Texto ao lado da pessoa (não em cima), CTA lateral

=== REGRA DO PROTAGONISTA (CRÍTICO) ===
Em cada arte, escolha apenas UM protagonista:
- "text": Texto é o destaque principal, pessoa apoia sutilmente
- "person": Pessoa é o destaque, texto é secundário/menor
- "balanced": Equilíbrio entre texto e pessoa (mais difícil de executar bem)

=== CORES DE TEXTO VARIADAS ===
NÃO use sempre branco! Sugira cores que combinam com a marca:
- Pode usar cores da marca no headline
- CTA com cor contrastante (não sempre a primária)
- Subheadline pode ter cor diferente do headline
- GARANTA legibilidade com sombras/outlines quando necessário

=== CONTEXTO VISUAL (VARIÁVEL) ===
Escolha o fundo de acordo com o contexto do conteúdo:
- Tecnologia / IA → dashboards, HUDs, circuitos, interfaces futuristas
- Execução / ação → ambientes corporativos, luz forte, foco
- Clareza / decisão → fundos limpos, gradientes suaves
- Autoridade → fundo escuro, iluminação premium
- Educacional → fundo neutro, leitura fácil
- Humano / bastidores → fotografia real ou cenário orgânico

=== ELEMENTOS CRIATIVOS POR CONTEXTO ===
- Promoção/Desconto → etiquetas de preço, raios, urgência visual, explosão
- Lançamento → holofotes, partículas brilhantes, efeito reveal
- Celebração → confetes, balões, fogos, elementos festivos
- Institucional → linhas geométricas, vidro, cidade moderna

RESPONDA APENAS com JSON válido:
{
  "scene_prompt": "descrição DETALHADA do cenário comercial em INGLÊS - focado em VENDER",
  "headline": "texto principal CURTO e IMPACTANTE deduzido do contexto (máx 50 chars)",
  "subheadline": "texto secundário que complementa o headline (máx 80 chars)",
  "cta": "chamada para ação clara e curta (máx 20 chars)",
  "style": "clean" | "dynamic" | "premium" | "festive",
  "template": "pessoa_centro" | "pessoa_direita" | "pessoa_esquerda",
  "layout_style": "classic" | "diagonal" | "centered_bold" | "inverted" | "side_text",
  "protagonist": "text" | "person" | "balanced",
  "pose_suggestion": "pose que VENDE - confiança, ação, engajamento (em INGLÊS)",
  "creative_elements": "elementos visuais que CONVERTEM (em INGLÊS)",
  "atmosphere": "atmosfera comercial - energia, confiança, urgência (em INGLÊS)",
  "suggested_effects": "efeitos visuais profissionais (em INGLÊS)",
  "text_colors": {
    "headline": "cor hex sugerida para headline baseada na marca",
    "subheadline": "cor hex para subheadline",
    "cta_bg": "cor hex do fundo do CTA",
    "cta_text": "cor hex do texto do CTA"
  }
}`;

const normalizeDecision = (raw: Partial<ArtDirectorDecision>): ArtDirectorDecision => {
  const decision: ArtDirectorDecision = {
    scene_prompt: raw?.scene_prompt ?? "Modern commercial environment with professional lighting, sales-focused atmosphere",
    style: raw?.style ?? "dynamic",
    template: raw?.template ?? "pessoa_centro",
    layout_style: raw?.layout_style ?? "classic",
    protagonist: raw?.protagonist ?? "balanced",
    pose_suggestion: raw?.pose_suggestion ?? "confident engaging pose, direct eye contact, professional smile, ready for action",
    creative_elements: raw?.creative_elements ?? "subtle energy lines, professional lighting, commercial appeal",
    atmosphere: raw?.atmosphere ?? "energetic, trustworthy, conversion-focused lighting",
    suggested_effects: raw?.suggested_effects ?? "subtle lens flare, professional depth of field",
    text_colors: raw?.text_colors ?? {
      headline: "#FFFFFF",
      subheadline: "#F1F5F9",
      cta_bg: "#FFFFFF",
      cta_text: "#0F172A"
    },
  };

  if (!(["pessoa_direita", "pessoa_centro", "pessoa_esquerda"] as const).includes(decision.template)) {
    decision.template = "pessoa_centro";
  }
  if (!(["clean", "dynamic", "premium", "festive"] as const).includes(decision.style)) {
    decision.style = "dynamic";
  }
  if (!(["classic", "diagonal", "centered_bold", "inverted", "side_text"] as const).includes(decision.layout_style)) {
    decision.layout_style = "classic";
  }
  if (!(["text", "person", "balanced"] as const).includes(decision.protagonist)) {
    decision.protagonist = "balanced";
  }

  return decision;
};

// Auto-detect style from context
const detectStyleFromContext = (context: string): string => {
  const contextLower = context.toLowerCase();
  
  if (contextLower.match(/black friday|promoção|desconto|urgente|últimos|oferta|liquidação/)) {
    return "dynamic";
  }
  if (contextLower.match(/lançamento|novo|exclusivo|premium|luxo|sofisticado/)) {
    return "premium";
  }
  if (contextLower.match(/natal|ano novo|aniversário|festa|celebrar|parabéns|réveillon/)) {
    return "festive";
  }
  if (contextLower.match(/institucional|empresa|profissional|corporativo|confiança/)) {
    return "clean";
  }
  
  return "dynamic"; // Default to commercial energy
};

// Get creative elements based on context - AUTO-DETECTED
const getContextualElements = (context: string): string => {
  const contextLower = context.toLowerCase();
  
  if (contextLower.match(/black friday|promoção|desconto/)) {
    return "Explosive burst effects, floating bold price tags with dramatic shadows, colorful confetti, bold red/black/yellow accents, urgency lightning bolts, diagonal dynamic stripes, sale badges, speed lines for action";
  }
  if (contextLower.match(/lançamento|novidade|novo/)) {
    return "Dramatic spotlight effects, stage lighting rays, sparkles and glitter particles, premium metallic gold/silver accents, holographic elements, futuristic floating particles, reveal moment energy";
  }
  if (contextLower.match(/aniversário|parabéns/)) {
    return "Colorful balloons bursting upward, confetti explosion, party streamers, birthday elements, festive bokeh lights, joyful atmosphere, celebration ribbons";
  }
  if (contextLower.match(/ano novo|réveillon|2025|2026/)) {
    return "Spectacular fireworks in night sky, champagne bubbles and glasses, elegant clock elements, starry backdrop, golden sparkles rain, celebration particles, silver and gold palette";
  }
  if (contextLower.match(/natal|feliz natal/)) {
    return "Gentle snow falling, Christmas decorations, warm red and gold, cozy lighting glow, gift boxes with ribbons, twinkling fairy lights, winter magic";
  }
  if (contextLower.match(/corporativo|institucional|empresa/)) {
    return "Sleek geometric patterns, glass and steel reflections, modern city skyline, clean gradient backgrounds, professional blue tones, subtle grid patterns";
  }
  if (contextLower.match(/motivacional|sucesso|conquista/)) {
    return "Epic horizon vista, golden hour light rays, inspirational atmosphere, achievement symbols, warm gradient sky, triumphant energy";
  }
  
  return "Dynamic commercial elements, professional gradient overlays, energy lines, subtle particle effects matching brand colors";
};

// Get layout instructions based on layout_style
const getLayoutInstructions = (layoutStyle: string, personPosition: string): string => {
  const layouts: Record<string, string> = {
    'classic': `
CLASSIC COMMERCIAL LAYOUT:
- Headline: Upper third, large and bold
- Subheadline: Below headline, smaller
- CTA: Bottom area, prominent button
- Person: ${personPosition}
- Clean hierarchy, proven conversion pattern`,
    'diagonal': `
DYNAMIC DIAGONAL LAYOUT:
- Headline: Positioned at diagonal angle (15-20 degrees), creates movement
- Subheadline: Following diagonal flow, offset from headline
- CTA: Floating position, not aligned with text
- Person: ${personPosition}, dynamic pose matching diagonal energy
- Creates visual tension and excitement`,
    'centered_bold': `
CENTERED IMPACT LAYOUT:
- Headline: GIANT centered text, dominates the frame
- Subheadline: Minimal, small beneath headline
- CTA: Centered below, secondary visual weight
- Person: ${personPosition}, supporting the bold message
- Maximum impact, minimal distraction`,
    'inverted': `
INVERTED LAYOUT (TEXT BELOW):
- Headline: Bottom third of image, large
- Subheadline: Just above headline
- CTA: Top area of image, breaking convention
- Person: ${personPosition}, upper portion of frame
- Unexpected pattern draws attention`,
    'side_text': `
SIDE TEXT LAYOUT:
- Headline: Positioned beside the person, not over
- Subheadline: Same side as headline, vertical flow
- CTA: Same side, completing the vertical text block
- Person: ${personPosition}, occupies opposite side
- Clean separation between text and person`,
  };
  
  return layouts[layoutStyle] || layouts['classic'];
};

// Get protagonist instructions
const getProtagonistInstructions = (protagonist: string): string => {
  const instructions: Record<string, string> = {
    'text': `
PROTAGONIST: TEXT (Texto é o destaque)
- Headline deve ser ENORME e dominar a composição
- Pessoa em segundo plano, menor, mais sutil, semi-transparente ou sombreada
- CTA muito proeminente
- A mensagem é o HERÓI, pessoa é apoio`,
    'person': `
PROTAGONIST: PERSON (Pessoa é o destaque)
- Pessoa deve DOMINAR a composição (60-70% do frame)
- Headline menor, discreto, elegante
- Subheadline mínimo ou ausente visualmente
- CTA secundário mas presente
- A CONEXÃO HUMANA é o foco`,
    'balanced': `
PROTAGONIST: BALANCED (Equilíbrio)
- Pessoa e texto com peso visual equilibrado
- Headline médio, legível, não dominante
- Pessoa com boa presença mas não dominante
- Composição harmoniosa, profissional
- CUIDADO: mais difícil de executar bem`,
  };
  
  return instructions[protagonist] || instructions['balanced'];
};

// Get mode-specific instructions
const getModeInstructions = (mode: string): { focus: string; composition: string } => {
  switch (mode) {
    case 'product':
      return {
        focus: `
MODO: PRODUTO (Product Hero Shot)
- PRODUTO é o PROTAGONISTA ABSOLUTO da arte
- Produto deve ocupar 50-70% do frame, centralizado ou em posição de destaque
- Iluminação profissional de estúdio focada no produto
- Fundo limpo ou com gradiente sutil usando cores da marca
- Sem pessoas - apenas o produto como estrela`,
        composition: `
COMPOSIÇÃO PARA PRODUTO:
- Produto em destaque central ou ligeiramente deslocado para criar interesse
- Texto posicionado ao redor do produto, NUNCA sobreposto
- Sombra suave e realista sob o produto
- Reflexos sutis para profundidade
- Elementos gráficos da marca ao redor`
      };
    case 'text-only':
      return {
        focus: `
MODO: TEXTO (Typography-Driven Design)
- TIPOGRAFIA é o PROTAGONISTA ABSOLUTO
- NENHUMA pessoa ou produto na arte
- Design 100% gráfico, focado na mensagem
- Use formas geométricas, gradientes e elementos abstratos
- Cores da marca como elementos visuais principais`,
        composition: `
COMPOSIÇÃO PARA TEXTO:
- Headline GIGANTE como elemento visual principal
- Fundo abstrato ou gradiente usando cores da marca
- Elementos gráficos sutis (linhas, formas, partículas)
- Alta legibilidade é prioridade máxima
- Design moderno, limpo, impactante`
      };
    default: // 'person'
      return {
        focus: `
MODO: PESSOA (Human Connection)
- PESSOA é o elemento de conexão humana
- Integrar pessoa naturalmente ao cenário
- Expressão e pose profissionais`,
        composition: `
COMPOSIÇÃO COM PESSOA:
- Pessoa posicionada estrategicamente no frame
- Texto complementando, não competindo
- Integração cromática natural`
      };
  }
};

// Master user email - sourced from MASTER_USER_EMAIL secret (no hardcoding).
const MASTER_USER_EMAIL = (Deno.env.get("MASTER_USER_EMAIL") ?? "").toLowerCase();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (data: Record<string, unknown>, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  // Credit cost for art generation
  const CREDITS_COST = 1;
  let transactionId: string | null = null;
  let userId = "anonymous";
  let userEmail: string | null = null;
  let isMasterUser = false;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[generate-creative-v2] LOVABLE_API_KEY not configured");
      return respond({ success: false, error: "LOVABLE_API_KEY não configurada" }, 500);
    }

    // Create Supabase client for storage and credits operations
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
        console.log("[generate-creative-v2] Could not get user from token, using anonymous");
      }
    }

    // ============ CREDIT VERIFICATION AND DEBIT ============
    // Skip credit check for master users and anonymous users
    if (userId !== "anonymous" && !isMasterUser && supabaseClient) {
      console.log(`[generate-creative-v2] Checking credits for user ${userId}, cost: ${CREDITS_COST}`);
      
      const { data: debitResult, error: debitError } = await supabaseClient
        .rpc('debit_user_credits', {
          p_user_id: userId,
          p_amount: CREDITS_COST,
          p_action_type: 'generate_art',
          p_description: 'Geração de arte criativa'
        });

      if (debitError) {
        console.error("[generate-creative-v2] Credit debit error:", debitError);
        return respond({
          success: false,
          error: "Erro ao verificar créditos. Tente novamente.",
          credits_error: true
        }, 500);
      }

      if (!debitResult?.success) {
        console.log("[generate-creative-v2] Insufficient credits:", debitResult);
        return respond({
          success: false,
          error: debitResult?.error || "Créditos insuficientes. Adquira mais créditos para continuar.",
          credits_required: CREDITS_COST,
          credits_available: debitResult?.balance || 0,
          insufficient_credits: true
        }, 402);
      }

      transactionId = debitResult.transaction_id;
      console.log(`[generate-creative-v2] Credits debited successfully. Transaction: ${transactionId}, Balance after: ${debitResult.balance_after}`);
    } else if (isMasterUser) {
      console.log("[generate-creative-v2] Master user detected - bypassing credit check");
    }

    const { 
      context,
      headline,
      subheadline,
      cta,
      // New fields
      artText,
      designOrientation,
      creativeStyle = 'brand', // 'brand' | 'generic'
      referenceImages: rawReferenceImages,
      // Legacy fields
      brandProfile, 
      personImageBase64, 
      productImageBase64,
      generationMode = 'person', // 'person' | 'product' | 'text-only'
      format, 
      variationsCount = 1,
      logoUrl,
      brandIdentity,
      renderTextOnImage = false,
      theme, // optional: 'promocao' | 'lancamento' | 'data_comemorativa' | 'institucional' | 'servico'
      creativeType, // optional: 'trafego_pago' | 'live_evento' | 'data_comemorativa' | 'lancamento' | 'institucional' | 'aviso_comunicado'
    } = await req.json();
    
    console.log("[generate-creative-v2] renderTextOnImage:", renderTextOnImage);
    console.log("[generate-creative-v2] creativeStyle:", creativeStyle);
    console.log("[generate-creative-v2] artText:", artText?.substring(0, 100));

    // Reference images (up to 4) - support both typed objects and plain strings
    interface TypedReference { url: string; type: 'person' | 'product' | 'scene' | 'reference'; }
    const referenceImages: TypedReference[] = Array.isArray(rawReferenceImages)
      ? rawReferenceImages
          .filter((img: unknown) => img !== null && img !== undefined)
          .map((img: unknown) => {
            if (typeof img === 'string') return { url: img, type: 'reference' as const };
            if (typeof img === 'object' && img !== null && 'url' in img) {
              const obj = img as { url: string; type?: string };
              const validTypes = ['person', 'product', 'scene', 'reference'];
              return { url: obj.url, type: (validTypes.includes(obj.type || '') ? obj.type : 'reference') as TypedReference['type'] };
            }
            return null;
          })
          .filter((x: TypedReference | null): x is TypedReference => x !== null)
          .slice(0, 4)
      : [];
    
    // Categorize references by type
    const personRefs = referenceImages.filter(r => r.type === 'person');
    const productRefs = referenceImages.filter(r => r.type === 'product');
    const sceneRefs = referenceImages.filter(r => r.type === 'scene');
    const genericRefs = referenceImages.filter(r => r.type === 'reference');
    
    console.log("[generate-creative-v2] Reference images count:", referenceImages.length);
    console.log("[generate-creative-v2] By type - Person:", personRefs.length, "Product:", productRefs.length, "Scene:", sceneRefs.length, "Generic:", genericRefs.length);

    // Use artText as primary, fallback to headline, then context
    const effectiveArtText = (artText && typeof artText === 'string' && artText.trim().length > 0) 
      ? artText.trim() 
      : (headline && typeof headline === 'string' && headline.trim().length > 0)
        ? headline.trim()
        : '';

    if (!effectiveArtText) {
      return respond({ success: false, error: "O texto da arte é obrigatório." }, 400);
    }

    // Effective headline: use provided headline or extract from artText (will be done by AI)
    const effectiveHeadline = (headline && typeof headline === 'string' && headline.trim().length > 0)
      ? headline.trim()
      : effectiveArtText.substring(0, 50);

    // Context for scene understanding
    const effectiveContext = (context && typeof context === 'string' && context.trim().length > 0) 
      ? context.trim() 
      : effectiveArtText;

    if (!format || typeof format !== "string") {
      return respond({ success: false, error: "O campo format é obrigatório." }, 400);
    }

    // Determine effective mode based on typed reference images
    let effectiveMode = generationMode;
    if (personRefs.length > 0) {
      effectiveMode = 'person'; // Has person photos
    } else if (productRefs.length > 0 && personRefs.length === 0) {
      effectiveMode = 'product'; // Product only
    } else if (referenceImages.length > 0 && generationMode === 'text-only') {
      effectiveMode = 'person'; // Has reference images, default to person mode
    }
    if (referenceImages.length === 0 && !personImageBase64 && !productImageBase64) {
      effectiveMode = 'text-only'; // No images at all
    }

    console.log("[generate-creative-v2] Effective mode:", effectiveMode);
    console.log("[generate-creative-v2] Effective context:", effectiveContext);

    // Sanitize inputs
    const sanitizedBrandProfile = {
      name: brandProfile?.name || "",
      colors: Array.isArray(brandProfile?.colors) ? brandProfile.colors.slice(0, 5) : [],
      mood: brandProfile?.mood || "",
      visual_style: brandProfile?.visual_style || "",
    };

    const sanitizedBrandIdentity: BrandIdentity = {
      colors: Array.isArray(brandIdentity?.colors) ? brandIdentity.colors.slice(0, 5) : sanitizedBrandProfile.colors,
      typography: brandIdentity?.typography || {},
      visualStyle: brandIdentity?.visualStyle || sanitizedBrandProfile.visual_style,
      mood: brandIdentity?.mood || sanitizedBrandProfile.mood,
      recurringElements: Array.isArray(brandIdentity?.recurringElements) ? brandIdentity.recurringElements : [],
    };

    // Auto-detect style from context
    const detectedStyle = detectStyleFromContext(effectiveContext);
    console.log("[generate-creative-v2] Auto-detected style from context:", detectedStyle);

    // Auto-detect professional context for photo optimization
    const professionalContext = detectProfessionalContext(effectiveContext, effectiveHeadline);
    console.log("[generate-creative-v2] Detected professional context:", professionalContext);

    // Determine if brand identity should be used
    const useBrandIdentity = creativeStyle === 'brand';
    console.log("[generate-creative-v2] Using brand identity:", useBrandIdentity);

    console.log("[generate-creative-v2] Starting generation...");
    console.log("[generate-creative-v2] Art Text:", effectiveArtText.substring(0, 100));
    console.log("[generate-creative-v2] Design Orientation:", designOrientation?.substring(0, 100) || 'none');
    console.log("[generate-creative-v2] Format:", format);
    console.log("[generate-creative-v2] Has Logo for overlay:", !!logoUrl);

    // ============ PHOTO OPTIMIZATION DISABLED FOR PERFORMANCE ============
    // The professional photo optimization step was adding ~25 seconds to generation time
    // and causing timeout issues with the edge function limit (~150s).
    // We now use the original photo directly to keep generation under the timeout limit.
    const optimizedPersonImage = personImageBase64;

    // ============ STEP 1: Art Director - PROFESSIONAL BRAND PHILOSOPHY ============
    const userPrompt = `TEXTO DA ARTE (o usuário quer este conteúdo na arte):
"${effectiveArtText.slice(0, 500)}"

${designOrientation ? `ORIENTAÇÃO DE DESIGN E CENA: ${designOrientation.slice(0, 300)}` : ''}

REFERÊNCIAS VISUAIS: ${referenceImages.length} imagem(ns) de referência fornecida(s).
${referenceImages.length > 0 ? `
As fotos abaixo são referências visuais. Cada uma tem um TIPO que indica o que ela representa:
${personRefs.length > 0 ? `- ${personRefs.length} foto(s) de PESSOA: preserve a identidade facial` : ''}
${productRefs.length > 0 ? `- ${productRefs.length} foto(s) de PRODUTO/ROUPA` : ''}
${sceneRefs.length > 0 ? `- ${sceneRefs.length} foto(s) de CENÁRIO/AMBIENTE` : ''}
${genericRefs.length > 0 ? `- ${genericRefs.length} foto(s) de REFERÊNCIA VISUAL geral` : ''}

Use essas referências como BASE VISUAL para compor a arte. O que fazer com elas depende do TEXTO DA ARTE e da ORIENTAÇÃO DE DESIGN acima.
A IA deve interpretar o contexto e integrar os elementos de forma natural e coerente.
` : 'Sem imagens de referência - gerar arte baseada apenas no texto.'}

ESTILO DO CRIATIVO: ${creativeStyle === 'brand' ? 'MARCA (usar identidade visual abaixo)' : 'GENÉRICO (criar baseado no contexto, sem prender à marca)'}

ESTILO DETECTADO AUTOMATICAMENTE: ${detectedStyle}
(baseado nas palavras-chave do contexto)

${useBrandIdentity ? `
Perfil da marca: ${JSON.stringify(sanitizedBrandProfile)}
Cores da marca: ${sanitizedBrandIdentity.colors?.join(', ') || 'não definidas'}
Mood: ${sanitizedBrandIdentity.mood || 'comercial, profissional'}
` : 'Modo genérico - usar paleta de cores adequada ao contexto'}

Formato: ${format}

${theme ? `TEMA DA ARTE: ${String(theme).toUpperCase()}
Diretrizes obrigatórias por tema:
- promocao: paleta vibrante (vermelho/laranja/amarelo), estilo dynamic, urgência e oferta em destaque.
- lancamento: paleta moderna (preto/dourado/neon), estilo premium ou dynamic, exclusividade e novidade.
- data_comemorativa: paleta festiva, estilo festive, atmosfera celebrativa.
- institucional: paleta sóbria (azul/cinza/branco), estilo clean, profissional e confiável.
- servico: paleta neutra com accent da marca, estilo minimal/clean, foco em benefício.
Aplique a diretriz correspondente ao tema "${theme}" na composição, paleta e estilo.
` : ''}
IMPORTANTE: 
1. DEDUZA automaticamente o melhor HEADLINE, SUBHEADLINE e CTA a partir do "Texto da arte"
2. O headline deve ser CURTO e IMPACTANTE (máx 50 caracteres)
3. O subheadline complementa o headline (máx 80 caracteres)
4. O CTA deve ser uma chamada para ação clara (máx 20 caracteres)
${useBrandIdentity ? `5. IDENTIDADE VISUAL É FIXA - use as cores da marca obrigatoriamente
6. Sugira CORES DE TEXTO que usem cores da marca` : '5. Use cores que combinem com o contexto da arte'}
7. Escolha o PROTAGONISTA: texto OU pessoa (não ambos competindo!)
8. Escolha um LAYOUT DIFERENTE do padrão (não sempre classic!)

RESPONDA com o JSON incluindo os campos headline, subheadline e cta DEDUZIDOS do texto da arte.`;

    console.log("[generate-creative-v2] Getting Professional Art Director decision...");

    const artDirectorResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: artDirectorSystemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!artDirectorResponse.ok) {
      const errText = await artDirectorResponse.text();
      console.error("[generate-creative-v2] Art Director error:", errText);
      return respond({ success: false, error: "Erro ao consultar Diretor de Arte" }, 500);
    }

    const artDirectorData = await artDirectorResponse.json();
    const raw = artDirectorData.choices?.[0]?.message?.content?.trim() as string | undefined;
    
    if (!raw) {
      return respond({ success: false, error: "Diretor de Arte não retornou dados" }, 500);
    }

    let parsed: Partial<ArtDirectorDecision>;
    try {
      const cleanContent = raw
        .replace(/^```json\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[generate-creative-v2] JSON parse error:", parseError, "Raw:", raw);
      parsed = {};
    }

    const decision = normalizeDecision(parsed);
    
    // Extract AI-deduced texts
    const aiHeadline = (parsed as any)?.headline || effectiveHeadline;
    const aiSubheadline = (parsed as any)?.subheadline || subheadline || '';
    const aiCta = (parsed as any)?.cta || cta || '';
    
    console.log("[generate-creative-v2] AI deduced headline:", aiHeadline);
    console.log("[generate-creative-v2] AI deduced subheadline:", aiSubheadline);
    console.log("[generate-creative-v2] AI deduced CTA:", aiCta);
    console.log("[generate-creative-v2] Layout Style:", decision.layout_style);
    console.log("[generate-creative-v2] Protagonist:", decision.protagonist);

    // ============ STEP 2: Generate Image with PROFESSIONAL BRAND PROMPT ============
    const positionText = decision.template === "pessoa_direita" 
      ? "on the right side of the frame"
      : decision.template === "pessoa_esquerda"
        ? "on the left side of the frame"
        : "centered in the frame";

    const primaryColor = sanitizedBrandIdentity.colors?.[0] || "#3B82F6";
    const secondaryColor = sanitizedBrandIdentity.colors?.[1] || sanitizedBrandIdentity.colors?.[0] || "#8B5CF6";
    const brandColorsString = sanitizedBrandIdentity.colors?.length 
      ? sanitizedBrandIdentity.colors.join(", ") 
      : "professional blue and purple palette";

    // Get contextual creative elements - AUTO-DETECTED from context
    const contextualElements = getContextualElements(effectiveContext);
    
    // Get layout instructions based on AI decision
    const layoutInstructions = getLayoutInstructions(decision.layout_style, positionText);

    // Get protagonist instructions
    const protagonistInstructions = getProtagonistInstructions(decision.protagonist);

    // Get mode-specific instructions
    const modeInstructions = getModeInstructions(effectiveMode);

    // Get text colors from AI decision
    const textColors = decision.text_colors || {
      headline: "#FFFFFF",
      subheadline: "#F1F5F9",
      cta_bg: primaryColor,
      cta_text: "#FFFFFF"
    };

    // Generate requested number of variations
    // LIMITED TO 2 MAX to avoid edge function timeout (was hitting 150s limit with 4 variations)
    const MAX_VARIATIONS = 2;
    const actualVariations = Math.min(Math.max(variationsCount || 1, 1), MAX_VARIATIONS);
    const generatedImages: string[] = [];
    let isPartialSuccess = false;

    // Different layout styles for each variation
    const layoutVariations = ["classic", "diagonal", "centered_bold", "inverted", "side_text"];

    // Per-image timeout: 90s for first, 70s for subsequent (leave room for response)
    const IMAGE_TIMEOUT_MS = [90000, 70000];

    for (let i = 0; i < actualVariations; i++) {
      console.log(`[generate-creative-v2] Generating variation ${i + 1}/${actualVariations}...`);
      const variationStartTime = Date.now();
      
      // Use different layout for each variation
      const variationLayout = layoutVariations[i % layoutVariations.length];
      const variationLayoutInstructions = getLayoutInstructions(variationLayout, positionText);

      // Professional brand prompt with philosophy - adapted for generation mode
      const imagePrompt = `=== DIRETOR DE ARTE SÊNIOR - CRIATIVO PROFISSIONAL - VARIAÇÃO ${i + 1} ===

${(generationMode === 'person' || personRefs.length > 0) ? `
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
>>> ALERTA MÁXIMO: PRESERVAÇÃO DE IDENTIDADE FACIAL <<<
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

As fotos marcadas como PESSOA contêm uma pessoa real.
PRESERVE A IDENTIDADE FACIAL EXATAMENTE COMO NA FOTO.

NÃO CRIE UMA PESSOA DIFERENTE. NÃO IDEALIZE. NÃO MELHORE TRAÇOS.
USE A MESMA FACE, OS MESMOS TRAÇOS, A MESMA PELE.

Use o TEXTO DA ARTE e a ORIENTAÇÃO DE DESIGN para decidir como integrar
a pessoa, produtos e cenários das referências. A composição deve seguir
o que o usuário descreveu, não regras fixas de combinação.

ESSA É A REGRA MAIS IMPORTANTE DESTA GERAÇÃO.
QUALQUER ALTERAÇÃO NA FACE É CONSIDERADA FALHA CRÍTICA.

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
` : ''}

=== MODO DE GERAÇÃO: ${generationMode.toUpperCase()} ===
${modeInstructions.focus}

${modeInstructions.composition}

=== PRINCÍPIOS FUNDAMENTAIS (OBRIGATÓRIOS) ===
1. IDENTIDADE VISUAL É FIXA - Fundo e cenário são VARIÁVEIS
2. O fundo deve REFORÇAR a mensagem, NUNCA COMPETIR com ela
3. A marca deve ser RECONHECIDA mesmo com fundos diferentes

${generationMode === 'person' ? `=== PROTAGONISTA DESTA ARTE ===
${protagonistInstructions}` : ''}

=== LAYOUT STYLE: ${variationLayout.toUpperCase()} ===
${variationLayoutInstructions}

=== ESTILO: ${decision.style.toUpperCase()} ===
${decision.style === 'dynamic' ? 'High energy, bold colors, movement, urgency cues, action-oriented' : ''}
${decision.style === 'premium' ? 'Sophisticated, luxurious, metallic accents, refined elegance' : ''}
${decision.style === 'festive' ? 'Celebratory, vibrant colors, party elements, joyful atmosphere' : ''}
${decision.style === 'clean' ? 'Professional, minimal, trustworthy, corporate elegance' : ''}

=== REGRAS DE IDENTIDADE VISUAL (OBRIGATÓRIO) ===
1. Usar NO MÍNIMO 2 cores institucionais da marca em cada arte
2. NUNCA trocar cores para "combinar com o fundo"
3. Manter linguagem gráfica consistente
4. Arte deve parecer PARTE DE UMA SÉRIE, não isolada

=== COMPOSIÇÃO PROFISSIONAL ===
- Layout em camadas: fundo contextual > elementos gráficos sutis > protagonista > identidade
- Leitura clara (padrão Z ou F)
- Respiro visual adequado
- Texto ocupando NO MÁXIMO 40% da arte

=== CREATIVE ELEMENTS FOR THIS CONTEXT ===
${contextualElements}

=== SAFE ZONE: 5% minimum from ALL edges ===
Text must NEVER touch or get cut by the frame edges.

=== BRAND IDENTITY (USAR OBRIGATORIAMENTE) ===
PRIMARY COLOR: ${primaryColor}
SECONDARY COLOR: ${secondaryColor}
FULL PALETTE: ${brandColorsString}
REGRA: Usar no mínimo 2 destas cores na arte!

${renderTextOnImage ? `
=== TEXTO A RENDERIZAR ===

HEADLINE (copie EXATAMENTE - letra por letra):
"${aiHeadline}"
Soletração: ${aiHeadline.split('').join('-')}

REGRAS DE TIPOGRAFIA:
1. Renderize EXATAMENTE o texto entre aspas, sem alterações
2. Fonte: Bold sans-serif moderna (Impact, Bebas, Montserrat Bold)
3. Tamanho: ${generationMode === 'text-only' ? 'ENORME - elemento visual principal' : decision.protagonist === 'text' ? 'GRANDE - domina o frame' : 'Médio - elegante'}
4. Cor: ${textColors.headline} com sombra forte para contraste
5. Posição: conforme layout ${decision.layout_style}

REGRA DE CONTRASTE (CRÍTICO):
- Fundo ESCURO → texto CLARO (branco ou cor clara da marca)
- Fundo CLARO → texto ESCURO ou cor saturada da marca
- SEMPRE adicione sombra ou contorno para legibilidade

${aiSubheadline ? `
SUBHEADLINE (copie EXATAMENTE - letra por letra):
"${aiSubheadline}"
Soletração: ${aiSubheadline.split('').join('-')}
Fonte: Regular, 50% do tamanho do headline
Cor: ${textColors.subheadline}
` : ""}

${aiCta && aiCta.trim() ? `
CTA (copie EXATAMENTE - letra por letra):
"${aiCta}"
Soletração: ${aiCta.split('').join('-')}
Formato: Botão pill com background ${textColors.cta_bg}
Texto: ${textColors.cta_text}
RENDERIZE APENAS o texto "${aiCta}" - nada mais
` : `
SEM CTA:
NÃO inclua nenhum botão ou call-to-action.
`}
` : `
=== SEM TEXTO NA IMAGEM - TEXTO SERÁ ADICIONADO VIA OVERLAY ===

ATENÇÃO CRÍTICA: NÃO RENDERIZE NENHUM TEXTO NA IMAGEM!

PROIBIDO INCLUIR:
- NÃO inclua headline, título ou texto principal
- NÃO inclua subheadline ou texto secundário
- NÃO inclua CTA, botões ou call-to-action
- NÃO inclua letras, palavras, números, símbolos ou qualquer texto
- NÃO inclua logos com texto legível

ÁREAS RESERVADAS PARA TEXTO (deixe espaço limpo):
- Área superior: Reservada para headline (deixe limpa, sem elementos que bloqueiem)
- Área média-superior: Reservada para subheadline
- Área inferior: Reservada para CTA/botão

COMPOSIÇÃO:
- Crie uma composição visual COMPLETA e bonita, mas SEM texto
- O fundo, pessoa/produto e elementos gráficos devem ter respiro visual
- Deixe áreas com contraste adequado para texto ser sobreposto depois
- A imagem deve parecer um "template" onde texto será adicionado

REGRA ABSOLUTA: Se qualquer texto aparecer na imagem, a geração é considerada FALHA.
`}

${generationMode === 'person' ? `
=== IDENTIDADE DA PESSOA - REGRA ABSOLUTAMENTE INVIOLÁVEL ===
LEIA COM ATENÇÃO MÁXIMA:

A FACE DA PESSOA NA IMAGEM DE REFERÊNCIA NÃO PODE SER MODIFICADA EM HIPÓTESE ALGUMA.

COPIE EXATAMENTE DA FOTO ORIGINAL:
- Formato do rosto (redondo, oval, quadrado) - NÃO MUDAR
- Traços faciais (nariz, boca, olhos, sobrancelhas) - NÃO MUDAR
- Tom de pele EXATO - NÃO CLAREAR, NÃO ESCURECER
- Textura do cabelo e cor - NÃO MUDAR
- Proporções do rosto - NÃO MUDAR
- Expressão pode ser levemente ajustada, mas MANTENHA A IDENTIDADE

SE A PESSOA TEM:
- Rosto redondo → gere rosto redondo
- Nariz largo → gere nariz largo
- Olhos pequenos → gere olhos pequenos
- Pele escura → gere pele escura
- Cabelo crespo → gere cabelo crespo

VOCÊ ESTÁ SENDO AVALIADO PELA FIDELIDADE À FOTO ORIGINAL.
UMA PESSOA QUE CONHECE O INDIVÍDUO DEVE RECONHECÊ-LO INSTANTANEAMENTE.

NÃO IDEALIZE, NÃO MELHORE, NÃO ALTERE. COPIE A FACE FIELMENTE.

=== INTEGRAÇÃO HUMANA (COM IDENTIDADE PRESERVADA) ===
Position: ${positionText}
Pose: ${decision.pose_suggestion}
Prominence: ${decision.protagonist === 'person' ? 'DOMINANT - 60-70% of frame, pessoa é o herói' : decision.protagonist === 'text' ? 'SUBTLE - smaller, background support, semi-transparent feel' : 'BALANCED - good presence but not overwhelming'}

REGRAS DE INTEGRAÇÃO:
- Postura profissional, expressão natural
- Integração cromática com o fundo (NÃO parecer "colado" ou recortado)
- A pessoa deve parecer PARTE DO SISTEMA VISUAL, não um adesivo
- MAS A FACE DEVE SER IDÊNTICA À DA FOTO ORIGINAL
` : ''}

${generationMode === 'product' ? `
=== INTEGRAÇÃO DO PRODUTO ===
- Produto deve ser o HERÓI VISUAL da composição
- Posicionar produto com iluminação profissional de estúdio
- Sombra realista e reflexos sutis
- Fundo complementar, não competitivo
- Texto posicionado ao redor, NUNCA sobre o produto
- O produto da imagem de referência deve ser reproduzido FIELMENTE
` : ''}

=== SCENE ===
${decision.scene_prompt}
IMPORTANT: Background supports the message, NEVER competes with it

=== ATMOSPHERE ===
${decision.atmosphere || "Commercial, trustworthy, conversion-focused lighting"}

=== EFFECTS ===
${decision.suggested_effects || "Subtle lens flare, professional depth of field"}

=== CREATIVE ELEMENTS ===
${decision.creative_elements || contextualElements}

=== QUALITY STANDARDS ===
- Commercial advertising photography quality
- Professional studio lighting
- High resolution, print-ready
- NO watermarks, NO logos
- Agency-level output

=== CHECKLIST FINAL (ANTES DE GERAR) ===
${generationMode === 'person' ? '0. ✓ FACE DA PESSOA É IDÊNTICA À FOTO ORIGINAL (VERIFICAÇÃO OBRIGATÓRIA - PRIORIDADE MÁXIMA)' : ''}
1. ✓ Identidade visual respeitada (mínimo 2 cores da marca USADAS)
2. ✓ Fundo coerente com o contexto (sustenta, não compete)
${renderTextOnImage ? '3. ✓ Texto legível em 1 segundo' : '3. ✓ NENHUM TEXTO NA IMAGEM - áreas limpas para overlay HTML'}
4. ✓ MODO: ${generationMode.toUpperCase()}
5. ✓ Arte parece parte de uma SÉRIE, não isolada
${generationMode === 'person' ? '6. ✓ Pessoa COM MESMA FACE DA FOTO ORIGINAL integrada naturalmente' : ''}
${generationMode === 'product' ? '6. ✓ Produto em destaque com iluminação profissional' : ''}
${generationMode === 'text-only' ? '6. ✓ Tipografia como elemento visual principal' : ''}
${renderTextOnImage ? '7. ✓ CTA proeminente e clicável' : '7. ✓ SEM CTA - será adicionado via overlay HTML'}
8. ✓ LAYOUT = ${variationLayout}
${generationMode === 'person' ? '9. ✓ ÚLTIMA VERIFICAÇÃO: A pessoa na arte é RECONHECÍVEL como a pessoa da foto?' : ''}
${!renderTextOnImage ? `
=== VERIFICAÇÃO FINAL OBRIGATÓRIA ===
ANTES DE FINALIZAR, VERIFIQUE:
- [ ] A imagem contém ZERO texto renderizado?
- [ ] NÃO há palavras, letras ou números visíveis?
- [ ] NÃO há placeholders como "HEADLINE" ou "SUBHEADLINE"?
- [ ] As áreas para texto overlay estão LIMPAS e com bom contraste?

SE QUALQUER TEXTO ESTIVER VISÍVEL NA IMAGEM = GERAÇÃO FALHOU
` : ''}

"Consistência é reconhecimento, não repetição."`;

      console.log(`[generate-creative-v2] Using layout style: ${variationLayout}, protagonist: ${decision.protagonist}`);

      // Build message content - include all reference images
      const messageContent: Array<{type: string; text?: string; image_url?: {url: string}}> = [
        { type: "text", text: imagePrompt }
      ];
      
      // Add reference images with type labels
      if (referenceImages.length > 0) {
        const typeLabels: Record<string, string> = {
          person: 'PESSOA - preserve identidade facial',
          product: 'PRODUTO/ROUPA - use este item',
          scene: 'CENÁRIO - use como fundo',
          reference: 'REFERÊNCIA VISUAL - inspire-se',
        };
        for (let ri = 0; ri < referenceImages.length; ri++) {
          const refImg = referenceImages[ri];
          messageContent.push({
            type: "text",
            text: `[FOTO ${ri + 1} - ${typeLabels[refImg.type] || 'REFERÊNCIA'}]`
          });
          messageContent.push({ 
            type: "image_url", 
            image_url: { url: refImg.url }
          });
        }
      } else if (effectiveMode === 'person' && optimizedPersonImage) {
        // Fallback to legacy single image
        messageContent.push({ 
          type: "image_url", 
          image_url: { url: optimizedPersonImage }
        });
      } else if (effectiveMode === 'product' && productImageBase64) {
        messageContent.push({ 
          type: "image_url", 
          image_url: { url: productImageBase64 }
        });
      }
      // text-only mode: no image reference

      // Generate image with timeout and retry (with exponential backoff for 429)
      const timeoutMs = IMAGE_TIMEOUT_MS[Math.min(i, IMAGE_TIMEOUT_MS.length - 1)];
      let imageData: any = null;
      let lastError: string | null = null;
      const MAX_ATTEMPTS = 3;
      const BACKOFF_MS = [500, 1000, 2000];

      // Sequential pacing: 500ms gap between variations to avoid burst rate-limit
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 500));
      }

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [
                {
                  role: "user",
                  content: messageContent
                }
              ],
              modalities: ["image", "text"]
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!imageResponse.ok) {
            const errText = await imageResponse.text();
            console.error(`[generate-creative-v2] Image generation error (variation ${i + 1}, attempt ${attempt + 1}):`, errText);

            if (imageResponse.status === 429) {
              // Exponential backoff retry on rate-limit before failing the whole job
              if (attempt < MAX_ATTEMPTS - 1) {
                const wait = BACKOFF_MS[attempt];
                console.warn(`[generate-creative-v2] 429 received, backoff ${wait}ms before retry ${attempt + 2}`);
                await new Promise((r) => setTimeout(r, wait));
                lastError = `HTTP 429`;
                continue;
              }
              return respond({
                success: false,
                error: "Limite de requisições excedido. Aguarde alguns segundos e tente novamente."
              }, 429);
            }
            if (imageResponse.status === 402) {
              return respond({
                success: false,
                error: "Créditos insuficientes. Adicione créditos ao workspace."
              }, 402);
            }

            lastError = `HTTP ${imageResponse.status}`;
            continue; // retry
          }

          imageData = await imageResponse.json();
          break; // success, exit retry loop
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            const elapsed = ((Date.now() - variationStartTime) / 1000).toFixed(1);
            console.warn(`[generate-creative-v2] Variation ${i + 1} timed out after ${elapsed}s (attempt ${attempt + 1})`);
            lastError = 'timeout';

            // If we already have images, don't retry - just return partial
            if (generatedImages.length > 0) {
              isPartialSuccess = true;
              break;
            }
            // First image timed out on first attempt - retry once
            continue;
          }
          console.error(`[generate-creative-v2] Fetch error (variation ${i + 1}, attempt ${attempt + 1}):`, fetchErr);
          lastError = fetchErr.message || 'fetch_error';
          continue; // retry
        }
      }

      // If this variation timed out and we have partial results, stop generating more
      if (!imageData && generatedImages.length > 0) {
        isPartialSuccess = true;
        console.log(`[generate-creative-v2] Stopping after ${generatedImages.length} images due to timeout`);
        break;
      }

      const generatedImageBase64 = imageData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (generatedImageBase64) {
        const elapsed = ((Date.now() - variationStartTime) / 1000).toFixed(1);
        // Try to upload to storage, fallback to base64 if storage is not configured
        if (supabaseClient && userId !== "anonymous") {
          const storageUrl = await uploadToStorage(supabaseClient, userId, generatedImageBase64, i);
          if (storageUrl) {
            generatedImages.push(storageUrl);
            console.log(`[generate-creative-v2] Variation ${i + 1} uploaded to storage in ${elapsed}s: ${storageUrl}`);
          } else {
            generatedImages.push(generatedImageBase64);
            console.log(`[generate-creative-v2] Variation ${i + 1} storage upload failed, using base64`);
          }
        } else {
          generatedImages.push(generatedImageBase64);
          console.log(`[generate-creative-v2] Variation ${i + 1} generated in ${elapsed}s (no storage configured)`);
        }
        console.log(`[generate-creative-v2] Variation ${i + 1} generated successfully with layout: ${variationLayout}, protagonist: ${decision.protagonist}`);
      } else {
        console.warn(`[generate-creative-v2] Variation ${i + 1} returned no image (error: ${lastError})`);
        if (generatedImages.length > 0) {
          isPartialSuccess = true;
          break;
        }
      }
    }

    if (generatedImages.length === 0) {
      console.error("[generate-creative-v2] No images generated");
      return respond({ 
        success: false, 
        error: "Não foi possível gerar imagens. Tente novamente." 
      }, 500);
    }

    console.log(`[generate-creative-v2] ${isPartialSuccess ? 'Partial' : 'Full'} success! Generated ${generatedImages.length}/${actualVariations} PROFESSIONAL BRAND images`);

    return respond({
      success: true,
      partial: isPartialSuccess,
      requestedVariations: actualVariations,
      images: generatedImages,
      headline: aiHeadline,
      subheadline: aiSubheadline || undefined,
      cta: aiCta || undefined,
      template: decision.template,
      style: decision.style,
      layout_style: decision.layout_style,
      protagonist: decision.protagonist,
      scene_prompt: decision.scene_prompt,
      pose_suggestion: decision.pose_suggestion,
      creative_elements: decision.creative_elements,
      atmosphere: decision.atmosphere,
      text_colors: decision.text_colors || {
        headline: "#FFFFFF",
        subheadline: "#F1F5F9",
        cta_bg: primaryColor,
        cta_text: "#FFFFFF"
      },
      // Return for text overlay mode
      renderTextOnImage: renderTextOnImage,
      // Return logo info for frontend overlay
      logoUrl: logoUrl || null,
      logoPosition: "bottom-right",
      brandApplied: {
        primaryColor,
        secondaryColor,
        hasLogo: !!logoUrl,
        detectedStyle: detectedStyle,
        professionalContext: professionalContext,
        photoOptimized: optimizedPersonImage !== personImageBase64,
      },
    });

  } catch (error: unknown) {
    console.error("[generate-creative-v2] Unexpected error:", error);
    
    // ============ REFUND CREDITS ON TECHNICAL FAILURE ============
    if (transactionId && userId !== "anonymous" && !isMasterUser) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          
          const { data: refundResult, error: refundError } = await supabaseClient
            .rpc('refund_user_credits', {
              p_user_id: userId,
              p_amount: CREDITS_COST,
              p_original_transaction_id: transactionId,
              p_reason: 'Falha técnica na geração de arte'
            });
          
          if (refundError) {
            console.error("[generate-creative-v2] Refund error:", refundError);
          } else {
            console.log(`[generate-creative-v2] Credits refunded successfully. Balance after: ${refundResult?.balance_after}`);
          }
        }
      } catch (refundErr) {
        console.error("[generate-creative-v2] Error during refund:", refundErr);
      }
    }
    
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return respond({ success: false, error: message }, 500);
  }
});
