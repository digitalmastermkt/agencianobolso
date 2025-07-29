import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Redireciona para a página de auth, salvando a rota atual para voltar depois
      navigate("/auth", { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [user, loading, navigate, location.pathname]);

  // Mostra loading enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, não renderiza nada (o useEffect já fez o redirect)
  if (!user) {
    return null;
  }

  // Se está logado, renderiza o conteúdo protegido
  return <>{children}</>;
}