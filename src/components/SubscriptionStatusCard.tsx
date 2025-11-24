import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Zap, TrendingUp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export function SubscriptionStatusCard() {
  const { subscribed, subscription_tier, loading: subLoading } = useSubscription();
  const { isTrialActive, loading: trialLoading } = useTrialStatus();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Buscar créditos mensais reais
  useEffect(() => {
    const fetchMonthlyCredits = async () => {
      if (!user || !subscribed) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        const { data, error } = await supabase
          .rpc('get_user_monthly_credits_usage', {
            p_user_id: user.id,
            p_month_year: currentMonth
          });
        
        if (error) throw error;
        setCreditsUsed(data || 0);
      } catch (error) {
        console.error('Erro ao buscar créditos mensais:', error);
        setCreditsUsed(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyCredits();
  }, [user, subscribed]);

  // Mostrar apenas se tiver assinatura e não estiver em trial
  if (trialLoading || subLoading || loading) {
    return (
      <Card className="border-dashed border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Não mostrar se estiver em trial ou não tiver assinatura
  if (isTrialActive || !subscribed || !subscription_tier) {
    return null;
  }

  // Créditos mensais por plano
  const monthlyCredits = {
    Essencial: 100,
    Premium: 300,
    Elite: 1000,
  }[subscription_tier] || 0;

  const creditsRemaining = monthlyCredits - creditsUsed;
  const creditsProgress = (creditsUsed / monthlyCredits) * 100;

  const tierColors = {
    Essencial: "from-blue-500/10 to-blue-600/10",
    Premium: "from-purple-500/10 to-purple-600/10",
    Elite: "from-amber-500/10 to-amber-600/10",
  };

  const tierBadgeColors = {
    Essencial: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    Premium: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    Elite: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  };

  return (
    <Card className={`border-primary/20 bg-gradient-to-br ${tierColors[subscription_tier]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Plano {subscription_tier}
          </CardTitle>
          <Badge className={tierBadgeColors[subscription_tier]}>
            Ativo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Créditos mensais
            </span>
            <span className="font-medium">
              {creditsRemaining}/{monthlyCredits}
            </span>
          </div>
          <Progress value={creditsProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {creditsRemaining > 0 
              ? `${creditsRemaining} créditos restantes neste mês`
              : "Créditos esgotados - renovam no próximo ciclo"
            }
          </p>
        </div>
        
        <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Benefícios do seu plano:</p>
              <p>• {monthlyCredits} gerações de IA por mês</p>
              <p>• Acesso a todos os agentes</p>
              <p>• Suporte prioritário</p>
            </div>
          </div>
        </div>

        {creditsRemaining < monthlyCredits * 0.2 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            Fazer Upgrade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
