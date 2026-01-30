import { ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { useAgentAvailability } from "@/hooks/useAgentAvailability";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useAuth } from "@/hooks/useAuth";
import { isMasterUser } from "@/lib/constants";

interface PlanGuardProps {
  requiredPlan?: "Essencial" | "Premium" | "Elite";
  agentKey?: string;
  courseId?: string;
  children: ReactNode;
}

export function PlanGuard({ requiredPlan, agentKey, courseId, children }: PlanGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: subLoading, subscribed, hasAccess, refresh: refreshSub } = useSubscription();
  const { loading: rulesLoading, canAccessAgent, canAccessCourse, refresh: refreshRules, isTrialActive } = usePlanAccess();
  const { isAdmin } = useUserRole();
  const { remainingDailyCredits, daysRemaining, refresh: refreshTrial } = useTrialStatus();
  const { isAvailable: isAgentGloballyAvailable, getComingSoonMessage, loading: agentAvailLoading } = useAgentAvailability();

  // Master user bypass - never blocked
  const isMaster = isMasterUser(user?.email);

  // Check if agent is globally unavailable (Coming Soon)
  const isAgentComingSoon = agentKey ? !isAgentGloballyAvailable(agentKey) : false;
  const comingSoonMessage = agentKey ? getComingSoonMessage(agentKey) : "Em breve";

  const blocked = (() => {
    if (isMaster) return false; // Master user never blocked
    if (isAdmin) return false;
    if (subLoading || rulesLoading || agentAvailLoading) return false; // avoid flicker
    
    // Check global availability first (Coming Soon)
    if (agentKey && isAgentComingSoon) {
      return true; // Block with "Coming Soon" message
    }
    
    // Trial users: check daily credits
    if (isTrialActive) {
      return remainingDailyCredits <= 0;
    }
    
    // Free users (no subscription and no trial): block all agents
    if (!subscribed) return true;
    
    // Subscribed users: check plan-specific rules
    if (requiredPlan && !hasAccess(requiredPlan)) return true;
    if (agentKey && !canAccessAgent(agentKey)) return true;
    if (courseId && !canAccessCourse(courseId)) return true;
    return false;
  })();

  const handlePortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Erro ao abrir portal:", e);
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    refreshSub();
    refreshRules();
    refreshTrial();
  }, [refreshSub, refreshRules, refreshTrial]);

  // Master user and admin always have full access
  if (isMaster || isAdmin) {
    return <>{children}</>;
  }

  if (subLoading || rulesLoading || agentAvailLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Sparkles className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-warning bg-warning/10">
          <CardContent className="p-6 text-center space-y-4">
            {isAgentComingSoon ? (
              <>
                <Clock className="w-12 h-12 mx-auto text-primary" />
                <h2 className="text-xl font-bold">Em Breve</h2>
                <p className="text-muted-foreground">
                  {comingSoonMessage}
                </p>
                <p className="text-sm text-muted-foreground">
                  Este agente ainda está em desenvolvimento. Fique atento às novidades!
                </p>
              </>
            ) : isTrialActive ? (
              <>
                <Lock className="w-12 h-12 mx-auto text-warning" />
                <h2 className="text-xl font-bold">Limite diário atingido</h2>
                <p className="text-muted-foreground">
                  Você usou todos os seus créditos diários ({remainingDailyCredits === 0 ? "0" : remainingDailyCredits} restantes).
                </p>
                <p className="text-sm text-muted-foreground">
                  Trial ativo: {daysRemaining} dias restantes
                </p>
                <div className="text-xs text-muted-foreground">
                  Os créditos são renovados diariamente. Volte amanhã ou faça upgrade para ter acesso ilimitado.
                </div>
              </>
            ) : (
              <>
                <Lock className="w-12 h-12 mx-auto text-warning" />
                <h2 className="text-xl font-bold">Plano necessário</h2>
                <p className="text-muted-foreground">
                  {agentKey ? 
                    "Este agente requer uma assinatura ativa para acesso." :
                    "Este conteúdo requer uma assinatura ativa para acesso."
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Escolha um plano para desbloquear todos os recursos da plataforma.
                </p>
              </>
            )}
            
            {!isAgentComingSoon && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={handlePortal} variant="default">
                  {subscribed ? "Gerenciar Plano" : "Ver Planos"}
                </Button>
                <Button onClick={handleRefresh} variant="outline">
                  Atualizar Status
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
