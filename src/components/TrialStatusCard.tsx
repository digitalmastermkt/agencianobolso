import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, Clock } from "lucide-react";
import { useTrialStatus } from "@/hooks/useTrialStatus";

export function TrialStatusCard() {
  const { 
    isTrialActive, 
    dailyCreditsLimit, 
    dailyCreditsUsed, 
    remainingDailyCredits, 
    daysRemaining,
    loading 
  } = useTrialStatus();

  if (loading) {
    return (
      <Card className="border-dashed border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isTrialActive) {
    return null;
  }

  const creditsProgress = ((dailyCreditsUsed / dailyCreditsLimit) * 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Trial Ativo
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {daysRemaining} dias restantes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Créditos hoje
            </span>
            <span className="font-medium">
              {dailyCreditsUsed}/{dailyCreditsLimit}
            </span>
          </div>
          <Progress value={creditsProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {remainingDailyCredits > 0 
              ? `${remainingDailyCredits} créditos restantes hoje`
              : "Créditos esgotados - renovam amanhã"
            }
          </p>
        </div>
        
        <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Acesso total durante o trial:</p>
              <p>• Todos os agentes disponíveis</p>
              <p>• {dailyCreditsLimit} créditos diários</p>
              <p>• Renovação automática a cada 24h</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}