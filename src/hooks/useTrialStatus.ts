import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TrialInfo = {
  isTrialActive: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  dailyCreditsLimit: number;
  dailyCreditsUsed: number;
  remainingDailyCredits: number;
  daysRemaining: number;
};

export function useTrialStatus() {
  const { user } = useAuth();
  const [info, setInfo] = useState<TrialInfo>({
    isTrialActive: false,
    trialStartDate: null,
    trialEndDate: null,
    dailyCreditsLimit: 10,
    dailyCreditsUsed: 0,
    remainingDailyCredits: 10,
    daysRemaining: 0,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get user profile with trial info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("trial_start_date, trial_end_date, daily_credits_limit, is_trial_active")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar dados do trial:", profileError);
        return;
      }

      // Get daily credits usage
      const { data: dailyUsage, error: usageError } = await supabase
        .rpc("get_user_daily_credits_usage", { p_user_id: user.id });

      if (usageError) {
        console.error("Erro ao buscar uso diário de créditos:", usageError);
      }

      const dailyCreditsUsed = dailyUsage || 0;
      const dailyCreditsLimit = profile?.daily_credits_limit || 10;
      const isTrialActive = profile?.is_trial_active && 
        profile?.trial_end_date && 
        new Date(profile.trial_end_date) > new Date();

      let daysRemaining = 0;
      if (isTrialActive && profile?.trial_end_date) {
        const endDate = new Date(profile.trial_end_date);
        const now = new Date();
        daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      setInfo({
        isTrialActive,
        trialStartDate: profile?.trial_start_date || null,
        trialEndDate: profile?.trial_end_date || null,
        dailyCreditsLimit,
        dailyCreditsUsed,
        remainingDailyCredits: Math.max(0, dailyCreditsLimit - dailyCreditsUsed),
        daysRemaining,
      });
    } catch (error) {
      console.error("Erro na função refresh do trial:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const hasCreditsAvailable = info.remainingDailyCredits > 0;
  const canUseAgent = (agentKey: string) => {
    if (info.isTrialActive) return hasCreditsAvailable;
    return agentKey === "vendas" && hasCreditsAvailable;
  };

  return { 
    ...info, 
    loading, 
    refresh, 
    hasCreditsAvailable,
    canUseAgent
  };
}