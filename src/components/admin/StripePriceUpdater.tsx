import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Save, RefreshCw } from 'lucide-react';
import { useStripePriceConfig, PriceIds } from '@/hooks/useStripePriceConfig';

export function StripePriceUpdater() {
  const { 
    priceIds: configPriceIds, 
    loading, 
    saving, 
    savePriceConfig, 
    refreshConfig 
  } = useStripePriceConfig();
  
  const [localPriceIds, setLocalPriceIds] = useState<PriceIds>({
    monthly: { Essencial: '', Premium: '', Elite: '' },
    annual: { Essencial: '', Premium: '', Elite: '' }
  });
  
  const [copied, setCopied] = useState<string | null>(null);

  // Sync with loaded config
  useEffect(() => {
    if (!loading) {
      setLocalPriceIds(configPriceIds);
    }
  }, [configPriceIds, loading]);

  const handleInputChange = (type: 'monthly' | 'annual', plan: string, value: string) => {
    setLocalPriceIds(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [plan]: value
      }
    }));
  };

  const handleSave = async () => {
    await savePriceConfig(localPriceIds);
  };

  const generateUpdateCode = () => {
    const allFilled = Object.values(localPriceIds.monthly).every(id => id) && 
                      Object.values(localPriceIds.annual).every(id => id);
    
    if (!allFilled) return 'Preencha todos os Price IDs primeiro.';

    return `// create-checkout/index.ts - Objeto PRICE_MAP atualizado
const PRICE_MAP: Record<string, string> = {
  "${localPriceIds.monthly.Essencial}": "Essencial",
  "${localPriceIds.monthly.Premium}": "Premium", 
  "${localPriceIds.monthly.Elite}": "Elite",
};

// check-subscription/index.ts - Objeto PRICE_TO_TIER atualizado
const PRICE_TO_TIER: Record<string, string> = {
  "${localPriceIds.monthly.Essencial}": "Essencial",
  "${localPriceIds.monthly.Premium}": "Premium",
  "${localPriceIds.monthly.Elite}": "Elite",
};`;
  };

  const isFormValid = () => {
    return Object.values(localPriceIds.monthly).every(id => id.trim()) && 
           Object.values(localPriceIds.annual).every(id => id.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando configurações...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Configuração de Price IDs do Stripe
            <Button
              variant="outline"
              size="sm"
              onClick={refreshConfig}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure os Price IDs do Stripe Dashboard. As alterações são salvas automaticamente no sistema.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Planos Mensais */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Planos Mensais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monthly-essencial">Essencial (Mensal)</Label>
                <Input
                  id="monthly-essencial"
                  placeholder="price_..."
                  value={localPriceIds.monthly.Essencial}
                  onChange={(e) => handleInputChange('monthly', 'Essencial', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthly-premium">Premium (Mensal)</Label>
                <Input
                  id="monthly-premium"
                  placeholder="price_..."
                  value={localPriceIds.monthly.Premium}
                  onChange={(e) => handleInputChange('monthly', 'Premium', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthly-elite">Elite (Mensal)</Label>
                <Input
                  id="monthly-elite"
                  placeholder="price_..."
                  value={localPriceIds.monthly.Elite}
                  onChange={(e) => handleInputChange('monthly', 'Elite', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Planos Anuais */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Planos Anuais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="annual-essencial">Essencial (Anual)</Label>
                <Input
                  id="annual-essencial"
                  placeholder="price_..."
                  value={localPriceIds.annual.Essencial}
                  onChange={(e) => handleInputChange('annual', 'Essencial', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="annual-premium">Premium (Anual)</Label>
                <Input
                  id="annual-premium"
                  placeholder="price_..."
                  value={localPriceIds.annual.Premium}
                  onChange={(e) => handleInputChange('annual', 'Premium', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="annual-elite">Elite (Anual)</Label>
                <Input
                  id="annual-elite"
                  placeholder="price_..."
                  value={localPriceIds.annual.Elite}
                  onChange={(e) => handleInputChange('annual', 'Elite', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={!isFormValid() || saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Código Gerado para Edge Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Código para Edge Functions (Opcional)
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(generateUpdateCode())}
              disabled={!isFormValid()}
            >
              {copied === generateUpdateCode() ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === generateUpdateCode() ? 'Copiado!' : 'Copiar'}
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Caso precise atualizar manualmente as edge functions, use este código:
          </p>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
            {generateUpdateCode()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}