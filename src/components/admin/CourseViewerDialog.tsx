import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Check, 
  ChevronRight, 
  Play, 
  CheckCircle,
  Home,
  ChevronLeft,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  module_id: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface CourseViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  initialLessonId?: string;
}

export function CourseViewerDialog({
  open,
  onOpenChange,
  course,
  initialLessonId
}: CourseViewerDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Get all lessons in order
  const allLessons = course.modules
    .sort((a, b) => a.order_index - b.order_index)
    .flatMap(module => 
      module.lessons.sort((a, b) => a.order_index - b.order_index)
    );

  // Initialize current lesson
  useEffect(() => {
    if (allLessons.length > 0) {
      const lesson = initialLessonId 
        ? allLessons.find(l => l.id === initialLessonId) || allLessons[0]
        : allLessons[0];
      setCurrentLesson(lesson);
    }
  }, [allLessons, initialLessonId]);

  // Load lesson progress
  useEffect(() => {
    if (open) {
      loadLessonProgress();
    }
  }, [open]);

  const loadLessonProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .in("lesson_id", allLessons.map(l => l.id));

      if (error) throw error;

      const progressMap: Record<string, boolean> = {};
      data?.forEach(progress => {
        progressMap[progress.lesson_id] = progress.completed;
      });
      setLessonProgress(progressMap);
    } catch (error) {
      console.error("Error loading lesson progress:", error);
    }
  };

  const markLessonCompleted = async (lessonId: string, goToNext: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          lesson_id: lessonId,
          user_id: user.id,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      setLessonProgress(prev => ({ ...prev, [lessonId]: true }));
      
      if (goToNext) {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex < allLessons.length - 1) {
          setTimeout(() => {
            setCurrentLesson(allLessons[currentIndex + 1]);
            toast({
              title: "Aula concluída!",
              description: `Avançando para: ${allLessons[currentIndex + 1].title}`
            });
          }, 500);
        } else {
          toast({
            title: "Parabéns! Curso concluído!",
            description: "Você concluiu todas as aulas deste curso."
          });
        }
      } else {
        toast({
          title: "Aula concluída!",
          description: "Seu progresso foi salvo."
        });
      }
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a aula como concluída",
        variant: "destructive"
      });
    }
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < allLessons.length - 1) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    }
  };

  const goToPreviousLesson = () => {
    if (!currentLesson) return;
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex > 0) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    }
  };

  const getEmbedUrl = (url: string) => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`;
    }

    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=0`;
    }

    return url;
  };

  const completedLessons = Object.values(lessonProgress).filter(Boolean).length;
  const progressPercentage = (completedLessons / allLessons.length) * 100;

  if (!currentLesson) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${
          isFullscreen 
            ? "max-w-full max-h-full w-screen h-screen p-0 m-0" 
            : "max-w-7xl max-h-[95vh] w-[95vw]"
        } transition-all duration-300`}
      >
        {/* Header with breadcrumb and controls */}
        {!isFullscreen && (
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-4 w-4" />
              <ChevronRight className="h-4 w-4" />
              <span>{course.title}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{currentLesson.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className={`flex ${isFullscreen ? "h-full" : "h-[calc(95vh-120px)]"}`}>
          {/* Video Player Area */}
          <div className={`${isFullscreen ? "w-full" : "flex-1"} relative`}>
            <div className="relative bg-black rounded-lg overflow-hidden h-full">
              {/* Fullscreen controls */}
              {isFullscreen && (
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFullscreen(false)}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Video iframe */}
              <iframe
                key={`lesson-${currentLesson.id}-${Date.now()}`}
                src={getEmbedUrl(currentLesson.video_url)}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentLesson.title}
              />
            </div>

            {/* Lesson info and controls - below video when not fullscreen */}
            {!isFullscreen && (
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{currentLesson.title}</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant={currentLesson.is_published ? "default" : "secondary"}>
                        {currentLesson.is_published ? "Publicado" : "Rascunho"}
                      </Badge>
                      {currentLesson.duration_minutes && (
                        <Badge variant="outline">
                          {currentLesson.duration_minutes} min
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{currentLesson.description}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={goToPreviousLesson}
                    disabled={allLessons.findIndex(l => l.id === currentLesson.id) === 0}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Aula Anterior
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={() => markLessonCompleted(currentLesson.id)}
                    disabled={lessonProgress[currentLesson.id]}
                    className="flex items-center gap-2"
                  >
                    {lessonProgress[currentLesson.id] ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {lessonProgress[currentLesson.id] ? "Aula Concluída" : "Marcar como Concluída"}
                  </Button>

                  {!lessonProgress[currentLesson.id] && (
                    <Button
                      variant="default"
                      onClick={() => markLessonCompleted(currentLesson.id, true)}
                      disabled={lessonProgress[currentLesson.id]}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4" />
                      Concluir e Avançar
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={goToNextLesson}
                    disabled={allLessons.findIndex(l => l.id === currentLesson.id) === allLessons.length - 1}
                    className="flex items-center gap-2"
                  >
                    Próxima Aula
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso do Curso</span>
                    <span>{completedLessons} de {allLessons.length} aulas</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            )}
          </div>

          {/* Lessons Sidebar */}
          {!isFullscreen && (
            <div className="w-80 border-l bg-muted/30">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Aulas do Curso</h3>
                <div className="text-sm text-muted-foreground mt-1">
                  {completedLessons} de {allLessons.length} concluídas
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100%-80px)]">
                <div className="p-4 space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <ChevronDown className="h-4 w-4" />
                        {module.title}
                      </h4>
                      <div className="space-y-1 ml-6">
                        {module.lessons.map((lesson, index) => {
                          const isCompleted = lessonProgress[lesson.id];
                          const isCurrent = currentLesson.id === lesson.id;
                          
                          return (
                            <Card 
                              key={lesson.id} 
                              className={`cursor-pointer transition-all duration-200 ${
                                isCurrent ? "ring-2 ring-primary bg-primary/5 shadow-md" : "hover:bg-muted/50 hover:shadow-sm"
                              }`}
                              onClick={() => {
                                setCurrentLesson(lesson);
                                toast({
                                  title: "Aula selecionada",
                                  description: `Carregando: ${lesson.title}`
                                });
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    {isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : isCurrent ? (
                                      <Play className="h-5 w-5 text-primary" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-sm truncate">
                                      {index + 1}. {lesson.title}
                                    </h5>
                                    {lesson.duration_minutes && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {lesson.duration_minutes} min
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}