import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TrialStatusCard } from "@/components/TrialStatusCard";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { GenerationHistoryDialog } from "@/components/GenerationHistoryDialog";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ExportButtons } from "@/components/ExportButtons";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ToastAction } from "@/components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Sparkles, Copy, Loader2, RefreshCw, HelpCircle, Wand2, Instagram } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";

// Personalized mode components
import { InstagramAnalyzer } from "@/components/banner/InstagramAnalyzer";
import { PersonPhotoUpload, PersonAnalysis } from "@/components/banner/PersonPhotoUpload";
import { DesignGeneratorForm } from "@/components/banner/DesignGeneratorForm";
import { PersonalizedModeStepper } from "@/components/banner/PersonalizedModeStepper";
import { VisualIdentity } from "@/components/banner/IdentityVisualCard";
import { BrandProfileSelector } from "@/components/banner/BrandProfileSelector";
import { ProjectConfigForm } from "@/components/banner/ProjectConfigForm";

interface BrandProfile {
  id: string;
  name: string;
  logo_url: string | null;
  colors: string[] | null;
  visual_style: string | null;
  mood: string | null;
  overall_description: string | null;
  created_at: string;
}

interface BrandProject {
  id: string;
  name: string;
  brand_profile_id: string | null;
  person_photo_url: string | null;
  person_analysis: Record<string, unknown> | null;
  default_formats: string[];
  variations_count: number;
  created_at: string;
}

