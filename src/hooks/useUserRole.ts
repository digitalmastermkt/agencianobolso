import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        console.log("🔒 useUserRole: Nenhum usuário logado");
        setRole(null);
        setLoading(false);
        return;
      }

      console.log("🔒 useUserRole: Buscando role para usuário", user.id, user.email);

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true }) // admin < moderator < user
          .limit(1)
          .maybeSingle();

        console.log("🔒 useUserRole: Resultado da query", { data, error });

        if (error) {
          console.error('❌ Erro ao buscar role do usuário:', error);
          setRole('user'); // Default to user role
        } else {
          const userRole = data?.role || 'user';
          console.log("✅ Role encontrado:", userRole);
          setRole(userRole);
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao buscar role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  return {
    role,
    loading,
    isAdmin,
    isUser,
  };
}