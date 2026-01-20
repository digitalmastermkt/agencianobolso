import { useState } from "react";
import { Coins, TrendingDown, TrendingUp, Sparkles, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { CreditsPackagesDialog } from "@/components/CreditsPackagesDialog";

interface CreditsBalanceDisplayProps {
  compact?: boolean;
  showTransactions?: boolean;
  showBuyButton?: boolean;
}

export function CreditsBalanceDisplay({ 
  compact = false, 
  showTransactions = false,
  showBuyButton = true 
}: CreditsBalanceDisplayProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    creditsBalance,
    creditsExtra,
    creditsTotal,
    creditsMonthlyLimit,
    transactions,
    loading,
    isMaster,
  } = useCreditsBalance();

  if (loading) {
    return (
      <Card className={compact ? "p-3" : ""}>
        <CardContent className={compact ? "p-0" : "pt-6"}>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Master user display
  if (isMaster) {
    return (
      <Card className={`border-primary/30 bg-primary/5 ${compact ? "p-3" : ""}`}>
        <CardContent className={compact ? "p-0" : "pt-6"}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">Acesso Master</span>
            <Badge variant="secondary">Ilimitado</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usedCredits = creditsMonthlyLimit - creditsBalance;
  const usagePercent = creditsMonthlyLimit > 0 
    ? Math.min(100, (usedCredits / creditsMonthlyLimit) * 100) 
    : 0;
  const isLow = creditsTotal <= 3;

  if (compact) {
    return (
      <>
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
          onClick={() => setDialogOpen(true)}
        >
          <Coins className={`h-4 w-4 ${isLow ? 'text-destructive' : 'text-primary'}`} />
          <span className="font-semibold">{creditsTotal}</span>
          <span className="text-xs text-muted-foreground">créditos</span>
          {creditsExtra > 0 && (
            <Badge variant="outline" className="text-xs">+{creditsExtra} extras</Badge>
          )}
          {isLow && (
            <ShoppingCart className="h-3 w-3 text-destructive ml-1" />
          )}
        </div>
        <CreditsPackagesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <>
      <Card className={isLow ? "border-destructive/30 bg-destructive/5" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Coins className={`h-5 w-5 ${isLow ? 'text-destructive' : 'text-primary'}`} />
              Seus Créditos
            </div>
            {isLow && (
              <Badge variant="destructive">Baixo</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main balance */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{creditsTotal}</span>
            <span className="text-muted-foreground">créditos disponíveis</span>
          </div>

          {/* Progress bar */}
          {creditsMonthlyLimit > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uso mensal</span>
                <span>{usedCredits} / {creditsMonthlyLimit}</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>
          )}

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Plano:</span>
              <span className="font-medium">{creditsBalance}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Extras:</span>
              <span className="font-medium">{creditsExtra}</span>
            </div>
          </div>

          {/* Buy credits button */}
          {showBuyButton && (
            <Button 
              variant={isLow ? "destructive" : "outline"}
              className="w-full"
              onClick={() => setDialogOpen(true)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isLow ? "Comprar Créditos" : "Comprar Créditos Extras"}
            </Button>
          )}

          {/* Recent transactions */}
          {showTransactions && transactions.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Últimas transações</h4>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {tx.amount > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {tx.description || tx.actionType || tx.transactionType}
                      </span>
                    </div>
                    <span className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <CreditsPackagesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
