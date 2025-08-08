import { ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface PlanGuardProps {
  requiredPlan?: "Essencial" | "Premium" | "Elite";
  agentKey?: string;
  courseId?: string;
  children: ReactNode;
}

export function PlanGuard({ requiredPlan, agentKey, courseId, children }: PlanGuardProps) {
  const navigate = useNavigate();
  const { loading: subLoading, subscribed, hasAccess, refresh: refreshSub } = useSubscription();
  const { loading: rulesLoading, canAccessAgent, canAccessCourse, refresh: refreshRules } = usePlanAccess();
  const { isAdmin } = useUserRole();

  const blocked = (() => {
    if (isAdmin) return false;
    if (subLoading || rulesLoading) return false; // avoid flicker
    if (!subscribed) return true;
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
  }, [refreshSub, refreshRules]);

  if (isAdmin) {
    return <>{children}</>;
  }

  if (subLoading || rulesLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Sparkles className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Plano necessário</h2>
            <p className="text-sm text-muted-foreground">
              Este conteúdo está disponível apenas para o seu plano atual. Atualize ou gerencie sua assinatura.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>Ver planos</Button>
              <Button onClick={handlePortal}>Gerenciar assinatura</Button>
              <Button variant="ghost" onClick={handleRefresh}>Recarregar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
