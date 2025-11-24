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
import { Link as LinkIcon, Sparkles, Copy, Loader2, RefreshCw, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";

export default function AgenteConexao() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const { saveGeneration } = useGenerationHistory();
  const [formData, setFormData] = useState({
    nome_negocio: "",
    produto: "",
    objetivo_story: "",
    publico_alvo: "",
    tom: "",
    link_ou_acao: ""
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
          agentType: 'conexao',
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
      saveGeneration('conexao', data.content, formData);
      toast({ title: "Stories criados!", description: "Sua sequência de conexão foi gerada com sucesso." });
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
    toast({ title: "Copiado!", description: "Stories copiados." });
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
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <LinkIcon className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Agente CONEXÃO</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Crie stories criativos para gerar vínculo emocional e humanização da marca
            </p>
            <Badge variant="secondary" className="mt-2">Estilo: Humanização</Badge>
          </div>

          <div className="mb-8 max-w-md mx-auto">
            <TrialStatusCard />
            <SubscriptionStatusCard />
          </div>

          <div className="mb-6 flex justify-center">
            <GenerationHistoryDialog 
              currentAgentType="conexao"
              onReuse={handleReuseData}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Informações para Conexão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <TooltipProvider>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="nome_negocio">Nome do Negócio/Marca</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>O nome que identifica seu negócio ou marca pessoal</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input value={formData.nome_negocio} onChange={(e) => setFormData({...formData, nome_negocio: e.target.value})} required />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="produto">Produto/Serviço</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Descreva o que você oferece de forma clara e objetiva</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input 
                        id="produto" 
                        value={formData.produto} 
                        onChange={(e) => setFormData({...formData, produto: e.target.value})} 
                        placeholder="Ex: Consultoria em desenvolvimento pessoal"
                        required 
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="objetivo_story">Objetivo do Story</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Qual emoção você quer despertar? Ex: identificação, confiança</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Textarea 
                        id="objetivo_story" 
                        value={formData.objetivo_story} 
                        onChange={(e) => setFormData({...formData, objetivo_story: e.target.value})} 
                        placeholder="Ex: Mostrar bastidores do trabalho, humanizar a marca, criar identificação"
                        rows={3}
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
                            <p>Quem você quer conectar com sua história?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input 
                        id="publico_alvo" 
                        value={formData.publico_alvo} 
                        onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})} 
                        placeholder="Ex: Pessoas que buscam crescimento pessoal"
                        required 
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="tom">Tom de Voz</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Escolha o estilo de comunicação que melhor se encaixa</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={formData.tom} onValueChange={(value) => setFormData({...formData, tom: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pessoal">Pessoal e Próximo</SelectItem>
                          <SelectItem value="inspirador">Inspirador</SelectItem>
                          <SelectItem value="autentico">Autêntico e Vulnerável</SelectItem>
                          <SelectItem value="motivacional">Motivacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="link_ou_acao">Link ou Ação Desejada</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Onde direcionar o público após criar conexão?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input 
                        id="link_ou_acao" 
                        value={formData.link_ou_acao} 
                        onChange={(e) => setFormData({...formData, link_ou_acao: e.target.value})} 
                        placeholder="Ex: Link para o site, DM, agendar conversa"
                      />
                    </div>
                  </TooltipProvider>

                  <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando... (pode levar até 15s)
                      </>
                    ) : (
                      "Gerar Stories de Conexão"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Stories de Conexão</span>
                  {result && (
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={handleGenerateVariation}>
                         <RefreshCw className="w-4 h-4 mr-2" />Gerar Variação
                       </Button>
                       <Button variant="outline" size="sm" onClick={copyToClipboard}>
                         <Copy className="w-4 h-4 mr-2" />Copiar
                       </Button>
                       <ExportButtons
                         content={result}
                         agentType="conexao"
                         size="sm"
                       />
                       <FavoriteButton
                         agentType="conexao"
                         content={result}
                         formData={formData}
                         size="sm"
                       />
                     </div>
                  )}
                </CardTitle>
                <CardDescription>
                  Cenas para criar vínculo emocional autêntico
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
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Gerando stories... pode levar até 15 segundos
                    </div>
                  </div>
                ) : result ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{result}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Preencha o formulário para gerar sua sequência de conexão</p>
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