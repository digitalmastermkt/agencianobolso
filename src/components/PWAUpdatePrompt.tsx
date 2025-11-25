import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdatePrompt = () => {
  const { showUpdatePrompt, updateApp, dismissUpdate } = usePWAUpdate();

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-50 animate-fade-in">
      <Alert className="max-w-md bg-card border-primary/50 shadow-lg">
        <RefreshCw className="h-4 w-4 text-primary" />
        <AlertTitle className="flex items-center justify-between">
          <span>Atualização Disponível</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissUpdate}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">
            Uma nova versão do app está disponível com melhorias e correções.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={updateApp} 
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar Agora
            </Button>
            <Button 
              onClick={dismissUpdate} 
              size="sm" 
              variant="outline"
            >
              Depois
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
