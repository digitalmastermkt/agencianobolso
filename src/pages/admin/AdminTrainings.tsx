import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Users, BarChart3 } from "lucide-react";
import { CreateCourseForm } from "@/components/admin/CreateCourseForm";
import { CreateModuleForm } from "@/components/admin/CreateModuleForm";
import { CreateLessonForm } from "@/components/admin/CreateLessonForm";
import { CreateTrainingForm } from "@/components/admin/CreateTrainingForm";
import { CoursesManager } from "@/components/admin/CoursesManager";
import { ModulesManager } from "@/components/admin/ModulesManager";
import { LessonsManager } from "@/components/admin/LessonsManager";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminTrainings() {
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
    <DashboardLayout>
      <div className="p-6 space-y-6">
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
    </DashboardLayout>
  );
}