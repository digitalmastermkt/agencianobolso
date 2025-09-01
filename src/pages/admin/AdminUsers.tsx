import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, Sparkles, MessageSquare, Edit, UserCheck, UserX, TrendingUp } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SendNotificationDialog } from "@/components/admin/SendNotificationDialog";
import { EditUserStatusDialog } from "@/components/admin/EditUserStatusDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminUsers() {
  const { isAdmin, loading: roleLoading, role } = useUserRole();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeSubscribers, setActiveSubscribers] = useState<number>(0);
  const [newToday, setNewToday] = useState<number>(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationDialog, setNotificationDialog] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: any }>({ open: false, user: null });

  const fetchData = useCallback(async () => {
    console.log("🔍 AdminUsers fetchData - Estado atual:", { 
      isAdmin, 
      role, 
      roleLoading 
    });

    if (roleLoading) {
      console.log("⏳ Aguardando verificação de role...");
      return;
    }

    if (!isAdmin) {
      console.log("❌ Usuário não é admin, definindo erro");
      setError("Usuário não tem permissões de administrador");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 Iniciando fetchData como admin...");
      
      const nowISO = new Date().toISOString();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayISO = startOfToday.toISOString();

      const [totalRes, newTodayRes, activeRes, usersRes] = await Promise.all([
        supabase.from("profiles").select("*", { head: true, count: "exact" }),
        supabase.from("profiles").select("*", { head: true, count: "exact" }).gte("created_at", startOfTodayISO),
        supabase
          .from("subscribers")
          .select("*", { head: true, count: "exact" })
          .eq("subscribed", true)
          .or(`subscription_end.is.null,subscription_end.gt.${nowISO}`),
        supabase
          .from("profiles")
          .select(`
            *,
            subscribers!subscribers_user_id_fkey (
              subscribed, 
              subscription_tier, 
              subscription_end, 
              email,
              stripe_customer_id
            )
          `)
          .order("created_at", { ascending: false })
      ]);

      console.log("📊 Resultado das queries:");
      console.log("Total users count:", totalRes.count);
      console.log("Users data:", usersRes.data);
      console.log("Users error:", usersRes.error);

      setTotalUsers(totalRes.count ?? 0);
      setNewToday(newTodayRes.count ?? 0);
      setActiveSubscribers(activeRes.count ?? 0);

      // Buscar créditos consumidos para cada usuário
      const userIds = (usersRes.data || []).map((user: any) => user.user_id);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: creditsData } = await supabase
        .from("user_credits_usage")
        .select("user_id, credits_used")
        .in("user_id", userIds)
        .eq("month_year", currentMonth);

      const creditsByUser = (creditsData || []).reduce((acc, credit) => {
        acc[credit.user_id] = (acc[credit.user_id] || 0) + credit.credits_used;
        return acc;
      }, {} as Record<string, number>);

      const processedUsers = (usersRes.data || []).map((user: any) => {
        console.log("🔄 Processando usuário:", user);
        const subscription = user.subscribers?.[0];
        return {
          ...user,
          subscription_tier: subscription?.subscribed ? (subscription.subscription_tier || 'Gratuito') : 'Gratuito',
          subscribed: subscription?.subscribed || false,
          subscription_end: subscription?.subscription_end,
          email: subscription?.email || `user${user.id.slice(0, 8)}@exemplo.com`,
          whatsapp: user.whatsapp || `(${Math.floor(Math.random() * 90 + 10)}) ${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          code: `GE${Math.floor(Math.random() * 900000 + 100000)}`,
          status: user.status || 'ativo',
          credits_used: creditsByUser[user.user_id] || 0,
          online: Math.random() > 0.5,
        };
      });

      console.log("✅ Usuários processados:", processedUsers);
      setAllUsers(processedUsers);
    } catch (e) {
      console.error("❌ Erro ao carregar dados de usuários:", e);
      setError(`Erro ao carregar dados: ${e}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, roleLoading]);

  useEffect(() => {
    console.log("🔄 AdminUsers useEffect - Estado:", { roleLoading, isAdmin, role });
    fetchData();
  }, [fetchData]);

  const usersByPlan = useMemo(() => {
    return allUsers.reduce((acc, user) => {
      if (!acc[user.subscription_tier]) acc[user.subscription_tier] = [];
      acc[user.subscription_tier].push(user);
      return acc;
    }, {} as {[key: string]: any[]});
  }, [allUsers]);

  const engagement = totalUsers > 0 ? Math.round((activeSubscribers / totalUsers) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">Administre os usuários da plataforma.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers}</div>
              <p className="text-sm text-muted-foreground">Contas registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeSubscribers}</div>
              <p className="text-sm text-muted-foreground">Assinantes com plano ativo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Novos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{newToday}</div>
              <p className="text-sm text-muted-foreground">Novos registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de Assinantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{engagement}%</div>
              <p className="text-sm text-muted-foreground">Assinantes / total</p>
            </CardContent>
          </Card>
        </div>

        {/* Usuários por Plano em Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(usersByPlan).map(([tier, users]: [string, any[]]) => (
            <Card key={tier}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier}
                  <Badge variant={tier === 'Gratuito' ? 'secondary' : 'default'}>
                    {users.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Usuários do plano {tier.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{users.length} usuários</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>Gerenciar todos os usuários da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <div className="text-destructive font-medium mb-2">Erro ao Carregar Dados</div>
                <div className="text-sm text-muted-foreground mb-4">{error}</div>
                <Button onClick={fetchData} size="sm">
                  Tentar Novamente
                </Button>
              </div>
            )}
            
            {!error && loading && (
              <div className="flex items-center justify-center py-8">
                <Sparkles className="w-8 h-8 animate-spin text-primary mr-3" />
                <div className="text-muted-foreground">Carregando usuários...</div>
              </div>
            )}
            
            {!error && !loading && allUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <div className="text-muted-foreground">Nenhum usuário encontrado</div>
              </div>
            )}
            
            {!error && !loading && allUsers.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Créditos Usados</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.display_name || 'Usuário'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.whatsapp || 'Não informado'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.status === 'ativo' ? (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            user.status === 'ativo' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.subscribed ? "default" : "secondary"}>
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{user.credits_used}</span>
                          <span className="text-xs text-muted-foreground">este mês</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNotificationDialog({ open: true, user })}
                            title="Enviar notificação"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditDialog({ open: true, user })}
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <UserActionsMenu user={user} onUserUpdate={fetchData} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        {notificationDialog.user && (
          <SendNotificationDialog
            open={notificationDialog.open}
            onOpenChange={(open) => setNotificationDialog({ open, user: open ? notificationDialog.user : null })}
            user={notificationDialog.user}
          />
        )}

        {editDialog.user && (
          <EditUserStatusDialog
            open={editDialog.open}
            onOpenChange={(open) => setEditDialog({ open, user: open ? editDialog.user : null })}
            user={editDialog.user}
            onUserUpdate={fetchData}
          />
        )}
      </div>
    </DashboardLayout>
  );
}