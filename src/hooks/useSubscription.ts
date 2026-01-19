import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isMasterUser } from "@/lib/constants";

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

  // Master user bypass - unlimited access
  const isMaster = isMasterUser(user?.email);

  const refresh = useCallback(async () => {
    if (!user) return;
    
    // Master user always has Elite subscription
    if (isMasterUser(user.email)) {
      setInfo({
        subscribed: true,
        subscription_tier: "Elite",
        subscription_end: null, // Never expires
      });
      setLoading(false);
      return;
    }
    
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
    if (isMaster) return true; // Master always has access
    const rank = { Essencial: 1, Premium: 2, Elite: 3 } as const;
    const current = info.subscription_tier;
    return current ? rank[current] >= rank[required] : false;
  };

  return { ...info, loading, refresh, hasAccess, isMaster };
}
