import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, Check } from 'lucide-react';

interface PriceIds {
  monthly: {
    essencial: string;
    premium: string;
    elite: string;
  };
  annual: {
    essencial: string;
    premium: string;
    elite: string;
  };
}

export function StripePriceUpdater() {
  const [priceIds, setPriceIds] = useState<PriceIds>({
    monthly: {
      essencial: '',
      premium: '',
      elite: ''
    },
    annual: {
      essencial: '',
      premium: '',
      elite: ''
    }
  });

  const [copied, setCopied] = useState<string | null>(null);

  const handleInputChange = (type: 'monthly' | 'annual', plan: string, value: string) => {
    setPriceIds(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [plan]: value
      }
    }));
  };

  const generateUpdateCode = () => {
    const allFilled = Object.values(priceIds.monthly).every(id => id) && 
                      Object.values(priceIds.annual).every(id => id);
    
    if (!allFilled) return 'Preencha todos os Price IDs primeiro.';

    return `// SubscriptionPanel.tsx - Objeto PRICE_IDS atualizado
const PRICE_IDS: Record<"monthly" | "annual", Record<PlanTierLocal, string>> = {
  monthly: {
    Essencial: "${priceIds.monthly.essencial}",
    Premium: "${priceIds.monthly.premium}",
    Elite: "${priceIds.monthly.elite}",
  },
  annual: {
    Essencial: "${priceIds.annual.essencial}",
    Premium: "${priceIds.annual.premium}",
    Elite: "${priceIds.annual.elite}",
  },
};

// create-checkout/index.ts - Objeto PRICE_MAP atualizado
const PRICE_MAP: Record<string, string> = {
  "${priceIds.monthly.essencial}": "Essencial",
  "${priceIds.monthly.premium}": "Premium", 
  "${priceIds.monthly.elite}": "Elite",
};

// check-subscription/index.ts - Objeto PRICE_TO_TIER atualizado
const PRICE_TO_TIER: Record<string, string> = {
  "${priceIds.monthly.essencial}": "Essencial",
  "${priceIds.monthly.premium}": "Premium",
  "${priceIds.monthly.elite}": "Elite",
};`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Atualizador de Price IDs do Stripe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Insira os Price IDs de produção do Stripe Dashboard
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
                  value={priceIds.monthly.essencial}
                  onChange={(e) => handleInputChange('monthly', 'essencial', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthly-premium">Premium (Mensal)</Label>
                <Input
                  id="monthly-premium"
                  placeholder="price_..."
                  value={priceIds.monthly.premium}
                  onChange={(e) => handleInputChange('monthly', 'premium', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthly-elite">Elite (Mensal)</Label>
                <Input
                  id="monthly-elite"
                  placeholder="price_..."
                  value={priceIds.monthly.elite}
                  onChange={(e) => handleInputChange('monthly', 'elite', e.target.value)}
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
                  value={priceIds.annual.essencial}
                  onChange={(e) => handleInputChange('annual', 'essencial', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="annual-premium">Premium (Anual)</Label>
                <Input
                  id="annual-premium"
                  placeholder="price_..."
                  value={priceIds.annual.premium}
                  onChange={(e) => handleInputChange('annual', 'premium', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="annual-elite">Elite (Anual)</Label>
                <Input
                  id="annual-elite"
                  placeholder="price_..."
                  value={priceIds.annual.elite}
                  onChange={(e) => handleInputChange('annual', 'elite', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Código Gerado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Código para Atualização
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(generateUpdateCode())}
              disabled={!Object.values(priceIds.monthly).every(id => id) || 
                       !Object.values(priceIds.annual).every(id => id)}
            >
              {copied === generateUpdateCode() ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === generateUpdateCode() ? 'Copiado!' : 'Copiar'}
            </Button>
          </CardTitle>
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