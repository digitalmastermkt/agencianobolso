import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteViral() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    tema: "",
    publicoAlvo: "",
    tipoConteudo: "",
    duracaoSegundos: "",
    palavrasChave: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prompt = `Crie um roteiro viral para Reels/TikTok seguindo o estilo Camilo Coutinho.

TEMA: ${formData.tema}
PÚBLICO-ALVO: ${formData.publicoAlvo}
TIPO DE CONTEÚDO: ${formData.tipoConteudo}
DURAÇÃO: ${formData.duracaoSegundos} segundos
PALAVRAS-CHAVE: ${formData.palavrasChave}

ESTRUTURA VIRAL:
1. HOOK VIRAL (0-3s): Gancho irresistível que prende atenção
2. DESENVOLVIMENTO (3-20s): Conteúdo de valor com ritmo acelerado  
3. CLÍMAX (20-25s): Momento mais impactante/revelação
4. FECHAMENTO (25-30s): CTA viral ou convite para engagement

DIRETRIZES PARA VIRALIZAÇÃO:
- Hook nos primeiros 3 segundos que cause curiosidade extrema
- Ritmo acelerado com cortes dinâmicos a cada 2-3 segundos
- Use trends atuais e sons populares
- Inclua elementos de surpresa ou plot twist
- Linguagem jovem e descontraída
- Momento de tensão seguido de alívio
- Call to action que incentive compartilhamento

TIMING DE CORTES:
- Indique exatamente onde fazer os cortes para manter atenção
- Sincronize com beats da música se aplicável
- Use close-ups, zoom-ins e mudanças de ângulo

HASHTAGS ESTRATÉGICAS:
- Inclua 5-8 hashtags virais relevantes
- Mix de hashtags grandes e de nicho
- Inclua hashtags trending do momento

Formato: Apresente o roteiro com timing exato, indicações de corte, sugestões de áudio e hashtags.`;

      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: { prompt }
      });

      if (error) throw error;

      setResult(data.generatedText);
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
    <Layout>
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
                    <Label htmlFor="tema">Tema</Label>
                    <Input
                      id="tema"
                      value={formData.tema}
                      onChange={(e) => setFormData({...formData, tema: e.target.value})}
                      placeholder="Ex: Dicas de produtividade"
                      required
                    />
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
    </Layout>
  );
}