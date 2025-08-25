import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Play, Clock, BookOpen, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayerDialog } from "./VideoPlayerDialog";
import { CourseViewerDialog } from "./CourseViewerDialog";

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
  is_published: boolean;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
  created_at: string;
}

interface CoursePreviewDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoursePreviewDialog({ course, open, onOpenChange }: CoursePreviewDialogProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [courseViewerOpen, setCourseViewerOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (course && open) {
      fetchCourseContent();
    }
  }, [course, open]);

  const fetchCourseContent = async () => {
    if (!course) return;
    
    setLoading(true);
    try {
      const { data: modulesData, error } = await supabase
        .from("modules")
        .select(`
          *,
          lessons:lessons(
            id,
            title,
            description,
            video_url,
            duration_minutes,
            order_index,
            is_published,
            module_id
          )
        `)
        .eq("course_id", course.id)
        .order("order_index");

      if (error) throw error;

      const processedModules = (modulesData || []).map(module => ({
        ...module,
        lessons: (module.lessons || []).sort((a, b) => a.order_index - b.order_index)
      }));

      setModules(processedModules);
    } catch (error) {
      console.error("Erro ao buscar conteúdo do curso:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newOpenModules = new Set(openModules);
    if (newOpenModules.has(moduleId)) {
      newOpenModules.delete(moduleId);
    } else {
      newOpenModules.add(moduleId);
    }
    setOpenModules(newOpenModules);
  };

  const handlePlayVideo = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setVideoPlayerOpen(true);
  };

  const getTotalDuration = () => {
    return modules.reduce((total, module) => 
      total + module.lessons.reduce((moduleTotal, lesson) => 
        moduleTotal + (lesson.duration_minutes || 0), 0
      ), 0
    );
  };

  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  const getPublishedLessons = () => {
    return modules.reduce((total, module) => 
      total + module.lessons.filter(lesson => lesson.is_published).length, 0
    );
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Pré-visualização do Curso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Curso */}
          <div className="flex gap-4">
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-32 h-20 object-cover rounded-lg border"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{course.title}</h2>
                <Badge variant={course.is_published ? "default" : "secondary"}>
                  {course.is_published ? "Publicado" : "Rascunho"}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">{course.description}</p>
              
              {/* Action Button */}
              <div className="mb-4">
                <Button
                  onClick={() => setCourseViewerOpen(true)}
                  disabled={getTotalLessons() === 0}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Assistir Curso
                </Button>
              </div>
              
              {/* Stats do Curso */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{modules.length}</div>
                  <div className="text-sm text-muted-foreground">Módulos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{getTotalLessons()}</div>
                  <div className="text-sm text-muted-foreground">Aulas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(getTotalDuration() / 60)}h</div>
                  <div className="text-sm text-muted-foreground">Duração</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{getPublishedLessons()}</div>
                  <div className="text-sm text-muted-foreground">Publicadas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo do Curso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Estrutura do Curso</h3>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : modules.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum módulo criado ainda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {modules.map((module, moduleIndex) => (
                  <Card key={module.id}>
                    <Collapsible
                      open={openModules.has(module.id)}
                      onOpenChange={() => toggleModule(module.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {openModules.has(module.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div>
                                <CardTitle className="text-base">
                                  Módulo {moduleIndex + 1}: {module.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={module.is_published ? "default" : "secondary"}>
                                {module.is_published ? "Publicado" : "Rascunho"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {module.lessons.length} aulas
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {module.lessons.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Nenhuma aula criada neste módulo.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                >
                                  <div className="flex items-center gap-3">
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium text-sm">
                                        Aula {lessonIndex + 1}: {lesson.title}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {lesson.description}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.duration_minutes && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {lesson.duration_minutes}min
                                      </div>
                                    )}
                                    <Badge 
                                      variant={lesson.is_published ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {lesson.is_published ? "Publicado" : "Rascunho"}
                                    </Badge>
                                    {lesson.video_url && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePlayVideo(lesson)}
                                        className="h-6 px-2"
                                      >
                                        <Play className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video Player Dialog */}
        {currentLesson && (
          <VideoPlayerDialog
            open={videoPlayerOpen}
            onOpenChange={setVideoPlayerOpen}
            videoUrl={currentLesson.video_url}
            title={currentLesson.title}
            description={currentLesson.description}
            isPublished={currentLesson.is_published}
            duration={currentLesson.duration_minutes}
          />
        )}

        {/* Course Viewer Dialog (Netflix-style) */}
        {modules.length > 0 && (
          <CourseViewerDialog
            open={courseViewerOpen}
            onOpenChange={setCourseViewerOpen}
            course={{
              id: course.id,
              title: course.title,
              description: course.description || "",
              modules: modules
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}