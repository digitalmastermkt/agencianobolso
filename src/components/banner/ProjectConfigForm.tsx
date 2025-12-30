import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FolderOpen, Trash2, Settings2, Loader2, Image, Palette, Save, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BrandProject {
  id: string;
  name: string;
  brand_profile_id: string | null;
  person_photo_url: string | null;
  person_analysis: Record<string, unknown> | null;
  default_formats: string[];
  variations_count: number;
  created_at: string;
}

interface BrandProfile {
  id: string;
  name: string;
  colors: string[] | null;
}

interface ProjectConfigFormProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onProjectChange?: (project: BrandProject | null) => void;
}

const FORMAT_OPTIONS = [
  { value: "feed", label: "Feed (1:1)", icon: "📱" },
  { value: "story", label: "Story (9:16)", icon: "📲" },
  { value: "reels", label: "Reels (9:16)", icon: "🎬" },
  { value: "carousel", label: "Carrossel (1:1)", icon: "🎠" },
  { value: "banner", label: "Banner (16:9)", icon: "🖼️" },
];

export function ProjectConfigForm({ 
  selectedProjectId, 
  onSelectProject,
  onProjectChange 
}: ProjectConfigFormProps) {
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedBrandProfileId, setSelectedBrandProfileId] = useState<string>("");
  
  // Edit form state
  const [editName, setEditName] = useState("");
  const [editBrandProfileId, setEditBrandProfileId] = useState<string>("");
  const [editFormats, setEditFormats] = useState<string[]>([]);
  const [editVariationsCount, setEditVariationsCount] = useState(3);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchBrandProfiles();
    }
  }, [user]);

  // Update edit form when selected project changes
  useEffect(() => {
    if (selectedProject) {
      setEditName(selectedProject.name);
      setEditBrandProfileId(selectedProject.brand_profile_id || "");
      setEditFormats(selectedProject.default_formats || ["feed"]);
      setEditVariationsCount(selectedProject.variations_count || 3);
      onProjectChange?.(selectedProject);
    } else {
      onProjectChange?.(null);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("brand_projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const typedProjects: BrandProject[] = (data || []).map(p => ({
        ...p,
        default_formats: (p.default_formats as string[]) || ["feed"],
        person_analysis: p.person_analysis as Record<string, unknown> | null
      }));
      
      setProjects(typedProjects);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("id, name, colors")
        .eq("user_id", user?.id)
        .order("name");

      if (error) throw error;
      setBrandProfiles(data || []);
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("brand_projects")
        .insert({
          user_id: user.id,
          name: newProjectName.trim(),
          brand_profile_id: selectedBrandProfileId && selectedBrandProfileId !== "none" ? selectedBrandProfileId : null,
          default_formats: ["feed"],
          variations_count: 3,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: BrandProject = {
        ...data,
        default_formats: (data.default_formats as string[]) || ["feed"],
        person_analysis: data.person_analysis as Record<string, unknown> | null
      };

      setProjects([newProject, ...projects]);
      onSelectProject(data.id);
      setNewProjectName("");
      setSelectedBrandProfileId("");
      setIsCreateDialogOpen(false);

      toast({
        title: "Projeto criado! 🎯",
        description: `Projeto "${newProjectName}" criado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      toast({
        title: "Erro ao criar projeto",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleSaveProject = async () => {
    if (!selectedProjectId || !editName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("brand_projects")
        .update({
          name: editName.trim(),
          brand_profile_id: editBrandProfileId && editBrandProfileId !== "none" ? editBrandProfileId : null,
          default_formats: editFormats,
          variations_count: editVariationsCount,
        })
        .eq("id", selectedProjectId);

      if (error) throw error;

      setProjects(projects.map(p => 
        p.id === selectedProjectId 
          ? { 
              ...p, 
              name: editName.trim(),
              brand_profile_id: editBrandProfileId || null,
              default_formats: editFormats,
              variations_count: editVariationsCount,
            }
          : p
      ));

      toast({
        title: "Projeto salvo! ✅",
        description: "Configurações atualizadas",
      });
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("brand_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProjectId === projectId) {
        onSelectProject(null);
      }

      toast({
        title: "Projeto excluído",
        description: "O projeto foi removido",
      });
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const toggleFormat = (format: string) => {
    if (editFormats.includes(format)) {
      if (editFormats.length > 1) {
        setEditFormats(editFormats.filter(f => f !== format));
      }
    } else {
      setEditFormats([...editFormats, format]);
    }
  };

  const getProfileById = (id: string | null) => {
    return brandProfiles.find(p => p.id === id);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Projetos de Campanha
            </CardTitle>
            <CardDescription>
              Configure e gerencie seus projetos
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Projeto de Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nome do Projeto</Label>
                  <Input
                    id="project-name"
                    placeholder="Ex: Campanha Black Friday"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Marca (opcional)</Label>
                  <Select value={selectedBrandProfileId} onValueChange={setSelectedBrandProfileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {brandProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                  Criar Projeto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Project List */}
        {projects.length > 0 ? (
          <ScrollArea className="h-[120px]">
            <div className="space-y-2">
              {projects.map((project) => {
                const profile = getProfileById(project.brand_profile_id);
                return (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProjectId === project.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{project.name}</span>
                          {project.person_photo_url && (
                            <Badge variant="outline" className="text-xs gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
                              <User className="w-3 h-3" />
                              Foto
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {profile && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Palette className="w-3 h-3" />
                              {profile.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {project.default_formats?.length || 1} formato(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O projeto "{project.name}" será excluído permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum projeto criado</p>
            <p className="text-xs">Crie um projeto para organizar suas campanhas</p>
          </div>
        )}

        {/* Edit Selected Project */}
        {selectedProject && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Settings2 className="w-4 h-4" />
              Configurações do Projeto
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-xs">Nome</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Perfil de Marca</Label>
                <Select value={editBrandProfileId} onValueChange={setEditBrandProfileId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {brandProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center gap-2">
                          {profile.colors && profile.colors.length > 0 && (
                            <div className="flex gap-0.5">
                              {profile.colors.slice(0, 3).map((color, i) => (
                                <div
                                  key={i}
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                          {profile.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Formatos Padrão</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map((format) => (
                    <div
                      key={format.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                        editFormats.includes(format.value)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleFormat(format.value)}
                    >
                      <Checkbox
                        checked={editFormats.includes(format.value)}
                        className="pointer-events-none"
                      />
                      <span>{format.icon}</span>
                      <span className="text-xs">{format.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Variações por Geração</Label>
                <Select 
                  value={editVariationsCount.toString()} 
                  onValueChange={(v) => setEditVariationsCount(parseInt(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? "variação" : "variações"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSaveProject} 
                disabled={saving || !editName.trim()}
                className="w-full gap-2"
                size="sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
