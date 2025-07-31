import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Instalar App
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Instale a Agência no Bolso no seu dispositivo para acesso rápido
            </p>
            
            <Button 
              onClick={installApp}
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