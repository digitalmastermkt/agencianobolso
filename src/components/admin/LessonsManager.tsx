import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditLessonForm } from "./EditLessonForm";

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
  module_id: string;
  modules?: { title: string; courses?: { title: string } };
}

export function LessonsManager() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          *,
          modules(
            title,
            courses(title)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar aulas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aulas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleDelete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aula excluída com sucesso"
      });
      fetchLessons();
    } catch (error: any) {
      console.error("Erro ao excluir aula:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a aula",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (lesson: Lesson) => {
    window.open(`/treinamentos?preview_lesson=${lesson.id}`, "_blank");
  };

  const handleWatchVideo = (lesson: Lesson) => {
    if (lesson.video_url) {
      window.open(lesson.video_url, "_blank");
    }
  };

  if (loading) {
    return <div>Carregando aulas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aulas Criadas</CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma aula criada ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Módulo/Curso</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {lesson.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">
                        {lesson.modules?.title || "Módulo não encontrado"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lesson.modules?.courses?.title || "Curso não encontrado"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lesson.duration_minutes ? `${lesson.duration_minutes} min` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={lesson.is_published ? "default" : "secondary"}>
                      {lesson.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lesson.order_index}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(lesson)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {lesson.video_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWatchVideo(lesson)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLesson(lesson)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Aula</DialogTitle>
                          </DialogHeader>
                          {editingLesson && (
                            <EditLessonForm
                              lesson={editingLesson}
                              onSuccess={() => {
                                setEditingLesson(null);
                                fetchLessons();
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a aula "{lesson.title}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(lesson.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}