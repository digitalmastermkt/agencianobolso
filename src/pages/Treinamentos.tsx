import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  is_enrolled?: boolean;
  modules_count?: number;
  lessons_count?: number;
  total_duration?: number;
}

export default function Treinamentos() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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

      // Check enrollment status for each course
      if (user && coursesData) {
        const coursesWithEnrollment = await Promise.all(
          coursesData.map(async (course) => {
            const { data: enrollment } = await supabase
              .from('user_enrollments')
              .select('id')
              .eq('user_id', user.id)
              .eq('course_id', course.id)
              .maybeSingle();

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
              is_enrolled: !!enrollment,
              modules_count: modules?.length || 0,
              lessons_count: lessons?.length || 0,
              total_duration: lessons?.reduce((acc, lesson) => acc + (lesson.duration_minutes || 0), 0) || 0
            };
          })
        );
        setCourses(coursesWithEnrollment);
      } else {
        setCourses(coursesData || []);
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

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para se inscrever no curso.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          training_id: null
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Você foi inscrito no curso."
      });

      fetchCourses();
    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      toast({
        title: "Erro",
        description: "Erro ao se inscrever no curso.",
        variant: "destructive"
      });
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
                      {course.is_enrolled && (
                        <Badge variant="secondary">Inscrito</Badge>
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

                    <Button
                      onClick={() => handleEnroll(course.id)}
                      disabled={course.is_enrolled}
                      className="w-full"
                    >
                      {course.is_enrolled ? "Já inscrito" : "Inscrever-se"}
                    </Button>
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