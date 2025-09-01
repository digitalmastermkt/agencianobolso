import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users, ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePlanAccess } from "@/hooks/usePlanAccess";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      video_url: string;
      duration_minutes: number;
      order_index: number;
    }>;
  }>;
}

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { canAccessCourse } = usePlanAccess();

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    if (!courseId) return;

    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) {
        toast({
          title: "Curso não encontrado",
          description: "O curso solicitado não foi encontrado.",
          variant: "destructive"
        });
        return;
      }

      // Fetch modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          order_index,
          lessons:lessons!inner(
            id,
            title,
            description,
            video_url,
            duration_minutes,
            order_index
          )
        `)
        .eq('course_id', courseId)
        .eq('is_published', true)
        .eq('lessons.is_published', true)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Sort lessons within each module
      const sortedModules = (modulesData || []).map(module => ({
        ...module,
        lessons: (module.lessons || []).sort((a, b) => a.order_index - b.order_index)
      }));

      setCourse({
        ...courseData,
        modules: sortedModules
      });
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar curso.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Carregando curso...</h1>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Curso não encontrado.</p>
                <Button asChild>
                  <Link to="/treinamentos">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar aos Cursos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasAccess = canAccessCourse(course.id);
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const totalDuration = course.modules.reduce((acc, module) => 
    acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration_minutes || 0), 0), 0
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/treinamentos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Cursos
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-1">
              <Card>
                {course.thumbnail_url && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    {hasAccess ? (
                      <Badge variant="secondary">Liberado</Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                  {course.description && (
                    <CardDescription>
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>{course.modules.length} módulos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{totalLessons} aulas</span>
                    </div>
                    {totalDuration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(totalDuration / 60)}h</span>
                      </div>
                    )}
                  </div>

                  {!hasAccess && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Este curso requer um plano específico para acesso.
                      </p>
                      <Button asChild size="sm">
                        <Link to="/vendas">Ver Planos</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Course Content */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Conteúdo do Curso</h2>
                </div>

                {course.modules.map((module, moduleIndex) => (
                  <Card key={module.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Módulo {moduleIndex + 1}: {module.title}
                      </CardTitle>
                      {module.description && (
                        <CardDescription>
                          {module.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              hasAccess ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                hasAccess ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}>
                                {lessonIndex + 1}
                              </div>
                              <div>
                                <div className="font-medium">{lesson.title}</div>
                                {lesson.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {lesson.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {lesson.duration_minutes && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration_minutes}min
                                </div>
                              )}
                              {!hasAccess && <Lock className="h-4 w-4 text-muted-foreground" />}
                              {hasAccess && <Play className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}