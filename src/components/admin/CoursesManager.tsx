import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditCourseForm } from "./EditCourseForm";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
  created_at: string;
  modules?: any[];
}

export function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          modules:modules(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar cursos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cursos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Curso excluído com sucesso"
      });
      fetchCourses();
    } catch (error: any) {
      console.error("Erro ao excluir curso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o curso",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (course: Course) => {
    // Navegar para página de preview do curso
    window.open(`/treinamentos?preview=${course.id}`, "_blank");
  };

  if (loading) {
    return <div>Carregando cursos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cursos Criados</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="text-muted-foreground">Nenhum curso criado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {course.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {course.modules?.[0]?.count || 0} módulos
                  </TableCell>
                  <TableCell>
                    {new Date(course.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(course)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Curso</DialogTitle>
                          </DialogHeader>
                          {editingCourse && (
                            <EditCourseForm
                              course={editingCourse}
                              onSuccess={() => {
                                setEditingCourse(null);
                                fetchCourses();
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
                              Tem certeza que deseja excluir o curso "{course.title}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(course.id)}
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