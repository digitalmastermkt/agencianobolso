import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Check, Palette, Trash2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BrandProfile {
  id: string;
  name: string;
  logo_url: string | null;
  colors: string[] | null;
  visual_style: string | null;
  mood: string | null;
  overall_description: string | null;
  created_at: string;
}

interface BrandProfileSelectorProps {
  selectedProfileId: string | null;
  onSelectProfile: (profile: BrandProfile | null) => void;
}

export function BrandProfileSelector({
  selectedProfileId,
  onSelectProfile,
}: BrandProfileSelectorProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("id, name, logo_url, colors, visual_style, mood, overall_description, created_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Erro ao carregar perfis:", error);
      toast.error("Erro ao carregar perfis de marca");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!user || !newProfileName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("brand_profiles")
        .insert({
          user_id: user.id,
          name: newProfileName.trim(),
        })
        .select("id, name, logo_url, colors, visual_style, mood, overall_description, created_at")
        .single();

      if (error) throw error;

      setProfiles((prev) => [data, ...prev]);
      onSelectProfile(data);
      setNewProfileName("");
      setIsCreateDialogOpen(false);
      toast.success("Perfil de marca criado!");
    } catch (error) {
      console.error("Erro ao criar perfil:", error);
      toast.error("Erro ao criar perfil de marca");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from("brand_profiles")
        .delete()
        .eq("id", profileId);

      if (error) throw error;

      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      if (selectedProfileId === profileId) {
        onSelectProfile(null);
      }
      toast.success("Perfil removido");
    } catch (error) {
      console.error("Erro ao remover perfil:", error);
      toast.error("Erro ao remover perfil");
    }
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Perfil de Marca
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Perfil de Marca</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nome do perfil</Label>
                  <Input
                    id="profile-name"
                    placeholder="Ex: Minha Empresa, Cliente X..."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateProfile()}
                  />
                </div>
                <Button
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim() || creating}
                  className="w-full"
                >
                  {creating ? "Criando..." : "Criar Perfil"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Carregando perfis...
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-muted-foreground text-sm">
              Nenhum perfil de marca criado ainda.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar primeiro perfil
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProfileId === profile.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  }`}
                  onClick={() => onSelectProfile(profile)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedProfileId === profile.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{profile.name}</p>
                      {profile.colors && profile.colors.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {profile.colors.slice(0, 5).map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-border/50"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover perfil?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O perfil "{profile.name}" será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {selectedProfile && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">
              Perfil selecionado:
            </p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="font-medium">{selectedProfile.name}</p>
              {selectedProfile.visual_style && (
                <p className="text-sm text-muted-foreground mt-1">
                  Estilo: {selectedProfile.visual_style}
                </p>
              )}
              {selectedProfile.mood && (
                <p className="text-sm text-muted-foreground">
                  Mood: {selectedProfile.mood}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
