import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface AgentAvailability {
  id: string;
  agent_key: string;
  agent_name: string;
  is_available: boolean;
  coming_soon_message: string | null;
  display_order: number;
}

export function useAgentAvailability() {
  const { isAdmin } = useUserRole();
  const [agents, setAgents] = useState<AgentAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("agent_availability")
        .select("*")
        .order("display_order", { ascending: true });

      if (err) throw err;
      setAgents(data || []);
    } catch (e: any) {
      console.error("Erro ao carregar disponibilidade de agentes:", e);
      setError(e?.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAvailable = useCallback(
    (agentKey: string) => {
      // Admin always has access
      if (isAdmin) return true;
      const agent = agents.find((a) => a.agent_key === agentKey);
      return agent?.is_available ?? false;
    },
    [agents, isAdmin]
  );

  const getComingSoonMessage = useCallback(
    (agentKey: string) => {
      const agent = agents.find((a) => a.agent_key === agentKey);
      return agent?.coming_soon_message || "Em breve";
    },
    [agents]
  );

  const getAgentName = useCallback(
    (agentKey: string) => {
      const agent = agents.find((a) => a.agent_key === agentKey);
      return agent?.agent_name || agentKey;
    },
    [agents]
  );

  const updateAvailability = useCallback(
    async (agentKey: string, isAvailable: boolean) => {
      const { error } = await supabase
        .from("agent_availability")
        .update({ is_available: isAvailable })
        .eq("agent_key", agentKey);

      if (error) throw error;
      await load();
    },
    [load]
  );

  const updateMessage = useCallback(
    async (agentKey: string, message: string) => {
      const { error } = await supabase
        .from("agent_availability")
        .update({ coming_soon_message: message })
        .eq("agent_key", agentKey);

      if (error) throw error;
      await load();
    },
    [load]
  );

  const availableCount = agents.filter((a) => a.is_available).length;
  const totalCount = agents.length;

  return {
    agents,
    loading,
    error,
    isAvailable,
    getComingSoonMessage,
    getAgentName,
    updateAvailability,
    updateMessage,
    refresh: load,
    availableCount,
    totalCount,
  };
}
