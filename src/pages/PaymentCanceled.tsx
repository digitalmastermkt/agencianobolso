import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaymentCanceled() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <XCircle className="w-12 h-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Pagamento cancelado</h1>
          <p className="text-muted-foreground">
            Sua compra foi cancelada. Você pode tentar novamente quando quiser.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
            <Button onClick={() => navigate("/")}>Ver planos</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
