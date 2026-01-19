import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "./useSubscription";
import { useUserRole } from "./useUserRole";
import { useTrialStatus } from "./useTrialStatus";
import { useAuth } from "./useAuth";
import { isMasterUser } from "@/lib/constants";


export type PlanTier = "Essencial" | "Premium" | "Elite";

type AgentAccess = { plan: string; agent_key: string };
type CourseAccess = { plan: string; course_id: string };

export function usePlanAccess() {
  const { user } = useAuth();
  const { subscription_tier, subscribed } = useSubscription();
  const { isAdmin } = useUserRole();
  const { isTrialActive, canUseAgent: canUseAgentTrial } = useTrialStatus();
  
  // Master user bypass
  const isMaster = isMasterUser(user?.email);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentAccess[]>([]);
  const [courses, setCourses] = useState<CourseAccess[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: agentRows, error: agentErr }, { data: courseRows, error: courseErr }] = await Promise.all([
        supabase.from("plan_agents_access").select("plan, agent_key"),
        supabase.from("plan_courses_access").select("plan, course_id"),
      ]);

      if (agentErr) throw agentErr;
      if (courseErr) throw courseErr;

      setAgents(agentRows ?? []);
      setCourses(courseRows ?? []);
    } catch (e: any) {
      console.error("Erro ao carregar regras de plano:", e);
      setError(e?.message || "Erro ao carregar regras de plano");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tier = subscription_tier as PlanTier | null;

  const canAccessAgent = useCallback(
    (agentKey: string) => {
      if (isMaster) return true; // Master user has unlimited access
      if (isAdmin) return true;
      
      // Trial users: can access all agents with daily credit limit
      if (isTrialActive) {
        return canUseAgentTrial(agentKey);
      }
      
      // Free users: allow only the "vendas" agent
      if (!subscribed || !tier) return agentKey === "vendas";
      return agents.some((r) => r.plan === tier && r.agent_key === agentKey);
    },
    [agents, subscribed, tier, isAdmin, isTrialActive, canUseAgentTrial, isMaster]
  );

  const canAccessCourse = useCallback(
    (courseId: string) => {
      if (isMaster) return true; // Master user has unlimited access
      if (isAdmin) return true;
      if (!subscribed || !tier) return false;
      return courses.some((r) => r.plan === tier && r.course_id === courseId);
    },
    [courses, subscribed, tier, isAdmin, isMaster]
  );

  const summary = useMemo(() => ({ agentsCount: agents.length, coursesCount: courses.length }), [agents.length, courses.length]);

  return { loading, error, canAccessAgent, canAccessCourse, refresh: load, tier, subscribed, summary, isTrialActive, isMaster };
}
