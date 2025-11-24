import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Favorite {
  id: string;
  user_id: string;
  agent_type: string;
  generated_content: string;
  input_data: Json;
  created_at: string;
  updated_at: string;
}

const MAX_HISTORY_PER_AGENT = 10;

export function useFavorites(agentType?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (agentType) {
        query = query.eq('agent_type', agentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFavorites(data || []);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os favoritos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, agentType, toast]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if content is favorited
  const isFavorited = useCallback((content: string) => {
    return favorites.some(fav => fav.generated_content === content);
  }, [favorites]);

  // Get favorite by content
  const getFavoriteByContent = useCallback((content: string) => {
    return favorites.find(fav => fav.generated_content === content);
  }, [favorites]);

  // Add to favorites
  const addFavorite = useCallback(async (
    agentType: string,
    content: string,
    inputData: Record<string, any>
  ) => {
    if (!user) {
      toast({
        title: 'Autenticação necessária',
        description: 'Você precisa estar logado para favoritar',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          agent_type: agentType,
          generated_content: content,
          input_data: inputData as Json,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Já favoritado',
            description: 'Este conteúdo já está nos seus favoritos',
            variant: 'default',
          });
          return false;
        }
        throw error;
      }

      setFavorites(prev => [data, ...prev]);
      toast({
        title: 'Adicionado aos favoritos! ⭐',
        description: 'Conteúdo salvo com sucesso',
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar aos favoritos',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Remove from favorites
  const removeFavorite = useCallback(async (favoriteId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      toast({
        title: 'Removido dos favoritos',
        description: 'Conteúdo removido com sucesso',
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover dos favoritos',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (
    agentType: string,
    content: string,
    inputData: Record<string, any>
  ) => {
    const existingFavorite = getFavoriteByContent(content);
    
    if (existingFavorite) {
      return await removeFavorite(existingFavorite.id);
    } else {
      return await addFavorite(agentType, content, inputData);
    }
  }, [getFavoriteByContent, addFavorite, removeFavorite]);

  // Get favorites grouped by agent
  const getFavoritesByAgent = useCallback(() => {
    const grouped: Record<string, Favorite[]> = {};
    
    favorites.forEach(fav => {
      if (!grouped[fav.agent_type]) {
        grouped[fav.agent_type] = [];
      }
      grouped[fav.agent_type].push(fav);
    });

    return grouped;
  }, [favorites]);

  return {
    favorites,
    loading,
    isFavorited,
    getFavoriteByContent,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoritesByAgent,
    refetch: fetchFavorites,
    totalFavorites: favorites.length,
  };
}
