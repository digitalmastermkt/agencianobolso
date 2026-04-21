import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, Palette, Plus } from "lucide-react";
import { toast } from "sonner";

export interface BrandProfileLite {
  id: string;
  name: string;
  logo_url?: string | null;
  colors?: string[] | null;
  visual_style?: string | null;
  mood?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProfileId: string | null;
  onSelect: (profile: BrandProfileLite) => void;
}

export function BrandProfilePickerDialog({
  open,
  onOpenChange,
  selectedProfileId,
  onSelect,
}: Props) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [profiles, setProfiles] = useState<BrandProfileLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open && user) fetchProfiles();
  }, [open, user]);

  const fetchProfiles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("id, name, logo_url, colors, visual_style, mood")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar perfis");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("brand_profiles")
        .insert({ user_id: user.id, name: newName.trim() })
        .select("id, name, logo_url, colors, visual_style, mood")
        .single();
      if (error) throw error;
      setProfiles((p) => [data, ...p]);
      setNewName("");
      toast.success("Perfil criado!");
      onSelect(data);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar perfil");
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (p: BrandProfileLite) => {
    onSelect(p);
    onOpenChange(false);
  };

  const Body = (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Nome do novo perfil..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="min-h-[44px]"
        />
        <Button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-1" />
          {creating ? "Criando..." : "Criar"}
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-6">Carregando...</p>
      ) : profiles.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          Nenhum perfil ainda. Crie o primeiro acima.
        </p>
      ) : (
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-2 pr-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border min-h-[56px] transition-colors text-left ${
                  selectedProfileId === p.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-border hover:bg-muted/30"
                }`}
              >
                {selectedProfileId === p.id ? (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  {p.colors && p.colors.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {p.colors.slice(0, 5).map((c, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-border/50"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="px-0">
            <DrawerTitle>Selecionar Perfil de Marca</DrawerTitle>
            <DrawerDescription>Escolha um perfil ou crie um novo.</DrawerDescription>
          </DrawerHeader>
          {Body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Selecionar Perfil de Marca</DialogTitle>
          <DialogDescription>Escolha um perfil ou crie um novo.</DialogDescription>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
