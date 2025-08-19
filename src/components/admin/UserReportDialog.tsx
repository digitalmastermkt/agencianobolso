import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, BookOpen, CreditCard, Calendar } from "lucide-react";

interface UserReportDialogProps {
  user: {
    id: string;
    user_id: string;
    display_name: string | null;
    subscription_tier: string;
    subscribed: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserStats {
  totalGenerations: number;
  completedLessons: number;
  totalCreditsUsed: number;
  subscriptionHistory: any[];
  recentActivity: any[];
}

export function UserReportDialog({ user, open, onOpenChange }: UserReportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalGenerations: 0,
    completedLessons: 0,
    totalCreditsUsed: 0,
    subscriptionHistory: [],
    recentActivity: [],
  });

  useEffect(() => {
    if (open) {
      fetchUserStats();
    }
  }, [open, user.user_id]);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const [
        generationsRes,
        lessonsRes,
        subscriptionRes,
      ] = await Promise.all([
        // Total de gerações de AI
        supabase
          .from("ai_generations")
          .select("*", { head: true, count: "exact" })
          .eq("user_id", user.user_id),

        // Lições completadas
        supabase
          .from("lesson_progress")
          .select("*", { head: true, count: "exact" })
          .eq("user_id", user.user_id)
          .eq("completed", true),

        // Histórico de assinaturas
        supabase
          .from("subscribers")
          .select("*")
          .eq("user_id", user.user_id)
          .order("created_at", { ascending: false }),
      ]);

      // Atividade recente (últimas gerações)
      const { data: recentActivity } = await supabase
        .from("ai_generations")
        .select("agent_type, created_at")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalGenerations: generationsRes.count || 0,
        completedLessons: lessonsRes.count || 0,
        totalCreditsUsed: (generationsRes.count || 0) * 1, // Assumindo 1 crédito por geração
        subscriptionHistory: subscriptionRes.data || [],
        recentActivity: recentActivity || [],
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Relatório do Usuário: {user.display_name || "Usuário"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando relatório...</div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="courses">Cursos</TabsTrigger>
              <TabsTrigger value="subscription">Assinaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">IA Gerações</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalGenerations}</div>
                    <p className="text-xs text-muted-foreground">
                      Total de conteúdos gerados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lições</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedLessons}</div>
                    <p className="text-xs text-muted-foreground">
                      Lições completadas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Créditos</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCreditsUsed}</div>
                    <p className="text-xs text-muted-foreground">
                      Créditos utilizados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Plano</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <Badge variant={user.subscribed ? "default" : "secondary"}>
                        {user.subscription_tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Status: {user.subscribed ? "Ativo" : "Inativo"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">Geração de IA</div>
                          <div className="text-sm text-muted-foreground">
                            Agente: {activity.agent_type}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </div>
                      </div>
                    ))}
                    {stats.recentActivity.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhuma atividade recente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso em Cursos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Dados de cursos serão exibidos aqui</p>
                    <p className="text-sm">Lições completadas: {stats.completedLessons}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Assinaturas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.subscriptionHistory.map((sub, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{sub.subscription_tier}</div>
                          <div className="text-sm text-muted-foreground">
                            Criado: {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={sub.subscribed ? "default" : "secondary"}>
                            {sub.subscribed ? "Ativo" : "Inativo"}
                          </Badge>
                          {sub.subscription_end && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Expira: {new Date(sub.subscription_end).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {stats.subscriptionHistory.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum histórico de assinatura
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}