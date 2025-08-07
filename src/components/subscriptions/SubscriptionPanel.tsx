import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Crown, TrendingUp, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const PRICE_IDS = {
  Essencial: "price_1RtCJlL0y5sMsrd4ZJHcvV3A",
  Premium: "price_1RtCTGL0y5sMsrd4yRno549V",
  Elite: "price_1RtCyUL0y5sMsrd4j7Bgl4xT",
} as const;

export function SubscriptionPanel() {
  const { subscribed, subscription_tier, subscription_end, loading, refresh } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlanCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Essencial"
              price="R$ 29,90/mês"
              features={["Acesso básico aos agentes"]}
              onSelect={() => handleSubscribe(PRICE_IDS.Essencial)}
            />
            <PlanCard
              icon={<Star className="w-5 h-5" />}
              title="Premium"
              price="R$ 59,90/mês"
              features={["Tudo do Essencial", "Recursos avançados"]}
              onSelect={() => handleSubscribe(PRICE_IDS.Premium)}
            />
            <PlanCard
              icon={<Crown className="w-5 h-5" />}
              title="Elite"
              price="R$ 99,90/mês"
              features={["Tudo do Premium", "Recursos completos"]}
              onSelect={() => handleSubscribe(PRICE_IDS.Elite)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanCard({ icon, title, price, features, onSelect }: { icon: React.ReactNode; title: string; price: string; features: string[]; onSelect: () => void; }) {
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
        Assinar {title}
      </Button>
    </div>
  );
}
