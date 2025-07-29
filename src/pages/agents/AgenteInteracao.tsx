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
    nicho: "",
    objetivo: "",
    publicoAlvo: "",
    tipoEngajamento: "",
    quantidadeStories: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prompt = `Crie uma sequência de stories provocativos para engajamento seguindo o estilo Rafael Bem.

NICHO: ${formData.nicho}
OBJETIVO: ${formData.objetivo}
PÚBLICO-ALVO: ${formData.publicoAlvo}
TIPO DE ENGAJAMENTO: ${formData.tipoEngajamento}
QUANTIDADE DE STORIES: ${formData.quantidadeStories}

ESTRUTURA DA SEQUÊNCIA:
1. STORY PROVOCATIVO (Desperta curiosidade inicial)
2. DESENVOLVIMENTO (Aprofunda o tema com perguntas)
3. INTERAÇÃO DIRETA (Enquetes, perguntas abertas, quiz)
4. ENGAJAMENTO AVANÇADO (Convida para ação específica)
5. FECHAMENTO (CTA para próximos stories/posts)

DIRETRIZES PARA MÁXIMA INTERAÇÃO:
- Use perguntas controversas mas respeitosas
- Crie enquetes que dividem opiniões
- Faça perguntas que geram identificação
- Use "Responda nos comentários" estrategicamente
- Inclua elementos de urgência e escassez
- Crie senso de comunidade e pertencimento
- Use gatilhos emocionais para respostas

ELEMENTOS INTERATIVOS:
- Enquetes polêmicas (sim/não, isso/aquilo)
- Perguntas abertas que geram debate
- Quiz com resultados personalizados
- "Conte sua experiência"
- "Marca alguém que..."
- Caixinha de perguntas direcionadas

TIMING E SWIPE:
- Indica quando postar cada story
- Como conectar um story ao próximo
- Momento ideal para CTA
- Como manter a audiência até o final

CALL TO ACTIONS EFETIVOS:
- Para comentários no feed
- Para compartilhamento
- Para salvamento
- Para seguir o perfil
- Para ativar notificações

Formato: Apresente cada story numerado com texto, elementos interativos, timing sugerido e objetivo específico.`;

      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: { prompt }
      });

      if (error) throw error;
      setResult(data.generatedText);
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
              <CardHeader><CardTitle>Formulário</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nicho">Nicho</Label>
                    <Input id="nicho" value={formData.nicho} onChange={(e) => setFormData({...formData, nicho: e.target.value})} required />
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
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{result}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Preencha o formulário</p>
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