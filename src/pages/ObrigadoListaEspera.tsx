import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  MessageCircle, 
  Share2, 
  Sparkles,
  Heart,
  Bell
} from 'lucide-react';

export default function ObrigadoListaEspera() {
  const [showConfetti, setShowConfetti] = useState(true);

  // Link do grupo do WhatsApp - configurável
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/SEU_LINK_AQUI';

  useEffect(() => {
    // Esconder confete após 3 segundos
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleWhatsAppClick = () => {
    window.open(WHATSAPP_GROUP_LINK, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Lista de Espera - Agência no Bolso',
      text: 'Acabei de entrar na lista de espera da Agência no Bolso! 🚀 Entre você também:',
      url: window.location.origin + '/lista-espera'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copiar link
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`
        );
        alert('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const proximosPassos = [
    {
      icon: MessageCircle,
      title: "Entre no Grupo VIP",
      description: "Receba conteúdos exclusivos e novidades em primeira mão."
    },
    {
      icon: Bell,
      title: "Aguarde Nossa Mensagem",
      description: "Você receberá um email quando as inscrições abrirem."
    },
    {
      icon: Share2,
      title: "Compartilhe com Amigos",
      description: "Indique amigos e ganhe benefícios extras!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Confete animado */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Efeitos de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.15),transparent_50%)]" />
      
      <div className="relative px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          {/* Ícone de sucesso animado */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Você está na lista! 🎉
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Parabéns! Seu cadastro foi confirmado. Agora você faz parte de um 
            grupo exclusivo de empreendedores visionários.
          </p>

          {/* Card principal - WhatsApp */}
          <Card className="mb-6 border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10 shadow-xl shadow-green-500/10">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20">
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Entre no Grupo VIP do WhatsApp
              </h2>
              <p className="text-muted-foreground mb-6">
                Receba conteúdos exclusivos, dicas e seja avisado em primeira mão 
                quando abrirmos as inscrições!
              </p>
              <Button 
                size="lg" 
                className="w-full md:w-auto h-14 px-8 text-base font-semibold bg-green-500 hover:bg-green-600"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Entrar no Grupo VIP
              </Button>
            </CardContent>
          </Card>

          {/* Card secundário - Compartilhar */}
          <Card className="mb-12 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-foreground">Indique amigos!</h3>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe e ganhe benefícios extras quando abrirmos.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Próximos passos */}
          <div className="text-left">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">
              Próximos Passos
            </h2>
            <div className="space-y-4">
              {proximosPassos.map((passo, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                    <passo.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{passo.title}</h3>
                    <p className="text-sm text-muted-foreground">{passo.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensagem final */}
          <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
            <p className="text-foreground font-medium">
              Obrigado por confiar em nós! Estamos preparando algo incrível para você.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Fique de olho no seu email e no grupo do WhatsApp para não perder nada.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Agência no Bolso. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
