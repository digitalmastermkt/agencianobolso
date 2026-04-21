import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Check, FolderKanban, Plus } from "lucide-react";

export interface ProjectLite {
  id: string;
  name: string;
  banners?: { id: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectLite[];
  currentProjectId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void> | void;
}

export function ProjectPickerDialog({
  open,
  onOpenChange,
  projects,
  currentProjectId,
  onSelect,
  onCreate,
}: Props) {
  const isMobile = useIsMobile();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreate(newName.trim());
      setNewName("");
      onOpenChange(false);
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  const Body = (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Nome do novo projeto..."
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

      {projects.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          Nenhum projeto ainda. Crie o primeiro acima.
        </p>
      ) : (
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-2 pr-2">
            {projects.map((p) => {
              const count = p.banners?.length || 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border min-h-[56px] transition-colors text-left ${
                    p.id === currentProjectId
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  {p.id === currentProjectId ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} banner{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              );
            })}
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
            <DrawerTitle>Selecionar Projeto</DrawerTitle>
            <DrawerDescription>Troque entre projetos ou crie um novo.</DrawerDescription>
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
          <DialogTitle>Selecionar Projeto</DialogTitle>
          <DialogDescription>Troque entre projetos ou crie um novo.</DialogDescription>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
