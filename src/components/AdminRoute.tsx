import { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

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
            <p className="text-sm text-muted-foreground">
              Entre em contato com um administrador se você acredita que deveria ter acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}