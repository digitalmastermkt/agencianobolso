import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link as LinkIcon, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteConexao() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    nome_negocio: "",
    produto: "",
    objetivo_story: "",
    publico_alvo: "",
    tom: "",
    link_ou_acao: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          agentType: 'conexao',
          formData,
          userId: null
        }
      });

      if (error) throw error;
      setResult(data.content);

      toast({ title: "Stories criados!", description: "Sua sequência de conexão foi gerada." });
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
                  <div>
                    <Label htmlFor="nome_negocio">Nome do Negócio/Marca</Label>
                    <Input value={formData.nome_negocio} onChange={(e) => setFormData({...formData, nome_negocio: e.target.value})} required />
                  </div>

                  <div>
                    <Label htmlFor="produto">Produto/Serviço</Label>
                    <Input 
                      id="produto" 
                      value={formData.produto} 
                      onChange={(e) => setFormData({...formData, produto: e.target.value})} 
                      placeholder="Ex: Consultoria em desenvolvimento pessoal"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="objetivo_story">Objetivo do Story</Label>
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
                    <Label htmlFor="publico_alvo">Público-Alvo</Label>
                    <Input 
                      id="publico_alvo" 
                      value={formData.publico_alvo} 
                      onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})} 
                      placeholder="Ex: Pessoas que buscam crescimento pessoal"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="tom">Tom de Voz</Label>
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
                    <Label htmlFor="link_ou_acao">Link ou Ação Desejada</Label>
                    <Input 
                      id="link_ou_acao" 
                      value={formData.link_ou_acao} 
                      onChange={(e) => setFormData({...formData, link_ou_acao: e.target.value})} 
                      placeholder="Ex: Link para o site, DM, agendar conversa"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                    {loading ? "Criando..." : "Gerar Stories de Conexão"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Stories de Conexão</span>
                  {result && <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="w-4 h-4 mr-2" />Copiar</Button>}
                </CardTitle>
                <CardDescription>
                  Cenas para criar vínculo emocional autêntico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
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
    </Layout>
  );
}