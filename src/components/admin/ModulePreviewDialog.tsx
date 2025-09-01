import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayerDialog } from "./VideoPlayerDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration?: number;
  order_index: number;
  is_published: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  course_id: string;
}

interface ModulePreviewDialogProps {
  module: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModulePreviewDialog({ module, open, onOpenChange }: ModulePreviewDialogProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);

  const fetchLessons = async () => {
    if (!module?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", module.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Erro ao buscar aulas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && module) {
      fetchLessons();
    }
  }, [open, module]);

  const handlePlayVideo = (lesson: Lesson) => {
    if (lesson.video_url) {
      setCurrentLesson(lesson);
      setVideoPlayerOpen(true);
    }
  };

  const getTotalDuration = () => {
    return lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  };

  const getPublishedLessons = () => {
    return lessons.filter(lesson => lesson.is_published).length;
  };

  if (!module) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                {module.title}
              </DialogTitle>
              <Badge variant={module.is_published ? "default" : "secondary"}>
                {module.is_published ? "Publicado" : "Rascunho"}
              </Badge>
            </div>
            {module.description && (
              <p className="text-muted-foreground mt-2">
                {module.description}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Estatísticas do módulo */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{lessons.length}</div>
                  <div className="text-sm text-muted-foreground">Aulas</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{getTotalDuration()}min</div>
                  <div className="text-sm text-muted-foreground">Duração</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Badge className="mx-auto mb-2" variant="outline">
                    {getPublishedLessons()}/{lessons.length}
                  </Badge>
                  <div className="text-sm text-muted-foreground">Publicadas</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de aulas */}
            <div className="max-h-96 overflow-y-auto">
              <h4 className="font-semibold mb-3">Aulas do Módulo</h4>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma aula encontrada neste módulo.
                </p>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium truncate">{lesson.title}</h5>
                                {lesson.description && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant={lesson.is_published ? "default" : "secondary"}>
                              {lesson.is_published ? "Publicado" : "Rascunho"}
                            </Badge>
                            
                            {lesson.duration && (
                              <Badge variant="outline">
                                {lesson.duration}min
                              </Badge>
                            )}

                            {lesson.video_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePlayVideo(lesson)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      {currentLesson && (
        <VideoPlayerDialog
          open={videoPlayerOpen}
          onOpenChange={setVideoPlayerOpen}
          videoUrl={currentLesson.video_url || ""}
          title={currentLesson.title}
          description={currentLesson.description}
          isPublished={currentLesson.is_published}
          duration={currentLesson.duration}
        />
      )}
    </>
  );
}