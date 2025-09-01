import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  modules_count?: number;
  lessons_count?: number;
  total_duration?: number;
}

export default function Treinamentos() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { canAccessCourse } = usePlanAccess();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Fetch published courses
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get course details with modules and lessons count
      if (coursesData) {
        const coursesWithDetails = await Promise.all(
          coursesData.map(async (course) => {
            // Get modules count
            const { data: modules } = await supabase
              .from('modules')
              .select('id')
              .eq('course_id', course.id)
              .eq('is_published', true);

            // Get lessons count and total duration
            const { data: lessons } = await supabase
              .from('lessons')
              .select('duration_minutes, modules!inner(course_id)')
              .eq('modules.course_id', course.id)
              .eq('is_published', true);

            return {
              ...course,
              modules_count: modules?.length || 0,
              lessons_count: lessons?.length || 0,
              total_duration: lessons?.reduce((acc, lesson) => acc + (lesson.duration_minutes || 0), 0) || 0
            };
          })
        );
        setCourses(coursesWithDetails);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cursos.",
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
            <h1 className="text-3xl font-bold mb-8">Carregando cursos...</h1>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Cursos</h1>
            <p className="text-muted-foreground">
              Aprenda com nossos cursos organizados em módulos e aulas especializadas.
            </p>
          </div>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Nenhum curso disponível no momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {course.thumbnail_url && (
                    <div className="aspect-video bg-muted">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {canAccessCourse(course.id) ? (
                        <Badge variant="secondary">Liberado</Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    {course.description && (
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        <span>{course.modules_count} módulos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.lessons_count} aulas</span>
                      </div>
                      {course.total_duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.round(course.total_duration / 60)}h</span>
                        </div>
                      )}
                    </div>

                    {canAccessCourse(course.id) ? (
                      <Button asChild className="w-full">
                        <Link to="/treinamentos">
                          Acessar Curso
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled className="w-full flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Plano necessário
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}