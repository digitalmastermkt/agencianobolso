import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditModuleForm } from "./EditModuleForm";
import { ModulePreviewDialog } from "./ModulePreviewDialog";

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  course_id: string;
  courses?: { title: string };
  lessons?: any[];
}

export function ModulesManager() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [previewModule, setPreviewModule] = useState<Module | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          courses(title),
          lessons:lessons(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar módulos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os módulos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleDelete = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Módulo excluído com sucesso"
      });
      fetchModules();
    } catch (error: any) {
      console.error("Erro ao excluir módulo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o módulo",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (module: Module) => {
    setPreviewModule(module);
    setPreviewOpen(true);
  };

  if (loading) {
    return <div>Carregando módulos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos Criados</CardTitle>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <p className="text-muted-foreground">Nenhum módulo criado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aulas</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{module.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {module.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {module.courses?.title || "Curso não encontrado"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={module.is_published ? "default" : "secondary"}>
                      {module.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {module.lessons?.[0]?.count || 0} aulas
                  </TableCell>
                  <TableCell>
                    {module.order_index}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(module)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingModule(module)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Módulo</DialogTitle>
                          </DialogHeader>
                          {editingModule && (
                            <EditModuleForm
                              module={editingModule}
                              onSuccess={() => {
                                setEditingModule(null);
                                fetchModules();
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
                              Tem certeza que deseja excluir o módulo "{module.title}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(module.id)}
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

        <ModulePreviewDialog
          module={previewModule}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      </CardContent>
    </Card>
  );
}