import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AgenteVendas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [formData, setFormData] = useState({
    nome_negocio: "",
    produto: "",
    localizacao: "",
    publico_alvo: "",
    beneficio: "",
    prova_social: "",
    oferta: "",
    tom: "persuasivo"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          agentType: 'vendas',
          formData,
          userId: user?.id
        }
      });

      if (error) throw error;
      setResult(data.content);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Agente VENDAS</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Crie vídeos curtos persuasivos no estilo Bruno Ladeira
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Seu Negócio</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome_negocio">Nome do Negócio</Label>
                    <Input
                      id="nome_negocio"
                      value={formData.nome_negocio}
                      onChange={(e) => setFormData({...formData, nome_negocio: e.target.value})}
                      placeholder="Ex: Pizzaria do João"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="produto">Produto/Serviço</Label>
                    <Input
                      id="produto"
                      value={formData.produto}
                      onChange={(e) => setFormData({...formData, produto: e.target.value})}
                      placeholder="Ex: Pizza artesanal com delivery"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                      placeholder="Ex: Centro de São Paulo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publico_alvo">Público-Alvo</Label>
                    <Input
                      id="publico_alvo"
                      value={formData.publico_alvo}
                      onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})}
                      placeholder="Ex: Famílias com filhos, 25-45 anos"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="beneficio">Principal Benefício</Label>
                    <Textarea
                      id="beneficio"
                      value={formData.beneficio}
                      onChange={(e) => setFormData({...formData, beneficio: e.target.value})}
                      placeholder="Ex: Pizza entregue em 20min, quentinha e com ingredientes frescos"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="prova_social">Prova Social</Label>
                    <Input
                      id="prova_social"
                      value={formData.prova_social}
                      onChange={(e) => setFormData({...formData, prova_social: e.target.value})}
                      placeholder="Ex: Mais de 1000 clientes satisfeitos"
                    />
                  </div>

                  <div>
                    <Label htmlFor="oferta">Oferta Especial</Label>
                    <Input
                      id="oferta"
                      value={formData.oferta}
                      onChange={(e) => setFormData({...formData, oferta: e.target.value})}
                      placeholder="Ex: 2 pizzas por R$ 49,90 hoje"
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
                        <SelectItem value="persuasivo">Persuasivo</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="amigavel">Amigável</SelectItem>
                        <SelectItem value="profissional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando roteiro...
                      </>
                    ) : (
                      "Gerar Roteiro de Vendas"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle>Seu Roteiro de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-subtle p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => navigator.clipboard.writeText(result)}
                      className="w-full"
                    >
                      Copiar Roteiro
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Preencha o formulário para gerar seu roteiro de vendas personalizado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}