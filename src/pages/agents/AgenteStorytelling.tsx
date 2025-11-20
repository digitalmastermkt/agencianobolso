import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TrialStatusCard } from "@/components/TrialStatusCard";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastAction } from "@/components/ui/toast";
import { Heart, Sparkles, Copy, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AgenteStorytelling() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    produto: "",
    publico_alvo: "",
    situacao_vida: "",
    valores_marca: "",
    objetivo_emocional: ""
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
          agentType: 'storytelling',
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
      toast({
        title: "Roteiro criado com sucesso!",
        description: "Seu conteúdo de storytelling foi gerado com sucesso."
      });
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
    toast({
      title: "Copiado!",
      description: "Roteiro copiado para a área de transferência."
    });
  };

  const handleGenerateVariation = () => {
    setResult("");
    handleSubmit(new Event('submit') as any);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                <Heart className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Agente STORYTELLING
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Crie mini-roteiros emocionais que conectam com seu público através de histórias autênticas
            </p>
            <Badge variant="secondary" className="mt-2">
              Estilo: Leandro Aguiari
            </Badge>
          </div>

          <div className="mb-8 max-w-md mx-auto">
            <TrialStatusCard />
            <SubscriptionStatusCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Informações do Storytelling
                </CardTitle>
                <CardDescription>
                  Preencha os dados para criar seu roteiro emocional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="produto">Produto/Serviço</Label>
                    <Input
                      id="produto"
                      value={formData.produto}
                      onChange={(e) => setFormData({...formData, produto: e.target.value})}
                      placeholder="Ex: Curso de desenvolvimento pessoal"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="publicoAlvo">Público-Alvo</Label>
                    <Input
                      id="publicoAlvo"
                      value={formData.publico_alvo}
                      onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})}
                      placeholder="Ex: Mulheres de 25-40 anos que buscam autoestima"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="situacaoVida">Situação de Vida (Contexto)</Label>
                    <Textarea
                      id="situacaoVida"
                      value={formData.situacao_vida}
                      onChange={(e) => setFormData({...formData, situacao_vida: e.target.value})}
                      placeholder="Ex: Pessoas que se sentem perdidas na carreira, com baixa autoestima..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="valoresMarca">Valores da Marca</Label>
                    <Input
                      id="valoresMarca"
                      value={formData.valores_marca}
                      onChange={(e) => setFormData({...formData, valores_marca: e.target.value})}
                      placeholder="Ex: Autenticidade, empoderamento, transformação"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="objetivoEmocional">Objetivo Emocional</Label>
                    <Input
                      id="objetivoEmocional"
                      value={formData.objetivo_emocional}
                      onChange={(e) => setFormData({...formData, objetivo_emocional: e.target.value})}
                      placeholder="Ex: Inspirar esperança e despertar coragem para mudança"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    variant="gradient"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando... (pode levar até 15s)
                      </>
                    ) : (
                      "Gerar Storytelling"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Resultado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seu Roteiro de Storytelling</span>
                  {result && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateVariation}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Gerar Variação
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  Roteiro otimizado para conexão emocional
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
                      Gerando storytelling... pode levar até 15 segundos
                    </div>
                  </div>
                ) : result ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">
                      {result}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Preencha o formulário para gerar seu roteiro de storytelling</p>
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