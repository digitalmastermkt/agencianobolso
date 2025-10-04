import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Crown, TrendingUp, Star, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStripePriceConfig } from "@/hooks/useStripePriceConfig";

type PlanTierLocal = "Essencial" | "Premium" | "Elite";

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

  const monthlyDisplay = {
    Essencial: "R$ 29/mês",
    Premium: "R$ 59/mês",
    Elite: "R$ 97/mês",
  } as const;

  const annualTotals = {
    Essencial: 290,
    Premium: 590,
    Elite: 970,
  } as const;

  const formatBRL = (val: number, minFrac = 2) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: minFrac });

  const annualDisplay = {
    Essencial: `${formatBRL(annualTotals.Essencial / 12)}/mês (${formatBRL(annualTotals.Essencial, 0)} cobrados anualmente)`,
    Premium: `${formatBRL(annualTotals.Premium / 12)}/mês (${formatBRL(annualTotals.Premium, 0)} cobrados anualmente)`,
    Elite: `${formatBRL(annualTotals.Elite / 12)}/mês (${formatBRL(annualTotals.Elite, 0)} cobrados anualmente)`,
  } as const;

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
            <div className="flex items-center justify-between gap-4 mb-4">
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
              <PlanCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Essencial"
                price={billingCycle === "monthly" ? monthlyDisplay.Essencial : annualDisplay.Essencial}
                features={["Agentes: Conexão, Interação, Banner"]}
                onSelect={() => handleSubscribe(configPriceIds[billingCycle]["Essencial"])}
              />
              <PlanCard
                icon={<Star className="w-5 h-5" />}
                title="Premium"
                price={billingCycle === "monthly" ? monthlyDisplay.Premium : annualDisplay.Premium}
                features={["Tudo do Essencial + Vendas, Storytelling"]}
                onSelect={() => handleSubscribe(configPriceIds[billingCycle]["Premium"])}
              />
              <PlanCard
                icon={<Crown className="w-5 h-5" />}
                title="Elite"
                price={billingCycle === "monthly" ? monthlyDisplay.Elite : annualDisplay.Elite}
                features={["Tudo do Premium + Viral", "Acesso a agentes futuros"]}
                onSelect={() => handleSubscribe(configPriceIds[billingCycle]["Elite"])}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanCard({ icon, title, price, features, onSelect, ctaLabel }: { icon: React.ReactNode; title: string; price: string; features: string[]; onSelect: () => void; ctaLabel?: string; }) {
  return (
    <div className="border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="text-2xl font-bold mb-2">{price}</div>
      <ul className="text-sm text-muted-foreground mb-4 list-disc pl-5 space-y-1">
        {features.map((f, idx) => (
          <li key={idx}>{f}</li>
        ))}
      </ul>
      <Button variant="gradient" className="w-full" onClick={onSelect}>
        {ctaLabel ?? `Assinar ${title}`}
      </Button>
    </div>
  );
}