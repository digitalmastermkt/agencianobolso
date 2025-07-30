import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteViral() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    nome_negocio: "",
    produto: "",
    localizacao: "",
    publico_alvo: "",
    beneficio: "",
    oferta: "",
    tom: "jovem"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          agentType: 'viral',
          formData,
          userId: null
        }
      });

      if (error) throw error;

      setResult(data.content);
      toast({
        title: "Roteiro viral criado!",
        description: "Seu conteúdo viral foi gerado."
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro ao gerar conteúdo",
        description: "Tente novamente em alguns instantes.",
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-white">
                <Zap className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Agente VIRAL</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Crie vídeos curtos tipo Reels para viralizar nas redes sociais
            </p>
            <Badge variant="secondary" className="mt-2">Estilo: Camilo Coutinho</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Informações do Conteúdo Viral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome_negocio">Nome do Negócio</Label>
                    <Input
                      id="nome_negocio"
                      value={formData.nome_negocio}
                      onChange={(e) => setFormData({...formData, nome_negocio: e.target.value})}
                      placeholder="Ex: MinhaEmpresa"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="produto">Produto/Serviço</Label>
                    <Input
                      id="produto"
                      value={formData.produto}
                      onChange={(e) => setFormData({...formData, produto: e.target.value})}
                      placeholder="Ex: Curso de marketing digital"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                      placeholder="Ex: São Paulo, SP"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publico_alvo">Público-Alvo</Label>
                    <Input
                      id="publico_alvo"
                      value={formData.publico_alvo}
                      onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})}
                      placeholder="Ex: Jovens de 18-30 anos interessados em empreendedorismo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="beneficio">Principal Benefício</Label>
                    <Textarea
                      id="beneficio"
                      value={formData.beneficio}
                      onChange={(e) => setFormData({...formData, beneficio: e.target.value})}
                      placeholder="Ex: Aprenda a ganhar dinheiro online em 30 dias"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="oferta">Oferta</Label>
                    <Input
                      id="oferta"
                      value={formData.oferta}
                      onChange={(e) => setFormData({...formData, oferta: e.target.value})}
                      placeholder="Ex: 50% de desconto por tempo limitado"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tom">Tom de Voz</Label>
                    <Select value={formData.tom} onValueChange={(value) => setFormData({...formData, tom: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jovem">Jovem e Descontraído</SelectItem>
                        <SelectItem value="energetico">Energético</SelectItem>
                        <SelectItem value="provocativo">Provocativo</SelectItem>
                        <SelectItem value="inspirador">Inspirador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                    {loading ? "Criando..." : "Gerar Conteúdo Viral"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seu Roteiro Viral</span>
                  {result && (
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-2" />Copiar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{result}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Preencha o formulário para gerar seu roteiro viral</p>
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