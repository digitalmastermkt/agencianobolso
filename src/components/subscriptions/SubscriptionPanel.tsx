import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Crown, TrendingUp, Star, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type PlanTierLocal = "Essencial" | "Premium" | "Elite";
const PRICE_IDS: Record<"monthly" | "annual", Record<PlanTierLocal, string>> = {
  monthly: {
    Essencial: "price_1RtCJlL0y5sMsrd4ZJHcvV3A",
    Premium: "price_1RtCTGL0y5sMsrd4yRno549V",
    Elite: "price_1RtCyUL0y5sMsrd4j7Bgl4xT",
  },
  annual: {
    Essencial: "price_1RtwbYL0y5sMsrd4mqnLAsRK",
    Premium: "price_1RtwejL0y5sMsrd40q0fAqKO",
    Elite: "price_1RtwaZL0y5sMsrd4b3TDm2hA",
  },
};

export function SubscriptionPanel() {
  const { subscribed, subscription_tier, subscription_end, loading, refresh } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

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
      if (error) throw error;
      if (data?.url) {
        window.open(data.url as string, "_blank");
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao abrir portal", description: e?.message || "Tente novamente." });
    }
  };

  const handleStartFree = () => {
    if (!user) navigate("/auth");
    else navigate("/dashboard");
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Plano e Assinatura</CardTitle>
        <CardDescription>
          Assine um plano para liberar os recursos de acordo com o nível escolhido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscribed ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status da assinatura</p>
              <p className="text-foreground font-medium">
                Ativo • Plano {subscription_tier} {subscription_end ? `(até ${new Date(subscription_end).toLocaleDateString('pt-BR')})` : ""}
              </p>
            </div>
            <div className="flex gap-3 flex-nowrap items-center">
              <Button variant="outline" onClick={refresh} disabled={loading} className="whitespace-nowrap">
                Atualizar Status
              </Button>
              <Button variant="gradient" onClick={handleManage} className="whitespace-nowrap">
                Gerenciar Assinatura
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PlanCard
              icon={<Sparkles className="w-5 h-5" />}
              title="Gratuito"
              price="R$ 0/mês"
              features={["1 agente liberado: Vendas"]}
              onSelect={handleStartFree}
              ctaLabel="Começar grátis"
            />
            <PlanCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Essencial"
              price={billingCycle === "monthly" ? monthlyDisplay.Essencial : annualDisplay.Essencial}
              features={["Agentes: Conexão, Interação, Banner"]}
              onSelect={() => handleSubscribe(PRICE_IDS[billingCycle].Essencial)}
            />
            <PlanCard
              icon={<Star className="w-5 h-5" />}
              title="Premium"
              price={billingCycle === "monthly" ? monthlyDisplay.Premium : annualDisplay.Premium}
              features={["Tudo do Essencial + Vendas, Storytelling"]}
              onSelect={() => handleSubscribe(PRICE_IDS[billingCycle].Premium)}
            />
            <PlanCard
              icon={<Crown className="w-5 h-5" />}
              title="Elite"
              price={billingCycle === "monthly" ? monthlyDisplay.Elite : annualDisplay.Elite}
              features={["Tudo do Premium + Viral", "Acesso a agentes futuros"]}
              onSelect={() => handleSubscribe(PRICE_IDS[billingCycle].Elite)}
            />
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