export default function AgenteBanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [bannerImages, setBannerImages] = useState<any[]>([]);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generateImages, setGenerateImages] = useState(true);
  const { saveGeneration } = useGenerationHistory();
  const { isMobile, touchSize, iconSize, spacing, inputHeight, buttonMinHeight } = useMobileOptimization();
  
  // Simple mode form data
  const [formData, setFormData] = useState({
    produto: "",
    beneficio: "",
    identidade_visual: "",
    publico_alvo: "",
    imagem_produto: "",
    objetivo_post: "",
    formato_imagem: "",
    informacoes_obrigatorias: ""
  });
  
  // Personalized mode state
  const [mode, setMode] = useState<"simple" | "personalized">("simple");
  const [currentStep, setCurrentStep] = useState(1);
  const [identity, setIdentity] = useState<VisualIdentity | null>(null);
  const [person, setPerson] = useState<PersonAnalysis | null>(null);
  const [selectedBrandProfile, setSelectedBrandProfile] = useState<BrandProfile | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<BrandProject | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Faça login para usar o gerador de banners",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    setResult('');
    setBannerImages([]);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-ai-content', {
        body: { agentType: 'banner', formData, userId: user.id }
      });

      if (functionError) throw functionError;
      
      // Check for error in response body (backend returns 4xx with error message)
      if (functionData?.error) {
        throw new Error(functionData.error);
      }

      const generatedText = functionData.content;
      setResult(generatedText);
      saveGeneration('banner', generatedText, formData);
      
      toast({
        title: "Conceito gerado! 🎨",
        description: generateImages ? "Gerando imagens..." : "Seu conceito está pronto",
      });

      if (generateImages) {
        setGeneratingImages(true);
        
        try {
          // Extrair HEADLINE e CTA do novo formato
          const headlineMatch = generatedText.match(/^HEADLINE:\s*\n(.+?)(?:\n|$)/im);
          const ctaMatch = generatedText.match(/^CTA:\s*\n(.+?)(?:\n|$)/im);
          const promptMatch = generatedText.match(/^PROMPT BASE PARA GERAÇÃO DE IMAGEM:\s*\n([\s\S]+?)(?:\n\n|$)/im);
          
          const headline = headlineMatch ? headlineMatch[1].trim() : null;
          const cta = ctaMatch ? ctaMatch[1].trim() : null;
          
          // Validação obrigatória - não aceitar fallbacks silenciosos
          if (!headline || !cta) {
            console.error('HEADLINE ou CTA não extraídos:', { headline, cta });
            toast({
              title: "Erro na extração",
              description: "O conceito foi gerado mas HEADLINE/CTA não foram identificados. Tente novamente.",
              variant: "destructive",
            });
            setGeneratingImages(false);
            return;
          }
          
          const basePrompt = promptMatch 
            ? promptMatch[1].trim() 
            : `Professional marketing banner for ${formData.produto}. ${formData.beneficio}`;

          const { data: imagesData, error: imagesError } = await supabase.functions.invoke('generate-banner-images', {
            body: {
              basePrompt,
              headline,
              cta,
              formato: formData.formato_imagem,
              identidadeVisual: formData.identidade_visual
            }
          });

          if (imagesError) {
            console.error('Erro ao gerar imagens:', imagesError);
            toast({
              title: "Imagens não geradas",
              description: "O conceito foi criado, mas as imagens falharam. Tente gerar novamente.",
              variant: "destructive",
            });
          } else {
            setBannerImages(imagesData.images || []);
            toast({
              title: "Banners gerados! 🎉",
              description: `${imagesData.totalGenerated} variações criadas com sucesso`,
            });
          }
        } catch (imageError) {
          console.error('Erro ao gerar imagens:', imageError);
          toast({
            title: "Erro nas imagens",
            description: "O conceito foi gerado, mas houve um problema nas imagens",
            variant: "destructive",
          });
        } finally {
          setGeneratingImages(false);
        }
      }
    } catch (error: any) {
      console.error('Erro na geração:', error);
      
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('limite diário') || errorMessage.includes('daily limit')) {
        toast({
          title: "Limite diário atingido",
          description: "Você atingiu o limite de 10 gerações diárias do período trial.",
          variant: "destructive",
          action: <ToastAction altText="Ver Planos" onClick={() => navigate('/dashboard')}>Ver Planos</ToastAction>
        });
      } else if (errorMessage.includes('limite mensal') || errorMessage.includes('monthly limit')) {
        toast({
          title: "Limite mensal atingido",
          description: "Você atingiu o limite mensal do seu plano.",
          variant: "destructive",
          action: <ToastAction altText="Fazer Upgrade" onClick={() => navigate('/dashboard')}>Fazer Upgrade</ToastAction>
        });
      } else if (errorMessage.includes('plano necessário') || errorMessage.includes('subscription required') || errorMessage.includes('plano pago') || errorMessage.includes('usuários gratuitos')) {
        toast({
          title: "Assinatura necessária",
          description: "Este agente requer um plano ativo para gerar conteúdo.",
          variant: "destructive",
          action: <ToastAction altText="Ver Planos" onClick={() => navigate('/dashboard')}>Ver Planos</ToastAction>
        });
      } else {
        toast({
          title: "Erro ao gerar conteúdo",
          description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setGeneratingImages(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copiado!", description: "Conceito copiado." });
  };

  const handleGenerateVariation = () => {
    setResult("");
    setBannerImages([]);
    handleSubmit(new Event('submit') as any);
  };

  const handleReuseData = (historicalFormData: Record<string, string>) => {
    setFormData(prev => ({
      ...prev,
      ...historicalFormData
    }));
  };

  // Personalized mode handlers
  const handleIdentityExtracted = (extractedIdentity: VisualIdentity) => {
    setIdentity(extractedIdentity);
    setCurrentStep(2);
  };

  const handlePersonAnalyzed = (analyzedPerson: PersonAnalysis) => {
    setPerson(analyzedPerson);
    setCurrentStep(3);
  };

  const handlePersonalizedImagesGenerated = (images: any[]) => {
    setBannerImages(images);
  };

  const resetPersonalizedMode = () => {
    setIdentity(null);
    setPerson(null);
    setCurrentStep(1);
    setBannerImages([]);
    // Keep selectedBrandProfile and selectedProject - don't reset them when switching modes
  };

  // Handle project change and sync with brand profile + person data
  const handleProjectChange = async (project: BrandProject | null) => {
    setSelectedProject(project);
    
    // Auto-sync brand profile when project is selected
    if (project?.brand_profile_id && project.brand_profile_id !== selectedBrandProfile?.id) {
      try {
        const { data: profile, error } = await supabase
          .from('brand_profiles')
          .select('*')
          .eq('id', project.brand_profile_id)
          .single();
        
        if (!error && profile) {
          handleSelectBrandProfile(profile as BrandProfile);
        }
      } catch (err) {
        console.error('Error syncing brand profile:', err);
      }
    } else if (!project?.brand_profile_id) {
      // Clear profile selection if project has no linked profile
      handleSelectBrandProfile(null);
    }

    // Auto-load person data from project if available
    if (project?.person_analysis && project.person_photo_url) {
      const savedPerson = project.person_analysis as unknown as PersonAnalysis;
      if (savedPerson.description) {
        setPerson(savedPerson);
        // Advance to step 3 if identity is also available
        if (identity || (project.brand_profile_id && selectedBrandProfile)) {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
        toast({
          title: "Dados carregados! 📷",
          description: "Foto e análise da pessoa recuperados do projeto",
        });
      }
    } else if (!project?.person_analysis) {
      // Clear person data if project has no saved person
      setPerson(null);
    }
  };

  // Handle brand profile selection and load its identity if available
  const handleSelectBrandProfile = (profile: BrandProfile | null) => {
    setSelectedBrandProfile(profile);
    if (profile && profile.colors && profile.colors.length > 0) {
      // Load identity from saved brand profile
      setIdentity({
        colors: profile.colors || [],
        typography: { 
          style: "Personalizado", 
          weight: "Médio", 
          description: "Tipografia do perfil salvo" 
        },
        visualStyle: profile.visual_style || "",
        mood: profile.mood || "",
        recurringElements: [],
        overallDescription: profile.overall_description || "",
      });
    } else {
      // Reset identity if profile has no colors (needs Instagram analysis)
      setIdentity(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <ImageIcon className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">CRIADOR DE BANNER COM IA</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conceito profissional + 3 variações visuais geradas automaticamente
            </p>
            <Badge variant="secondary" className="mt-2">Powered by Lovable AI</Badge>
          </div>

          <div className="mb-8 max-w-md mx-auto">
            <TrialStatusCard />
            <SubscriptionStatusCard />
          </div>

          <div className="mb-6 flex justify-center">
            <GenerationHistoryDialog 
              currentAgentType="banner"
              onReuse={handleReuseData}
            />
          </div>

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={(v) => { setMode(v as "simple" | "personalized"); resetPersonalizedMode(); }} className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Modo Simples
              </TabsTrigger>
              <TabsTrigger value="personalized" className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Design Personalizado
              </TabsTrigger>
            </TabsList>

            {/* Simple Mode */}
            <TabsContent value="simple">
              <div className={isMobile ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
                {/* Formulário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Formulário
                    </CardTitle>
                    <CardDescription>
                      Preencha os dados para criar seu banner profissional
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className={isMobile ? "space-y-6" : "space-y-4"}>
                      <TooltipProvider>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="produto" className={isMobile ? "text-sm font-medium" : ""}>Produto/Serviço</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className={`${iconSize} text-muted-foreground cursor-help`} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>O que você está promovendo neste banner?</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input 
                            id="produto" 
                            value={formData.produto} 
                            onChange={(e) => setFormData({...formData, produto: e.target.value})} 
                            placeholder="Ex: Curso de Design Gráfico"
                            className={inputHeight}
                            required 
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="beneficio">Principal Benefício</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Qual o maior ganho para quem comprar? Foque no resultado</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea 
                            id="beneficio" 
                            value={formData.beneficio} 
                            onChange={(e) => setFormData({...formData, beneficio: e.target.value})} 
                            placeholder="Ex: Aprenda design profissional em 30 dias"
                            rows={2}
                            required 
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="publico_alvo">Público-Alvo</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Para quem este banner é direcionado?</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input 
                            id="publico_alvo" 
                            value={formData.publico_alvo} 
                            onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})} 
                            placeholder="Ex: Jovens criativos de 18-35 anos"
                            required 
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="identidade_visual">Identidade Visual</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Estilo visual: cores, fontes, mood (moderno, elegante, etc.)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input 
                            id="identidade_visual" 
                            value={formData.identidade_visual} 
                            onChange={(e) => setFormData({...formData, identidade_visual: e.target.value})} 
                            placeholder="Ex: Moderno, minimalista, cores vibrantes"
                            required 
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="objetivo_post">Objetivo do Post</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Qual ação você espera do público?</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input 
                            id="objetivo_post" 
                            value={formData.objetivo_post} 
                            onChange={(e) => setFormData({...formData, objetivo_post: e.target.value})} 
                            placeholder="Ex: Gerar inscrições no curso"
                            required 
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="formato_imagem">Formato</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Escolha o formato ideal para sua plataforma</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select value={formData.formato_imagem} onValueChange={(value) => setFormData({...formData, formato_imagem: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quadrado">Quadrado (1080x1080)</SelectItem>
                              <SelectItem value="retangular">Retangular (1200x628)</SelectItem>
                              <SelectItem value="story">Story (1080x1920)</SelectItem>
                              <SelectItem value="banner">Banner (1200x400)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="imagem_produto">Imagem do Produto</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Descreva a imagem ou mockup que deseja usar (opcional)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input 
                            id="imagem_produto" 
                            value={formData.imagem_produto} 
                            onChange={(e) => setFormData({...formData, imagem_produto: e.target.value})} 
                            placeholder="Ex: Mockup de computador, pessoa estudando"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="informacoes_obrigatorias">Informações Obrigatórias</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Dados essenciais: preço, prazo, contato, etc.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea 
                            id="informacoes_obrigatorias" 
                            value={formData.informacoes_obrigatorias} 
                            onChange={(e) => setFormData({...formData, informacoes_obrigatorias: e.target.value})} 
                            placeholder="Ex: Preço, data limite, contato"
                            rows={2}
                          />
                        </div>
                      </TooltipProvider>

                      {/* Toggle para gerar imagens */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-0.5">
                          <Label htmlFor="generate-images" className="text-base font-medium">
                            Gerar imagens automaticamente
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Cria 3 variações visuais do banner usando IA
                          </p>
                        </div>
                        <Switch
                          id="generate-images"
                          checked={generateImages}
                          onCheckedChange={setGenerateImages}
                        />
                      </div>

                      <Button type="submit" className={`w-full ${buttonMinHeight}`} disabled={loading || generatingImages} variant="gradient" size={touchSize}>
                        {loading || generatingImages ? (
                          <>
                            <Loader2 className={`${iconSize} mr-2 animate-spin`} />
                            {generatingImages ? "Gerando imagens..." : "Gerando conceito..."}
                          </>
                        ) : (
                          <>
                            <ImageIcon className={`${iconSize} mr-2`} />
                            {generateImages ? "Gerar Banner + Imagens" : "Gerar Conceito"}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Resultado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Resultado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {generatingImages && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ImageIcon className="w-4 h-4 animate-pulse" />
                          <span>Gerando 3 variações visuais...</span>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-64 w-full rounded-lg" />
                          <div className="flex gap-2">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 flex-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {bannerImages.length > 0 && !generatingImages && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold">Variações Geradas</h3>
                          <Badge variant="secondary">{bannerImages.filter(img => img.success).length} imagens</Badge>
                        </div>
                        <BannerCarousel
                          images={bannerImages}
                          onFavorite={(imageUrl, style) => {
                            toast({
                              title: "Em breve! ⭐",
                              description: `Favoritar imagens individuais será implementado em breve`,
                            });
                          }}
                          onRegenerateVariation={(style) => {
                            toast({
                              title: "Em breve 🔄",
                              description: `Regeneração de variação específica será implementada`,
                            });
                          }}
                        />
                      </div>
                    )}

                    {loading && !generatingImages ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : result ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold">Conceito do Banner</h3>
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap p-4 bg-muted rounded-lg">
                          {result}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={handleGenerateVariation}
                            variant="outline"
                            size={isMobile ? "default" : "default"}
                            className="flex-1 md:flex-initial min-w-[160px]"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Gerar Variação
                          </Button>

                          <Button
                            onClick={copyToClipboard}
                            variant="outline"
                            size={isMobile ? "default" : "default"}
                            className="flex-1 md:flex-initial min-w-[140px]"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>

                          <ExportButtons 
                            content={result}
                            agentType="banner"
                          />

                          <FavoriteButton
                            agentType="banner"
                            content={result}
                            formData={formData}
                            variant="outline"
                            size={isMobile ? "default" : "default"}
                            className="flex-1 md:flex-initial min-w-[140px]"
                          />
                        </div>
                      </div>
                    ) : !loading && !generatingImages ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Preencha o formulário e clique em "Gerar Banner" para começar</p>
                        {generateImages && (
                          <p className="text-sm mt-2 flex items-center justify-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            3 variações visuais serão geradas automaticamente
                          </p>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Personalized Mode */}
            <TabsContent value="personalized">
              <div className="space-y-6">
                {/* Brand Profile & Project Selectors */}
                <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                  <BrandProfileSelector
                    selectedProfileId={selectedBrandProfile?.id || null}
                    onSelectProfile={handleSelectBrandProfile}
                  />
                  <ProjectConfigForm
                    selectedProjectId={selectedProjectId}
                    onSelectProject={setSelectedProjectId}
                    onProjectChange={handleProjectChange}
                  />
                </div>

                {/* Stepper */}
                <PersonalizedModeStepper
                  currentStep={currentStep}
                  identityComplete={!!identity}
                  personComplete={!!person}
                />

                <div className={isMobile ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
                  {/* Left Column - Steps */}
                  <div className="space-y-6">
                    {currentStep === 1 && (
                      <InstagramAnalyzer
                        onIdentityExtracted={handleIdentityExtracted}
                        onIdentityChange={setIdentity}
                        selectedBrandProfileId={selectedBrandProfile?.id}
                      />
                    )}

                    {currentStep === 2 && identity && (
                      <PersonPhotoUpload
                        onPersonAnalyzed={handlePersonAnalyzed}
                        onPersonChange={setPerson}
                        projectId={selectedProjectId}
                      />
                    )}

                    {currentStep === 3 && identity && person && (
                      <DesignGeneratorForm
                        identity={identity}
                        person={person}
                        onImagesGenerated={handlePersonalizedImagesGenerated}
                        projectConfig={selectedProject ? {
                          defaultFormats: selectedProject.default_formats || ['feed'],
                          variationsCount: selectedProject.variations_count || 3
                        } : null}
                      />
                    )}

                    {/* Navigation */}
                    <div className="flex gap-2">
                      {currentStep > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(currentStep - 1)}
                        >
                          Voltar
                        </Button>
                      )}
                      {currentStep === 1 && identity && (
                        <Button onClick={() => setCurrentStep(2)}>
                          Continuar para Foto
                        </Button>
                      )}
                      {currentStep === 2 && person && (
                        <Button onClick={() => setCurrentStep(3)}>
                          Continuar para Geração
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-primary" />
                        Resultado Personalizado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {bannerImages.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Artes Personalizadas</h3>
                            <Badge variant="secondary">{bannerImages.filter(img => img.success).length} imagens</Badge>
                          </div>
                          <BannerCarousel
                            images={bannerImages}
                            onFavorite={(imageUrl, style) => {
                              toast({
                                title: "Em breve! ⭐",
                                description: `Favoritar imagens será implementado em breve`,
                              });
                            }}
                            onRegenerateVariation={(style) => {
                              toast({
                                title: "Em breve 🔄",
                                description: `Regeneração será implementada`,
                              });
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="font-medium mb-2">Modo Design Personalizado</p>
                          <p className="text-sm">
                            {currentStep === 1 && "Faça upload de prints do Instagram para extrair a identidade visual"}
                            {currentStep === 2 && "Faça upload da foto da pessoa para incluir no design"}
                            {currentStep === 3 && "Configure os detalhes finais e gere suas artes personalizadas"}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
