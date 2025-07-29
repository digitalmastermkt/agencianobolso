import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Image, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteBanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    produto: "",
    publico: "",
    objetivo: "",
    estilo: "",
    cores: "",
    elementos: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prompt = `Crie um post visual estilo banner profissional para redes sociais.

PRODUTO/SERVIÇO: ${formData.produto}
PÚBLICO-ALVO: ${formData.publico}
OBJETIVO: ${formData.objetivo}
ESTILO VISUAL: ${formData.estilo}
PALETA DE CORES: ${formData.cores}
ELEMENTOS VISUAIS: ${formData.elementos}

ESTRUTURA DO BANNER:
1. COPY PUBLICITÁRIA (Texto principal do banner)
2. PROMPT PARA IA (Descrição detalhada para gerar a imagem)
3. ESPECIFICAÇÕES TÉCNICAS (Dimensões, cores, tipografia)
4. VARIAÇÕES (3 opções diferentes de copy)

DIRETRIZES PARA COPY PUBLICITÁRIA:
- Máximo 15-20 palavras
- Foco no benefício principal
- Linguagem persuasiva e direta
- Call to action claro
- Hierarquia visual definida
- Contraste para legibilidade

PROMPT DETALHADO PARA IA:
- Descrição completa da composição visual
- Estilo artístico específico
- Paleta de cores em hexadecimal
- Elementos gráficos necessários
- Tipografia sugerida
- Mood e atmosfera desejada
- Proporções e layout

ESPECIFICAÇÕES TÉCNICAS:
- Formato quadrado (1080x1080) para Instagram
- Formato retangular (1200x628) para Facebook
- Formato story (1080x1920) se aplicável
- Resolução e qualidade
- Fonte e tamanhos recomendados
- Espaçamento e margens

VARIAÇÕES DE COPY:
- Versão emocional (apela para sentimentos)
- Versão racional (foca em benefícios lógicos)
- Versão urgência (cria senso de escassez)

ELEMENTOS DE DESIGN:
- Composição visual equilibrada
- Contraste adequado para leitura
- Elementos gráficos que apoiam a mensagem
- Identidade visual consistente
- Call to action destacado

Formato: Apresente a copy principal, prompt completo para IA, especificações técnicas e as 3 variações de copy.`;

      const { data, error } = await supabase.functions.invoke('generate-ai-content', { body: { prompt } });
      if (error) throw error;
      setResult(data.generatedText);
      toast({ title: "Banner criado!", description: "Seu banner foi gerado." });
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Tente novamente.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white">
                <Image className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">CRIADOR DE BANNER</h1>
            <Badge variant="secondary">Design Profissional</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Formulário</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Produto</Label>
                    <Input value={formData.produto} onChange={(e) => setFormData({...formData, produto: e.target.value})} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                    {loading ? "Criando..." : "Gerar Banner"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                {result ? <div className="bg-muted/50 p-4 rounded-lg"><pre className="whitespace-pre-wrap text-sm">{result}</pre></div> : 
                <div className="text-center py-12"><Image className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Preencha o formulário</p></div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}