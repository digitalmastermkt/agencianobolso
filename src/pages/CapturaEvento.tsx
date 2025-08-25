import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Calendar, MapPin, Video, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CapturaEvento() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email para se inscrever.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simular envio do formulário
    setTimeout(() => {
      toast({
        title: "Inscrição confirmada!",
        description: "Você receberá os detalhes do evento por email.",
      });
      setNome("");
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  const beneficios = [
    "Tenha uma agência digital 24h no seu bolso",
    "Reduza custos com marketing sem perder resultados",
    "Estratégias práticas para gerar mais clientes e vendas"
  ];

  const aprendizado = [
    "Como usar agentes de IA para criar campanhas de marketing digital.",
    "As mesmas estratégias que grandes agências usam – agora acessíveis para pequenos e médios empresários.",
    "Como transformar seguidores em clientes usando automação inteligente."
  ];

  const depoimentos = [
    {
      texto: "Depois que conheci a Agência no Bolso, reduzi meus custos e consegui rodar campanhas que antes só uma agência faria.",
      autor: "João, dono de loja de roupas"
    },
    {
      texto: "Economizei tempo e finalmente comecei a vender online sem complicação.",
      autor: "Carla, clínica de estética"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Seção Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-creative opacity-10"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              🚀 Empresário 4.0 – Como a IA Está Mudando o Jogo do Marketing
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              O poder de uma agência completa na palma da sua mão
            </p>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">11 de setembro</span>
            </div>
          </div>

          <Card className="max-w-md mx-auto shadow-creative">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">👉 Garanta sua vaga gratuita agora mesmo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Seu melhor email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="gradient"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processando..." : "Quero participar do evento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Seção Benefícios */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Por que participar deste evento?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {beneficios.map((beneficio, index) => (
              <Card key={index} className="text-center shadow-card hover:shadow-creative transition-all">
                <CardContent className="pt-6">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-lg">{beneficio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Aprendizado */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            No evento você vai descobrir:
          </h2>
          <div className="space-y-6">
            {aprendizado.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-card rounded-lg shadow-card">
                <div className="bg-gradient-primary text-primary-foreground rounded-full p-2 flex-shrink-0">
                  <span className="font-bold text-lg">{index + 1}</span>
                </div>
                <p className="text-lg">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Prova Social */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Empresários como você já estão transformando seus negócios
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {depoimentos.map((depoimento, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-lg mb-4 italic">"{depoimento.texto}"</p>
                  <p className="font-semibold text-primary">– {depoimento.autor}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full">
              <Users className="h-6 w-6" />
              <span className="font-bold text-lg">+500 empresários já testaram a Agência no Bolso</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Detalhes do Evento */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-creative">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Detalhes do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Calendar className="h-12 w-12 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">Data e hora</p>
                    <p className="text-muted-foreground">11 de setembro – Em breve o horário</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <MapPin className="h-12 w-12 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">Local</p>
                    <p className="text-muted-foreground">Online e gratuito</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Video className="h-12 w-12 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">Acesso</p>
                    <p className="text-muted-foreground">Exclusivo para inscritos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-creative opacity-20"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Garanta sua vaga gratuita agora mesmo
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Não perca a chance de descobrir como a Inteligência Artificial pode transformar o marketing da sua empresa.
          </p>
          <Button 
            size="xl" 
            variant="secondary"
            className="text-xl font-bold shadow-glow animate-glow"
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Quero minha vaga no Empresário 4.0
          </Button>
        </div>
      </section>

      {/* Seção Garantia */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Shield className="h-12 w-12 text-primary" />
            <div>
              <p className="text-2xl font-bold">Evento 100% gratuito</p>
              <p className="text-muted-foreground">Sem spam. Você pode sair da lista a qualquer momento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="py-8 px-4 border-t bg-card/50">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground mb-4">
            © 2025 Agência no Bolso – Todos os direitos reservados
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
}