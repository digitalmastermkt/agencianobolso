import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Calendar, MapPin, Video, Shield, Sparkles, ArrowRight, Phone, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function CapturaEvento() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateBrazilianPhone = (phone: string) => {
    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it has 10 or 11 digits (with area code)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return false;
    }
    
    // Check if it starts with a valid area code (11-99)
    const areaCode = cleanPhone.substring(0, 2);
    const areaCodeNum = parseInt(areaCode);
    if (areaCodeNum < 11 || areaCodeNum > 99) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !email || !whatsapp) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para se inscrever.",
        variant: "destructive",
      });
      return;
    }

    if (!validateBrazilianPhone(whatsapp)) {
      toast({
        title: "WhatsApp inválido",
        description: "Por favor, insira um número de WhatsApp válido com DDD brasileiro (ex: 11999999999).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('event_registrations')
        .insert([
          {
            nome,
            email,
            whatsapp: whatsapp.replace(/\D/g, ''), // Store only numbers
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Send to webhook
      try {
        await fetch('https://n8n-n8n.3e5171.easypanel.host/webhook-test/agencia-no-bolso', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome,
            email,
            whatsapp: whatsapp.replace(/\D/g, ''),
            timestamp: new Date().toISOString(),
            source: 'evento-empresario-4-0'
          }),
        });
      } catch (webhookError) {
        console.error('Error sending to webhook:', webhookError);
        // Don't fail the registration if webhook fails
      }

      toast({
        title: "Inscrição confirmada!",
        description: "Redirecionando para próximos passos...",
      });
      
      navigate("/obrigado");
    } catch (error) {
      console.error('Error saving registration:', error);
      toast({
        title: "Erro ao se inscrever",
        description: "Ocorreu um erro ao processar sua inscrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
      texto: "Depois que conheci a Agência no Bolso, reduzi meus custos e consegui rodar campanhas que antes só uma agência faria. 🚀",
      autor: "João Silva",
      subtitulo: "Loja de Roupas Premium",
      tempo: "14:32",
      avatar: "J"
    },
    {
      texto: "Economizei tempo e finalmente comecei a vender online sem complicação. Agora faço R$ 15mil por mês! 💰",
      autor: "Carla Santos", 
      subtitulo: "Clínica de Estética",
      tempo: "16:47",
      avatar: "C"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Seção Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-creative opacity-20 animate-gradient bg-[length:200%_200%]"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-1000"></div>
        </div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-6 py-2 rounded-full mb-6 animate-glow">
              <Sparkles className="h-5 w-5" />
              <span className="font-bold">EVENTO EXCLUSIVO</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-creative bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
              🚀 Empresário 4.0
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold mb-6 text-foreground">
              Como a IA Está Mudando o Jogo do Marketing
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Descubra como ter <span className="text-primary font-bold">uma agência completa na palma da sua mão</span> e transformar seu negócio em 2025
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-accent text-primary-foreground px-6 py-3 rounded-full mb-8 shadow-glow">
              <Calendar className="h-6 w-6" />
              <span className="font-bold text-lg">11 de setembro • GRATUITO</span>
            </div>
          </div>

          <Card className="max-w-lg mx-auto shadow-creative border-2 border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                  <ArrowRight className="h-4 w-4" />
                  ÚLTIMAS VAGAS
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold">
                👉 Garanta sua vaga <span className="text-primary">GRATUITA</span> agora mesmo
              </CardTitle>
              <p className="text-muted-foreground mt-2">Preencha os dados abaixo e receba acesso exclusivo</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="✏️ Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full h-12 text-lg border-2 border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="📧 Seu melhor email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 text-lg border-2 border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="tel"
                    placeholder="📱 Seu WhatsApp (xx)xxxxxxxxx"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full h-12 text-lg border-2 border-primary/20 focus:border-primary"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-14 text-xl font-bold" 
                  variant="creative"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-6 w-6" />
                      QUERO PARTICIPAR DO EVENTO
                    </div>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  🔒 Seus dados estão seguros. Não fazemos spam.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Seção Benefícios */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Por que participar deste <span className="text-primary">evento?</span>
            </h2>
            <p className="text-xl text-muted-foreground">Transforme sua empresa com estratégias que realmente funcionam</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {beneficios.map((beneficio, index) => (
              <Card key={index} className="text-center shadow-creative hover:shadow-glow transition-all duration-300 hover:scale-105 border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow animate-float">
                      <CheckCircle className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-accent-foreground font-bold text-sm">{index + 1}</span>
                    </div>
                  </div>
                  <p className="text-lg font-medium leading-relaxed">{beneficio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Aprendizado */}
      <section className="py-20 px-4 bg-gradient-accent/5">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              No evento você vai <span className="text-accent">descobrir:</span>
            </h2>
            <p className="text-xl text-muted-foreground">Estratégias exclusivas que grandes agências não querem que você saiba</p>
          </div>
          <div className="space-y-8">
            {aprendizado.map((item, index) => (
              <div key={index} className="flex items-start gap-6 p-8 bg-card rounded-2xl shadow-creative border border-accent/20 hover:shadow-glow transition-all duration-300">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-accent text-primary-foreground rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow animate-glow">
                    <span className="font-bold text-2xl">{index + 1}</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-accent rounded-2xl blur opacity-20"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-medium leading-relaxed">{item}</p>
                  <div className="mt-4 flex items-center gap-2 text-accent font-semibold">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm">ESTRATÉGIA EXCLUSIVA</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Prova Social */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Empresários como você já estão <span className="text-primary">transformando</span> seus negócios
            </h2>
            <p className="text-xl text-muted-foreground">Veja o que nossos alunos estão falando</p>
          </div>
          
          {/* Depoimentos em formato WhatsApp */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {depoimentos.map((depoimento, index) => (
              <div key={index} className="max-w-md mx-auto">
                {/* Cabeçalho WhatsApp */}
                <div className="bg-[#075E54] text-white p-4 rounded-t-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700">
                    {depoimento.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{depoimento.autor}</p>
                    <p className="text-xs opacity-75">{depoimento.subtitulo}</p>
                  </div>
                  <Phone className="h-5 w-5" />
                </div>
                
                {/* Mensagem WhatsApp */}
                <div className="bg-[#E5DDD5] p-6 rounded-b-2xl min-h-[120px] relative">
                  <div className="bg-white p-4 rounded-lg shadow-sm max-w-[85%] ml-auto relative">
                    <p className="text-gray-800 text-sm leading-relaxed mb-2">{depoimento.texto}</p>
                    <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                      <span>{depoimento.tempo}</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 border-r-2 border-b-2 border-green-500 transform rotate-45 scale-75"></div>
                        <div className="w-3 h-3 border-r-2 border-b-2 border-green-500 transform rotate-45 scale-75 -ml-1"></div>
                      </div>
                    </div>
                    {/* Seta da mensagem */}
                    <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white transform rotate-45"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-primary text-primary-foreground px-8 py-4 rounded-full shadow-glow animate-glow">
              <Users className="h-8 w-8" />
              <div className="text-left">
                <p className="font-bold text-xl">+500 empresários</p>
                <p className="text-sm opacity-90">já testaram a Agência no Bolso</p>
              </div>
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
      <section className="py-24 px-4 bg-gradient-creative relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-30 animate-gradient bg-[length:200%_200%]"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        </div>
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-2 rounded-full mb-6 animate-glow">
              <Sparkles className="h-5 w-5" />
              <span className="font-bold">ÚLTIMAS HORAS!</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-glow">
              Garanta sua vaga <span className="text-yellow-300">GRATUITA</span>
            </h2>
            <p className="text-2xl text-primary-foreground/95 mb-12 max-w-4xl mx-auto leading-relaxed">
              Não perca a chance de descobrir como a <span className="font-bold text-yellow-300">Inteligência Artificial</span> pode transformar o marketing da sua empresa e <span className="font-bold">multiplicar seus resultados</span> em 2025.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <Button 
              size="xl" 
              variant="secondary"
              className="text-2xl font-bold px-16 py-6 h-auto shadow-glow animate-glow hover:scale-105 transition-transform"
              onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="flex items-center gap-3">
                <ArrowRight className="h-8 w-8" />
                QUERO MINHA VAGA NO EMPRESÁRIO 4.0
              </div>
            </Button>
            
            <div className="flex items-center gap-6 text-primary-foreground/80 text-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>100% Gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Acesso Imediato</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Conteúdo Exclusivo</span>
              </div>
            </div>
          </div>
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