import { useState } from "react";
import { Coins, Sparkles, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreditPackage {
  id: string;
  credits: number;
  price: string;
  priceValue: number;
  popular?: boolean;
  savings?: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "credits_10", credits: 10, price: "R$ 40", priceValue: 40 },
  { id: "credits_25", credits: 25, price: "R$ 90", priceValue: 90, popular: true, savings: "10%" },
  { id: "credits_50", credits: 50, price: "R$ 160", priceValue: 160, savings: "20%" },
];

interface CreditsPackagesDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreditsPackagesDialog({ children, open, onOpenChange }: CreditsPackagesDialogProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Não autenticado",
          description: "Faça login para comprar créditos.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("create-credits-checkout", {
        body: { package_id: packageId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="h-6 w-6 text-primary" />
            Comprar Créditos Extras
          </DialogTitle>
          <DialogDescription>
            Adicione créditos extras à sua conta. Eles não expiram e são usados após seus créditos mensais.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 py-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative transition-all hover:shadow-lg ${
                pkg.popular ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  Mais Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">{pkg.credits}</CardTitle>
                <p className="text-muted-foreground text-sm">créditos</p>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <span className="text-2xl font-bold">{pkg.price}</span>
                  {pkg.savings && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      -{pkg.savings}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  R$ {(pkg.priceValue / pkg.credits).toFixed(2)} por crédito
                </p>
                <Button
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                  disabled={loading !== null}
                  onClick={() => handlePurchase(pkg.id)}
                >
                  {loading === pkg.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Comprar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Créditos extras nunca expiram
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Usados após seus créditos mensais acabarem
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Pagamento único e seguro via Stripe
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
