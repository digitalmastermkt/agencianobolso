import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Training {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  is_enrolled?: boolean;
  lessons_count?: number;
  total_duration?: number;
}

export default function Treinamentos() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      // Fetch published trainings
      const { data: trainingsData, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check enrollment status for each training
      if (user && trainingsData) {
        const trainingsWithEnrollment = await Promise.all(
          trainingsData.map(async (training) => {
            const { data: enrollment } = await supabase
              .from('user_enrollments')
              .select('id')
              .eq('user_id', user.id)
              .eq('training_id', training.id)
              .single();

            // Get lessons count and total duration
            const { data: lessons } = await supabase
              .from('lessons')
              .select('duration_minutes')
              .eq('training_id', training.id)
              .eq('is_published', true);

            return {
              ...training,
              is_enrolled: !!enrollment,
              lessons_count: lessons?.length || 0,
              total_duration: lessons?.reduce((acc, lesson) => acc + (lesson.duration_minutes || 0), 0) || 0
            };
          })
        );
        setTrainings(trainingsWithEnrollment);
      } else {
        setTrainings(trainingsData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar treinamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar treinamentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (trainingId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para se inscrever no treinamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_enrollments')
        .insert({
          user_id: user.id,
          training_id: trainingId
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Você foi inscrito no treinamento."
      });

      fetchTrainings();
    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      toast({
        title: "Erro",
        description: "Erro ao se inscrever no treinamento.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Carregando treinamentos...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Treinamentos</h1>
          <p className="text-muted-foreground">
            Aprenda com nossos cursos especializados e melhore suas habilidades.
          </p>
        </div>

        {trainings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhum treinamento disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <Card key={training.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {training.thumbnail_url && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={training.thumbnail_url}
                      alt={training.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{training.title}</CardTitle>
                    {training.is_enrolled && (
                      <Badge variant="secondary">Inscrito</Badge>
                    )}
                  </div>
                  {training.description && (
                    <CardDescription className="line-clamp-2">
                      {training.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>{training.lessons_count} aulas</span>
                    </div>
                    {training.total_duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(training.total_duration / 60)}h</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleEnroll(training.id)}
                    disabled={training.is_enrolled}
                    className="w-full"
                  >
                    {training.is_enrolled ? "Já inscrito" : "Inscrever-se"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}