import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "./useSubscription";

export type PlanTier = "Essencial" | "Premium" | "Elite";

type AgentAccess = { plan: string; agent_key: string };
type CourseAccess = { plan: string; course_id: string };

export function usePlanAccess() {
  const { subscription_tier, subscribed } = useSubscription();
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
      if (!subscribed || !tier) return false;
      return agents.some((r) => r.plan === tier && r.agent_key === agentKey);
    },
    [agents, subscribed, tier]
  );

  const canAccessCourse = useCallback(
    (courseId: string) => {
      if (!subscribed || !tier) return false;
      return courses.some((r) => r.plan === tier && r.course_id === courseId);
    },
    [courses, subscribed, tier]
  );

  const summary = useMemo(() => ({ agentsCount: agents.length, coursesCount: courses.length }), [agents.length, courses.length]);

  return { loading, error, canAccessAgent, canAccessCourse, refresh: load, tier, subscribed, summary };
}
