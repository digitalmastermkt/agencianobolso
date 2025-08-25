import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionInfo = {
  subscribed: boolean;
  subscription_tier: "Essencial" | "Premium" | "Elite" | null;
  subscription_end: string | null;
};

export function useSubscription() {
  const { user } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("Erro ao verificar assinatura:", error);
        throw error;
      } else if (data) {
        setInfo(data as SubscriptionInfo);
      }
    } catch (error) {
      console.error("Erro na função refresh:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const hasAccess = (required: "Essencial" | "Premium" | "Elite") => {
    const rank = { Essencial: 1, Premium: 2, Elite: 3 } as const;
    const current = info.subscription_tier;
    return current ? rank[current] >= rank[required] : false;
  };

  return { ...info, loading, refresh, hasAccess };
}
