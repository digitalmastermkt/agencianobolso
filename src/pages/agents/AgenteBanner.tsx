import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TrialStatusCard } from "@/components/TrialStatusCard";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { GenerationHistoryDialog } from "@/components/GenerationHistoryDialog";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ExportButtons } from "@/components/ExportButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastAction } from "@/components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Sparkles, Copy, Loader2, RefreshCw, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";

export default function AgenteBanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const { saveGeneration } = useGenerationHistory();
  const { isMobile, touchSize, iconSize, spacing, inputHeight, buttonMinHeight } = useMobileOptimization();
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
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          agentType: 'banner',
          formData,
          userId: user?.id
        }
      });

      if (error) {
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
        } else if (errorMessage.includes('plano necessário') || errorMessage.includes('subscription required')) {
          toast({
            title: "Assinatura necessária",
            description: "Este agente requer um plano ativo.",
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
        
        return;
      }

      setResult(data.content);
      saveGeneration('banner', data.content, formData);
      toast({ title: "Banner criado!", description: "Seu conceito de banner foi gerado com sucesso." });
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copiado!", description: "Conceito copiado." });
  };

  const handleGenerateVariation = () => {
    setResult("");
    handleSubmit(new Event('submit') as any);
  };

  const handleReuseData = (historicalFormData: Record<string, string>) => {
    setFormData(prev => ({
      ...prev,
      ...historicalFormData
    }));
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <Image className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">CRIADOR DE BANNER</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Design Profissional
            </p>
            <Badge variant="secondary" className="mt-2">Estilo: Profissional</Badge>
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

          <div className={isMobile ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
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

                  <Button type="submit" className={`w-full ${buttonMinHeight}`} disabled={loading} variant="gradient" size={touchSize}>
                    {loading ? (
                      <>
                        <Loader2 className={`${iconSize} mr-2 animate-spin`} />
                        {isMobile ? "Gerando..." : "Gerando... (pode levar até 15s)"}
                      </>
                    ) : (
                      "Gerar Banner"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seu Banner</span>
                   {result && (
                      <div className={isMobile ? "flex flex-col gap-3" : "flex gap-2"}>
                        <Button variant="outline" size={touchSize} onClick={handleGenerateVariation} className={buttonMinHeight}>
                          <RefreshCw className={`${iconSize} mr-2`} />Gerar Variação
                        </Button>
                        <Button variant="outline" size={touchSize} onClick={copyToClipboard} className={buttonMinHeight}>
                          <Copy className={`${iconSize} mr-2`} />Copiar
                        </Button>
                        <ExportButtons
                          content={result}
                          agentType="banner"
                        />
                        <FavoriteButton
                          agentType="banner"
                          content={result}
                          formData={formData}
                          size={touchSize}
                        />
                      </div>
                   )}
                </CardTitle>
                <CardDescription>
                  Conceito completo e prompt para IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="text-center text-muted-foreground text-sm mt-4">
                      <Loader2 className={`${isMobile ? "w-6 h-6" : "w-5 h-5"} animate-spin mx-auto mb-2`} />
                      <p className={isMobile ? "text-base font-medium" : ""}>
                        {isMobile ? "Gerando..." : "Gerando conceito... pode levar até 15 segundos"}
                      </p>
                      {isMobile && <p className="text-xs text-muted-foreground mt-1">Aguarde 10-15s</p>}
                    </div>
                  </div>
                ) : result ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{result}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Preencha o formulário para gerar seu banner profissional</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}