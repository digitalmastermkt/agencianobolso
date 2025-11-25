import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Bell } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const handleInstall = async () => {
    await installApp();
    // Show notification prompt after successful install
    if (isSupported && permission === 'default') {
      setTimeout(() => setShowNotificationPrompt(true), 1000);
    }
  };

  const handleNotificationRequest = async () => {
    await requestPermission();
    setShowNotificationPrompt(false);
  };

  if ((!isInstallable && !showNotificationPrompt) || isDismissed) {
    return null;
  }

  // Show notification prompt
  if (showNotificationPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto z-50 animate-fade-in">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm mx-auto md:mx-0">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Ativar Notificações
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNotificationPrompt(false);
                    setIsDismissed(true);
                  }}
                  className="h-6 w-6 p-0 hover:bg-muted shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Receba atualizações e novidades direto no seu dispositivo
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleNotificationRequest}
                  size="sm" 
                  className="flex-1 text-xs"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Permitir
                </Button>
                <Button 
                  onClick={() => setShowNotificationPrompt(false)}
                  size="sm" 
                  variant="outline"
                  className="text-xs"
                >
                  Agora não
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm mx-auto md:mx-0">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Instalar App
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="h-6 w-6 p-0 hover:bg-muted shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Instale a Agência no Bolso no seu dispositivo para acesso rápido e offline
            </p>
            
            <Button 
              onClick={handleInstall}
              size="sm" 
              className="w-full text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Instalar Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};