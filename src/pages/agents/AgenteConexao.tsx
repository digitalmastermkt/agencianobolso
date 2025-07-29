import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteConexao() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    marca: "",
    valores: "",
    momentosPessoais: "",
    publicoAlvo: "",
    objetivoConexao: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prompt = `Crie stories criativos para gerar vínculo emocional e humanização da marca.

MARCA/PESSOA: ${formData.marca}
VALORES: ${formData.valores}
MOMENTOS PESSOAIS: ${formData.momentosPessoais}
PÚBLICO-ALVO: ${formData.publicoAlvo}
OBJETIVO DE CONEXÃO: ${formData.objetivoConexao}

ESTRATÉGIA DE BASTIDORES AUTÊNTICOS:
1. HUMANIZAÇÃO (Mostra lado pessoal/vulnerável)
2. BASTIDORES (Processo, rotina, desafios)
3. VALORES EM AÇÃO (Como pratica o que prega)
4. MOMENTOS REAIS (Situações genuínas do dia a dia)
5. CONEXÃO EMOCIONAL (Identificação com o público)

TIPOS DE STORIES PARA CONEXÃO:
- Bastidores da criação/trabalho
- Momentos de vulnerabilidade autêntica
- Rotinas e hábitos pessoais
- Desafios e como os supera
- Momentos família/amigos
- Falhas e aprendizados
- Reflexões profundas
- Gratidão e celebrações simples

DIRETRIZES PARA VÍNCULO EMOCIONAL:
- Seja genuinamente autêntico
- Mostre imperfeições humanas
- Compartilhe processos, não só resultados
- Use linguagem próxima e pessoal
- Inclua momentos de humor natural
- Demonstre valores através de ações
- Crie identificação com situações comuns
- Mostre crescimento e evolução

ELEMENTOS DE HUMANIZAÇÃO:
- Erros e como lida com eles
- Medos e inseguranças reais
- Momentos de alegria simples
- Rotinas pessoais
- Relacionamentos importantes
- Hobbies e interesses pessoais
- Reflexões e questionamentos

CALL TO ACTION PARA CONEXÃO:
- "Você também se sente assim?"
- "Quem mais passa por isso?"
- "Conta sua experiência"
- "O que você faria?"
- Convites para conversa genuína

Formato: Apresente uma sequência de 7-10 stories com descrição do conteúdo, tom de voz, elementos visuais sugeridos e objetivo de cada story.`;

      const { data, error } = await supabase.functions.invoke('generate-ai-content', { body: { prompt } });
      if (error) throw error;
      setResult(data.generatedText);
      toast({ title: "Stories criados!", description: "Sua sequência foi gerada." });
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
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                <LinkIcon className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Agente CONEXÃO</h1>
            <Badge variant="secondary">Bastidores Autênticos</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Formulário</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Marca</Label>
                    <Input value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                    {loading ? "Criando..." : "Gerar Stories"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                {result ? <div className="bg-muted/50 p-4 rounded-lg"><pre className="whitespace-pre-wrap text-sm">{result}</pre></div> : 
                <div className="text-center py-12"><LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Preencha o formulário</p></div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}