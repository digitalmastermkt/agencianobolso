import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isMasterUser } from "@/lib/constants";

export interface CreditsBalance {
  creditsBalance: number;
  creditsExtra: number;
  creditsTotal: number;
  creditsMonthlyLimit: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface CreditsTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  actionType: string | null;
  description: string | null;
  createdAt: string;
}

export function useCreditsBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CreditsBalance>({
    creditsBalance: 0,
    creditsExtra: 0,
    creditsTotal: 0,
    creditsMonthlyLimit: 0,
    periodStart: null,
    periodEnd: null,
  });
  const [transactions, setTransactions] = useState<CreditsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Master user bypass
  const isMaster = isMasterUser(user?.email);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch balance using RPC function
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_user_credits_balance', { p_user_id: user.id });

      if (balanceError) {
        console.error('Error fetching credits balance:', balanceError);
        // If no balance record exists, that's OK - user just has no credits yet
        setBalance({
          creditsBalance: 0,
          creditsExtra: 0,
          creditsTotal: 0,
          creditsMonthlyLimit: 0,
          periodStart: null,
          periodEnd: null,
        });
      } else if (balanceData && balanceData.length > 0) {
        const row = balanceData[0];
        setBalance({
          creditsBalance: row.credits_balance || 0,
          creditsExtra: row.credits_extra || 0,
          creditsTotal: row.credits_total || 0,
          creditsMonthlyLimit: row.credits_monthly_limit || 0,
          periodStart: row.period_start || null,
          periodEnd: row.period_end || null,
        });
      }

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('user_credits_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) {
        console.error('Error fetching transactions:', txError);
      } else if (txData) {
        setTransactions(txData.map((tx: any) => ({
          id: tx.id,
          amount: tx.amount,
          balanceAfter: tx.balance_after,
          transactionType: tx.transaction_type,
          actionType: tx.action_type,
          description: tx.description,
          createdAt: tx.created_at,
        })));
      }
    } catch (error) {
      console.error('Error in useCreditsBalance refresh:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasEnoughCredits = useCallback((cost: number): boolean => {
    if (isMaster) return true;
    return balance.creditsTotal >= cost;
  }, [balance.creditsTotal, isMaster]);

  return {
    ...balance,
    transactions,
    loading,
    refresh,
    hasEnoughCredits,
    isMaster,
    // Convenience getters
    availableCredits: isMaster ? 999999 : balance.creditsTotal,
  };
}
