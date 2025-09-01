import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StripePriceConfig {
  id: string;
  plan_tier: string;
  billing_cycle: string;
  price_id: string;
}

export interface PriceIds {
  monthly: {
    Essencial: string;
    Premium: string;
    Elite: string;
  };
  annual: {
    Essencial: string;
    Premium: string;
    Elite: string;
  };
}

export function useStripePriceConfig() {
  const [priceIds, setPriceIds] = useState<PriceIds>({
    monthly: { Essencial: '', Premium: '', Elite: '' },
    annual: { Essencial: '', Premium: '', Elite: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadPriceConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_price_config')
        .select('*');
      
      if (error) throw error;
      
      const newPriceIds: PriceIds = {
        monthly: { Essencial: '', Premium: '', Elite: '' },
        annual: { Essencial: '', Premium: '', Elite: '' }
      };
      
      data?.forEach(config => {
        const cycle = config.billing_cycle as 'monthly' | 'annual';
        const tier = config.plan_tier as 'Essencial' | 'Premium' | 'Elite';
        newPriceIds[cycle][tier] = config.price_id;
      });
      
      setPriceIds(newPriceIds);
    } catch (error) {
      console.error('Erro ao carregar configurações do Stripe:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações do Stripe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const savePriceConfig = useCallback(async (newPriceIds: PriceIds) => {
    setSaving(true);
    try {
      const updates = [];
      
      // Prepare all updates
      Object.entries(newPriceIds).forEach(([cycle, tiers]) => {
        Object.entries(tiers).forEach(([tier, priceId]) => {
          if (typeof priceId === 'string' && priceId.trim()) {
            updates.push({
              plan_tier: tier,
              billing_cycle: cycle,
              price_id: priceId.trim()
            });
          }
        });
      });
      
      // Delete existing configs and insert new ones
      const { error: deleteError } = await supabase
        .from('stripe_price_config')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) throw deleteError;
      
      if (updates.length > 0) {
        const { error: insertError } = await supabase
          .from('stripe_price_config')
          .insert(updates);
        
        if (insertError) throw insertError;
      }
      
      setPriceIds(newPriceIds);
      
      toast({
        title: "Sucesso!",
        description: "Configurações do Stripe salvas com sucesso",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Erro ao salvar configurações do Stripe:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações do Stripe",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPriceConfig();
  }, [loadPriceConfig]);

  return {
    priceIds,
    loading,
    saving,
    savePriceConfig,
    refreshConfig: loadPriceConfig
  };
}