import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteInteracao() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    publico_alvo: "",
    produto: "",
    acao_desejada: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          agentType: 'interacao',
          formData,
          userId: null
        }
      });

      if (error) throw error;
      setResult(data.content);

      toast({ title: "Stories criados!", description: "Sua sequência de stories foi gerada." });
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro ao gerar conteúdo", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copiado!", description: "Stories copiados." });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <MessageCircle className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Agente INTERAÇÃO</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Crie sequência de stories provocativos para engajamento
            </p>
            <Badge variant="secondary" className="mt-2">Estilo: Rafael Bem</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Informações para Stories Interativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="publico_alvo">Público-Alvo</Label>
                    <Input 
                      id="publico_alvo" 
                      value={formData.publico_alvo} 
                      onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})} 
                      placeholder="Ex: Mulheres de 25-40 anos interessadas em beleza"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="produto">Produto/Serviço</Label>
                    <Input 
                      id="produto" 
                      value={formData.produto} 
                      onChange={(e) => setFormData({...formData, produto: e.target.value})} 
                      placeholder="Ex: Curso de maquiagem profissional"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="acao_desejada">Ação Desejada</Label>
                    <Textarea 
                      id="acao_desejada" 
                      value={formData.acao_desejada} 
                      onChange={(e) => setFormData({...formData, acao_desejada: e.target.value})} 
                      placeholder="Ex: Inscrever-se no curso, baixar e-book, seguir perfil, participar de live"
                      rows={3}
                      required 
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                    {loading ? "Criando..." : "Gerar Stories"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Stories de Interação</span>
                  {result && <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="w-4 h-4 mr-2" />Copiar</Button>}
                </CardTitle>
                <CardDescription>
                  Sequência provocativa para máximo engajamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{result}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Preencha o formulário para gerar sua sequência de stories interativos</p>
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