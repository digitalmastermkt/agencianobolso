import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageCircle, Calendar, Sparkles, ArrowRight, Users, Clock } from "lucide-react";

export default function Obrigado() {
  const handleWhatsAppClick = () => {
    window.open("https://chat.whatsapp.com/FnTdw5NTChJFbn9zXLK65O?mode=ems_copy_t", "_blank");
  };

  const handleCalendarClick = () => {
    const startDate = new Date("2025-09-11T19:00:00");
    const endDate = new Date("2025-09-11T21:00:00");
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Empresário 4.0 - Como a IA Está Mudando o Jogo do Marketing&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Evento online gratuito sobre como usar IA para transformar o marketing da sua empresa. Acesso via WhatsApp.&location=Online`;
    
    window.open(googleCalendarUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-creative opacity-20 animate-gradient bg-[length:200%_200%]"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-1000"></div>
        </div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-full mb-8 shadow-glow animate-glow">
              <CheckCircle className="h-12 w-12 text-primary-foreground" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-creative bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
              🎉 Parabéns!
            </h1>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-6 text-foreground">
              Sua vaga está confirmada!
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Você está inscrito no <span className="text-primary font-bold">Empresário 4.0</span>. 
              Agora complete os próximos passos para garantir que não perca nada!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Card WhatsApp */}
            <Card className="shadow-creative border-2 border-green-500/20 bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 animate-glow">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  <span className="text-green-600">PASSO 1:</span> Entre no Grupo
                </CardTitle>
                <p className="text-muted-foreground">
                  Receba atualizações exclusivas e tire suas dúvidas
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={handleWhatsAppClick}
                  className="w-full h-14 text-lg font-bold bg-green-500 hover:bg-green-600 text-white shadow-glow"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-6 w-6" />
                    ENTRAR NO GRUPO WHATSAPP
                  </div>
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  ✅ Conteúdos exclusivos<br/>
                  ✅ Suporte direto<br/>
                  ✅ Link do evento
                </p>
              </CardContent>
            </Card>

            {/* Card Calendário */}
            <Card className="shadow-creative border-2 border-primary/20 bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4 animate-glow shadow-glow">
                  <Calendar className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  <span className="text-primary">PASSO 2:</span> Marque na Agenda
                </CardTitle>
                <p className="text-muted-foreground">
                  Não esqueça a data do evento
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={handleCalendarClick}
                  variant="gradient"
                  className="w-full h-14 text-lg font-bold shadow-glow"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6" />
                    ADICIONAR AO GOOGLE AGENDA
                  </div>
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  📅 11 de setembro<br/>
                  ⏰ Horário em breve<br/>
                  🎥 100% Online
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Evento */}
          <Card className="shadow-creative bg-gradient-accent/5 border-accent/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <Sparkles className="h-8 w-8 text-accent" />
                O que te espera no evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold">Networking Exclusivo</h3>
                  <p className="text-sm text-muted-foreground">Conecte-se com outros empresários</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-bold">Conteúdo Prático</h3>
                  <p className="text-sm text-muted-foreground">Estratégias que você pode usar hoje</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-bold">Acesso Vitalício</h3>
                  <p className="text-sm text-muted-foreground">Gravação disponível após o evento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Final */}
          <div className="text-center mt-12 p-8 bg-gradient-creative rounded-2xl shadow-glow">
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              🚀 Prepare-se para transformar seu negócio!
            </h3>
            <p className="text-lg text-primary-foreground/90 mb-6">
              Em breve você receberá todas as informações no WhatsApp
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={handleWhatsAppClick}
                variant="secondary"
                size="xl"
                className="font-bold animate-glow"
              >
                <MessageCircle className="h-6 w-6 mr-2" />
                ENTRAR NO GRUPO AGORA
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}