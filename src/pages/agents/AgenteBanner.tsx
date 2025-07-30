import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteBanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          agentType: 'banner',
          formData,
          userId: null
        }
      });

      if (error) throw error;
      setResult(data.content);

      toast({ title: "Banner criado!", description: "Seu conceito de banner foi gerado." });
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro ao gerar conteúdo", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copiado!", description: "Conceito copiado." });
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="produto">Produto/Serviço</Label>
                    <Input 
                      id="produto" 
                      value={formData.produto} 
                      onChange={(e) => setFormData({...formData, produto: e.target.value})} 
                      placeholder="Ex: Curso de Design Gráfico"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="beneficio">Principal Benefício</Label>
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
                    <Label htmlFor="publico_alvo">Público-Alvo</Label>
                    <Input 
                      id="publico_alvo" 
                      value={formData.publico_alvo} 
                      onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})} 
                      placeholder="Ex: Jovens criativos de 18-35 anos"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="identidade_visual">Identidade Visual</Label>
                    <Input 
                      id="identidade_visual" 
                      value={formData.identidade_visual} 
                      onChange={(e) => setFormData({...formData, identidade_visual: e.target.value})} 
                      placeholder="Ex: Moderno, minimalista, cores vibrantes"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="objetivo_post">Objetivo do Post</Label>
                    <Input 
                      id="objetivo_post" 
                      value={formData.objetivo_post} 
                      onChange={(e) => setFormData({...formData, objetivo_post: e.target.value})} 
                      placeholder="Ex: Gerar inscrições no curso"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="formato_imagem">Formato</Label>
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
                    <Label htmlFor="imagem_produto">Imagem do Produto</Label>
                    <Input 
                      id="imagem_produto" 
                      value={formData.imagem_produto} 
                      onChange={(e) => setFormData({...formData, imagem_produto: e.target.value})} 
                      placeholder="Ex: Mockup de computador, pessoa estudando"
                    />
                  </div>

                  <div>
                    <Label htmlFor="informacoes_obrigatorias">Informações Obrigatórias</Label>
                    <Textarea 
                      id="informacoes_obrigatorias" 
                      value={formData.informacoes_obrigatorias} 
                      onChange={(e) => setFormData({...formData, informacoes_obrigatorias: e.target.value})} 
                      placeholder="Ex: Preço, data limite, contato"
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                    {loading ? "Criando..." : "Gerar Banner"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seu Banner</span>
                  {result && <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="w-4 h-4 mr-2" />Copiar</Button>}
                </CardTitle>
                <CardDescription>
                  Conceito completo e prompt para IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
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