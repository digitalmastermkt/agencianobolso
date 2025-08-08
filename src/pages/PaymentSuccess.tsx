import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function PaymentSuccess() {
  const { refresh, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <main className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Pagamento confirmado</h1>
          <p className="text-muted-foreground">
            Obrigado! Sua assinatura foi processada. {loading ? "Sincronizando status..." : "Status atualizado."}
          </p>
          <div className="flex justify-center">
            <Button onClick={() => navigate("/dashboard")}>Ir para o Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
