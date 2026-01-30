import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Crown, TrendingUp, Star, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStripePriceConfig } from "@/hooks/useStripePriceConfig";
import { Badge } from "@/components/ui/badge";

type PlanTierLocal = "Essencial" | "Premium" | "Elite";

interface PlanFeatures {
  credits: string;
  brandProfiles: string;
  features: string[];
}

const PLAN_FEATURES: Record<PlanTierLocal, PlanFeatures> = {
  Essencial: {
    credits: "15 artes/mês",
    brandProfiles: "1 Perfil de Marca",
    features: [
      "Compra de créditos adicionais",
      "Suporte por email",
    ],
  },
  Premium: {
    credits: "35 artes/mês",
    brandProfiles: "3 Perfis de Marca",
    features: [
      "Compra de créditos adicionais",
      "Suporte prioritário",
      "Acesso antecipado a novos recursos",
    ],
  },
  Elite: {
    credits: "75 artes/mês",
    brandProfiles: "Perfis de Marca ilimitados",
    features: [
      "Compra de créditos adicionais",
      "Suporte VIP",
      "Acesso exclusivo a novos agentes",
      "Consultoria mensal (1h)",
    ],
  },
};

export function SubscriptionPanel() {
  const { subscribed, subscription_tier, subscription_end, loading, refresh } = useSubscription();
  const { user } = useAuth();
  const { priceIds: configPriceIds, loading: configLoading } = useStripePriceConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    const saved = localStorage.getItem("billingCycle");
    if (saved === "annual" || saved === "monthly") setBillingCycle(saved);
  }, []);

  const setCycle = (cycle: "monthly" | "annual") => {
    setBillingCycle(cycle);
    localStorage.setItem("billingCycle", cycle);
  };

  const monthlyPrices = {
    Essencial: 67,
    Premium: 147,
    Elite: 297,
  } as const;

  const annualPrices = {
    Essencial: 670,
    Premium: 1470,
    Elite: 2970,
  } as const;

  const formatBRL = (val: number, minFrac = 0) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: minFrac });

  const getDisplayPrice = (tier: PlanTierLocal) => {
    if (billingCycle === "monthly") {
      return formatBRL(monthlyPrices[tier]) + "/mês";
    }
    const monthlyEquivalent = annualPrices[tier] / 12;
    return `${formatBRL(monthlyEquivalent)}/mês`;
  };

  const getAnnualNote = (tier: PlanTierLocal) => {
    if (billingCycle === "annual") {
      return `(${formatBRL(annualPrices[tier])} cobrados anualmente)`;
    }
    return null;
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast({ title: "Faça login para assinar", description: "Entre na sua conta para continuar o checkout." });
      navigate("/auth");
      return;
    }

    if (!priceId) {
      toast({ 
        title: "Erro de configuração", 
        description: "Price ID não configurado. Entre em contato com o suporte.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url as string, "_blank");
        toast({ title: "Redirecionando ao Stripe", description: "Finalize sua assinatura na nova aba." });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao iniciar checkout", description: e?.message || "Tente novamente." });
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) {
        console.error("Erro customer-portal:", error);
        throw error;
      }
      if (data?.url) {
        window.open(data.url as string, "_blank");
        toast({ title: "Portal aberto", description: "Gerencie seus créditos e assinatura na nova aba." });
      }
    } catch (e: any) {
      console.error("Erro completo:", e);
      toast({ 
        title: "Erro ao abrir portal", 
        description: e?.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  // Always show plans if the tab parameter is 'subscription'
  const showPlans = !subscribed || searchParams.get('tab') === 'subscription';

  const handleStartFree = () => {
    if (!user) navigate("/auth");
    else navigate("/dashboard");
  };

  if (loading || configLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <span>Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Plano e Assinatura</CardTitle>
        <CardDescription>
          Assine um plano para liberar os recursos de acordo com o nível escolhido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscribed && !showPlans && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Status da assinatura</p>
              <p className="text-foreground font-medium">
                Ativo • Plano {subscription_tier} {subscription_end ? `(até ${new Date(subscription_end).toLocaleDateString('pt-BR')})` : ""}
              </p>
            </div>
            <div className="flex gap-3 flex-nowrap items-center">
              <Button variant="outline" onClick={refresh} disabled={loading} className="whitespace-nowrap">
                {loading ? "Atualizando..." : "Atualizar Status"}
              </Button>
              <Button variant="gradient" onClick={handleManage} className="whitespace-nowrap">
                Créditos e Assinatura
              </Button>
            </div>
          </div>
        )}
        
        {showPlans && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-sm text-muted-foreground">Escolha o ciclo de cobrança</p>
              <div className="flex gap-2">
                <Button
                  variant={billingCycle === "monthly" ? "gradient" : "outline"}
                  onClick={() => setCycle("monthly")}
                  className="whitespace-nowrap"
                >
                  Mensal
                </Button>
                <Button
                  variant={billingCycle === "annual" ? "gradient" : "outline"}
                  onClick={() => setCycle("annual")}
                  className="whitespace-nowrap"
                >
                  Anual <span className="ml-2 text-xs text-muted-foreground">(2 meses grátis)</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["Essencial", "Premium", "Elite"] as PlanTierLocal[]).map((tier) => (
                <PlanCard
                  key={tier}
                  tier={tier}
                  price={getDisplayPrice(tier)}
                  annualNote={getAnnualNote(tier)}
                  features={PLAN_FEATURES[tier]}
                  isPopular={tier === "Premium"}
                  onSelect={() => handleSubscribe(configPriceIds[billingCycle][tier])}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PlanCardProps {
  tier: PlanTierLocal;
  price: string;
  annualNote: string | null;
  features: PlanFeatures;
  isPopular?: boolean;
  onSelect: () => void;
}

function PlanCard({ tier, price, annualNote, features, isPopular, onSelect }: PlanCardProps) {
  const icons = {
    Essencial: <TrendingUp className="w-5 h-5" />,
    Premium: <Star className="w-5 h-5" />,
    Elite: <Crown className="w-5 h-5" />,
  };

  return (
    <div className={`relative border rounded-lg p-5 ${isPopular ? "ring-2 ring-primary" : ""}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Mais Popular
        </Badge>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-primary">{icons[tier]}</div>
        <h3 className="font-semibold text-lg">{tier}</h3>
      </div>
      
      <div className="mb-4">
        <div className="text-2xl font-bold">{price}</div>
        {annualNote && (
          <p className="text-xs text-muted-foreground mt-1">{annualNote}</p>
        )}
      </div>

      <ul className="space-y-2 mb-6 text-sm">
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium">{features.credits}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium">{features.brandProfiles}</span>
        </li>
        {features.features.map((f, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button variant={isPopular ? "gradient" : "outline"} className="w-full" onClick={onSelect}>
        Assinar {tier}
      </Button>
    </div>
  );
}
