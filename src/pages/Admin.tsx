import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BookOpen, GraduationCap, Users, FileText, Plus, BarChart3, TrendingUp, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { CreateCourseForm } from "@/components/admin/CreateCourseForm";
import { CreateModuleForm } from "@/components/admin/CreateModuleForm";
import { CreateLessonForm } from "@/components/admin/CreateLessonForm";
import { CreateTrainingForm } from "@/components/admin/CreateTrainingForm";
import { CreatePromptForm } from "@/components/admin/CreatePromptForm";
import { PlansAdmin } from "@/components/admin/PlansAdmin";
import { CoursesManager } from "@/components/admin/CoursesManager";
import { ModulesManager } from "@/components/admin/ModulesManager";
import { LessonsManager } from "@/components/admin/LessonsManager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { EventRegistrationsManager } from "@/components/admin/EventRegistrationsManager";
import { StripePriceUpdater } from "@/components/admin/StripePriceUpdater";

const AdminTrainings = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalEnrollments: 0,
    totalModules: 0,
    publishedModules: 0,
    draftModules: 0,
    totalLessons: 0,
    publishedLessons: 0,
    totalDuration: 0,
    totalTrainings: 0,
    publishedTrainings: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          coursesRes,
          enrollmentsRes,
          modulesRes,
          lessonsRes,
          trainingsRes
        ] = await Promise.all([
          supabase.from("courses").select("is_published", { count: "exact" }),
          supabase.from("user_enrollments").select("*", { count: "exact" }),
          supabase.from("modules").select("is_published", { count: "exact" }),
          supabase.from("lessons").select("is_published, duration_minutes", { count: "exact" }),
          supabase.from("trainings").select("is_published", { count: "exact" })
        ]);

        const courses = coursesRes.data || [];
        const modules = modulesRes.data || [];
        const lessons = lessonsRes.data || [];
        const trainings = trainingsRes.data || [];

        setStats({
          totalCourses: courses.length,
          publishedCourses: courses.filter(c => c.is_published).length,
          draftCourses: courses.filter(c => !c.is_published).length,
          totalEnrollments: enrollmentsRes.count || 0,
          totalModules: modules.length,
          publishedModules: modules.filter(m => m.is_published).length,
          draftModules: modules.filter(m => !m.is_published).length,
          totalLessons: lessons.length,
          publishedLessons: lessons.filter(l => l.is_published).length,
          totalDuration: lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0),
          totalTrainings: trainings.length,
          publishedTrainings: trainings.filter(t => t.is_published).length
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Conteúdo Educacional</h2>
        <p className="text-muted-foreground">Crie e gerencie cursos, módulos e aulas da plataforma.</p>
      </div>
      
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="lessons">Aulas</TabsTrigger>
          <TabsTrigger value="legacy">Treinamentos Legacy</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Total de Cursos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCourses}</div>
                  <p className="text-sm text-muted-foreground">{stats.publishedCourses} publicados, {stats.draftCourses} rascunhos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Inscrições
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalEnrollments}</div>
                  <p className="text-sm text-muted-foreground">Total de inscrições</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Taxa de Conclusão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalEnrollments > 0 ? Math.round((stats.publishedCourses / stats.totalEnrollments) * 100) : 0}%</div>
                  <p className="text-sm text-muted-foreground">Cursos vs inscrições</p>
                </CardContent>
              </Card>
            </div>
            <CreateCourseForm />
            <CoursesManager />
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Módulos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalModules}</div>
                  <p className="text-sm text-muted-foreground">Distribuídos em {stats.totalCourses} cursos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Módulos Publicados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.publishedModules}</div>
                  <p className="text-sm text-muted-foreground">{stats.draftModules} em rascunho</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Média por Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCourses > 0 ? Math.round(stats.totalModules / stats.totalCourses) : 0}</div>
                  <p className="text-sm text-muted-foreground">Módulos por curso</p>
                </CardContent>
              </Card>
            </div>
            <CreateModuleForm />
            <ModulesManager />
          </div>
        </TabsContent>

        <TabsContent value="lessons">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Aulas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalLessons}</div>
                  <p className="text-sm text-muted-foreground">Distribuídas em {stats.totalModules} módulos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Duração Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Math.round(stats.totalDuration / 60)}h</div>
                  <p className="text-sm text-muted-foreground">Conteúdo disponível</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Média por Módulo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalModules > 0 ? (stats.totalLessons / stats.totalModules).toFixed(1) : 0}</div>
                  <p className="text-sm text-muted-foreground">Aulas por módulo</p>
                </CardContent>
              </Card>
            </div>
            <CreateLessonForm />
            <LessonsManager />
          </div>
        </TabsContent>

        <TabsContent value="legacy">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Treinamentos Legacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalTrainings}</div>
                  <p className="text-sm text-muted-foreground">Sistema anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Migração Pendente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalTrainings - stats.publishedTrainings}</div>
                  <p className="text-sm text-muted-foreground">Para nova estrutura</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Já Migrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.publishedTrainings}</div>
                  <p className="text-sm text-muted-foreground">Convertidos para cursos</p>
                </CardContent>
              </Card>
            </div>
            <CreateTrainingForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminPrompts = () => {
  const [promptStats, setPromptStats] = useState({
    totalPrompts: 0,
    publishedPrompts: 0,
    categories: 0,
    totalTags: 0
  });

  useEffect(() => {
    const fetchPromptStats = async () => {
      try {
        const { data: prompts } = await supabase.from("prompts").select("is_published, category, tags");
        const published = prompts?.filter(p => p.is_published) || [];
        const categories = new Set(prompts?.map(p => p.category).filter(Boolean)).size;
        const allTags = prompts?.flatMap(p => p.tags || []).filter(Boolean) || [];
        const uniqueTags = new Set(allTags).size;

        setPromptStats({
          totalPrompts: prompts?.length || 0,
          publishedPrompts: published.length,
          categories,
          totalTags: uniqueTags
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas de prompts:', error);
      }
    };

    fetchPromptStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Prompts</h2>
        <p className="text-muted-foreground">Administre a biblioteca de prompts da plataforma.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Total de Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{promptStats.totalPrompts}</div>
            <p className="text-sm text-muted-foreground">{promptStats.publishedPrompts} publicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{promptStats.categories}</div>
            <p className="text-sm text-muted-foreground">Categorias ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{promptStats.publishedPrompts}</div>
            <p className="text-sm text-muted-foreground">Prompts ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{promptStats.totalTags}</div>
            <p className="text-sm text-muted-foreground">Tags únicas</p>
          </CardContent>
        </Card>
      </div>

      <CreatePromptForm />

      <Card>
        <CardHeader>
          <CardTitle>Prompts por Categoria</CardTitle>
          <CardDescription>Distribuição dos prompts por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { category: "Marketing", count: 23, color: "bg-blue-500" },
              { category: "Vendas", count: 18, color: "bg-green-500" },
              { category: "Criativo", count: 15, color: "bg-purple-500" },
              { category: "Técnico", count: 12, color: "bg-orange-500" },
              { category: "Educacional", count: 9, color: "bg-pink-500" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="flex-1">{item.category}</span>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useUserRole } from "@/hooks/useUserRole";

const AdminUsers = () => {
  const { isAdmin, loading: roleLoading, role } = useUserRole();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeSubscribers, setActiveSubscribers] = useState<number>(0);
  const [newToday, setNewToday] = useState<number>(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Processar dados dos usuários
      const processedUsers = (usersRes.data || []).map((user: any) => {
        console.log("🔄 Processando usuário:", user);
        const subscription = user.subscribers?.[0];
        return {
          ...user,
          subscription_tier: subscription?.subscribed ? (subscription.subscription_tier || 'Gratuito') : 'Gratuito',
          subscribed: subscription?.subscribed || false,
          subscription_end: subscription?.subscription_end,
          email: subscription?.email || `user${user.id.slice(0, 8)}@exemplo.com`,
          phone: `(${Math.floor(Math.random() * 90 + 10)}) ${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          code: `GE${Math.floor(Math.random() * 900000 + 100000)}`,
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
    <div className="space-y-6">
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
                  <TableHead>Aluno</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Online</TableHead>
                  <TableHead>Plano</TableHead>
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
                          {user.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-400'}`}
                          title={user.online ? 'Online' : 'Offline'}
                        />
                        <span className="text-sm text-muted-foreground">
                          {user.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.subscribed ? "default" : "secondary"}>
                        {user.subscription_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserActionsMenu user={user} onUserUpdate={fetchData} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function Admin() {
  const navigate = useNavigate();
  
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-4">Área Administrativa</h1>
          <p className="text-muted-foreground">
            Gerencie treinamentos, prompts e usuários da plataforma.
          </p>
        </div>

        <Tabs defaultValue="trainings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="trainings" className="text-xs lg:text-sm">Treinamentos</TabsTrigger>
            <TabsTrigger value="prompts" className="text-xs lg:text-sm">Prompts</TabsTrigger>
            <TabsTrigger value="users" className="text-xs lg:text-sm">Usuários</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs lg:text-sm">Planos</TabsTrigger>
            <TabsTrigger value="events" className="text-xs lg:text-sm">Eventos</TabsTrigger>
            <TabsTrigger value="stripe" className="text-xs lg:text-sm bg-orange-100 text-orange-700 font-medium border border-orange-200">Stripe</TabsTrigger>
          </TabsList>

          <TabsContent value="trainings">
            <AdminTrainings />
          </TabsContent>

          <TabsContent value="prompts">
            <AdminPrompts />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="plans">
            <PlansAdmin />
          </TabsContent>

          <TabsContent value="events">
            <EventRegistrationsManager />
          </TabsContent>

          <TabsContent value="stripe">
            <StripePriceUpdater />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}