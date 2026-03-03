import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GenerationsGallery } from "@/components/banner/GenerationsGallery";
import { ArtFavoritesGallery } from "@/components/banner/ArtFavoritesGallery";
import { useNavigate } from "react-router-dom";

interface ProjectItem {
  id: string;
  name: string;
  count: number;
}

export default function DiretorArteProjetos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('brand_projects')
        .select('*, project_generations(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          count: p.project_generations?.[0]?.count || 0,
        })));
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    };
    loadProjects();
  }, [user?.id]);

  const handleCreateProject = async () => {
    const trimmedName = projectName.trim();
    if (!trimmedName || !user?.id) return;

    const id = crypto.randomUUID();
    await supabase.from('brand_projects').insert({ id, user_id: user.id, name: trimmedName });

    setProjects(prev => [{ id, name: trimmedName, count: 0 }, ...prev]);
    setSelectedProjectId(id);
    setProjectName("");
    toast({ title: "Projeto criado!", description: trimmedName });
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !user?.id) return;
    await supabase.from('project_generations').delete().eq('project_id', projectToDelete.id);
    await supabase.from('brand_projects').delete().eq('id', projectToDelete.id);
    setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    if (selectedProjectId === projectToDelete.id) {
      setSelectedProjectId(projects.find(p => p.id !== projectToDelete.id)?.id || null);
    }
    toast({ title: "Projeto excluído", description: `"${projectToDelete.name}" foi removido.` });
    setProjectToDelete(null);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <DashboardLayout>
      <div className="min-h-screen py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Projetos</h1>
              <p className="text-sm text-muted-foreground">Organize seus banners por campanha ou cliente</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Seus Projetos</CardTitle>
                    <CardDescription>Crie e gerencie projetos para organizar suas artes.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <ArtFavoritesGallery onReuse={() => {}} />
                    {selectedProjectId && (
                      <GenerationsGallery projectId={selectedProjectId} projectName={selectedProject?.name} onFavorite={() => {}} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Nome do projeto" />
                  <Button onClick={handleCreateProject}>
                    <Plus className="w-4 h-4 mr-1" /> Criar
                  </Button>
                </div>

                {projects.length > 0 ? (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          project.id === selectedProjectId ? 'bg-primary/10 border-primary' : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <button className="flex-1 text-left" onClick={() => setSelectedProjectId(project.id)}>
                          <span className="font-medium">{project.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({project.count} arte{project.count !== 1 ? 's' : ''})</span>
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => setProjectToDelete(project)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold">Crie seu primeiro projeto</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Projetos ajudam a organizar seus banners.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto "{projectToDelete?.name}" e todas as artes serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
