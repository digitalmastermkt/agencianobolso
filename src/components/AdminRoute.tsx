import { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Shield, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, role, loading: roleLoading } = useUserRole();
  
  console.log("🔒 AdminRoute Debug:", { 
    user: user?.id, 
    email: user?.email,
    isAdmin, 
    role,
    authLoading, 
    roleLoading 
  });

  // Loading states
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Auth: {authLoading ? 'Carregando...' : 'OK'} | Role: {roleLoading ? 'Carregando...' : (role || 'Nenhum')}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2">Não Autenticado</h2>
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para acessar esta área.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Esta área é exclusiva para administradores. Você não tem permissão para acessar este conteúdo.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Usuário atual: {user.email} | Role: {role || 'Nenhum'}
            </p>
            <p className="text-xs text-muted-foreground">
              Entre em contato com um administrador se você acredita que deveria ter acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}