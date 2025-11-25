import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Bell, Wifi, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Install() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const navigate = useNavigate();

  const handleInstall = async () => {
    await installApp();
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  const features = [
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Acesse seus conteúdos mesmo sem conexão com a internet'
    },
    {
      icon: Zap,
      title: 'Carregamento Rápido',
      description: 'Experiência otimizada com carregamento instantâneo'
    },
    {
      icon: Bell,
      title: 'Notificações Push',
      description: 'Receba atualizações e novidades em tempo real'
    },
    {
      icon: Shield,
      title: 'Seguro e Confiável',
      description: 'Seus dados protegidos com tecnologia de ponta'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-12 lg:py-20">
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Instale a Agência no Bolso
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transforme sua experiência com nosso app instalável. Acesso rápido, 
            funciona offline e notificações em tempo real.
          </p>
        </div>

        {isInstalled ? (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                App já instalado!
              </CardTitle>
              <CardDescription>
                Você já tem a Agência no Bolso instalada no seu dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Ir para o Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : isInstallable ? (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle>Pronto para instalar</CardTitle>
              <CardDescription>
                Clique no botão abaixo para adicionar o app à sua tela inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleInstall} size="lg" className="w-full">
                <Download className="w-5 h-5 mr-2" />
                Instalar Agora
              </Button>
              
              {isSupported && permission === 'default' && (
                <Button 
                  onClick={requestPermission} 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                >
                  <Bell className="w-5 h-5 mr-2" />
                  Ativar Notificações
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-muted">
            <CardHeader>
              <CardTitle>Como instalar</CardTitle>
              <CardDescription>
                Siga as instruções do seu navegador para instalar o app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">No Chrome (Android/Desktop):</p>
                <p className="text-sm text-muted-foreground">
                  Menu (⋮) → Instalar app ou Adicionar à tela inicial
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">No Safari (iOS):</p>
                <p className="text-sm text-muted-foreground">
                  Compartilhar → Adicionar à Tela de Início
                </p>
              </div>
              
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
                Continuar no navegador
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-muted">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
