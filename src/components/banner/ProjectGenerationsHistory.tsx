import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { History, Trash2, RotateCcw, Image, Calendar, FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BannerImage {
  style: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
  format?: string;
}

interface ProjectGeneration {
  id: string;
  project_id: string;
  banner_text: string | null;
  cta: string | null;
  formats: string[];
  images: BannerImage[];
  created_at: string;
}

interface ProjectGenerationsHistoryProps {
  projectId: string | null;
  onReuse: (bannerText: string, cta: string, formats: string[]) => void;
}

export function ProjectGenerationsHistory({ projectId, onReuse }: ProjectGenerationsHistoryProps) {
  const [generations, setGenerations] = useState<ProjectGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && projectId && user) {
      fetchGenerations();
    }
  }, [open, projectId, user]);

  const fetchGenerations = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("project_generations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedGenerations: ProjectGeneration[] = (data || []).map(g => ({
        ...g,
        formats: (g.formats as string[]) || [],
        images: (g.images as unknown as BannerImage[]) || []
      }));

      setGenerations(typedGenerations);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (generationId: string) => {
    try {
      const { error } = await supabase
        .from("project_generations")
        .delete()
        .eq("id", generationId);

      if (error) throw error;

      setGenerations(generations.filter(g => g.id !== generationId));
      toast({
        title: "Geração excluída",
        description: "O item foi removido do histórico",
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleReuse = (generation: ProjectGeneration) => {
    onReuse(
      generation.banner_text || "",
      generation.cta || "",
      generation.formats
    );
    setOpen(false);
    toast({
      title: "Dados carregados! ✨",
      description: "Texto e CTA aplicados no formulário",
    });
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      'quadrado': 'Feed',
      'story': 'Story',
      'retangular': 'Carrossel',
      'banner': 'Banner',
      'feed': 'Feed',
      'reels': 'Reels',
      'carousel': 'Carrossel',
    };
    return labels[format] || format;
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!projectId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          Histórico
          {generations.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {generations.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Gerações
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma geração neste projeto</p>
            <p className="text-sm">Suas artes geradas aparecerão aqui</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {generations.map((generation) => {
                const successImages = generation.images.filter(img => img.success);
                const isExpanded = expandedId === generation.id;
                
                return (
                  <Card key={generation.id} className="overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpanded(generation.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(generation.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          
                          {generation.banner_text && (
                            <p className="font-medium text-sm line-clamp-2 mb-2">
                              {generation.banner_text}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {generation.cta && (
                              <Badge variant="outline" className="text-xs">
                                CTA: {generation.cta}
                              </Badge>
                            )}
                            {generation.formats.map((format) => (
                              <Badge key={format} variant="secondary" className="text-xs">
                                {getFormatLabel(format)}
                              </Badge>
                            ))}
                            <Badge variant="outline" className="text-xs gap-1">
                              <Image className="w-3 h-3" />
                              {successImages.length} imagens
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReuse(generation);
                            }}
                            title="Reutilizar dados"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          
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
                                <AlertDialogTitle>Excluir geração?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta geração será removida permanentemente do histórico.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(generation.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Image Preview */}
                    {isExpanded && successImages.length > 0 && (
                      <div className="px-4 pb-4 border-t bg-muted/30">
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {successImages.slice(0, 6).map((img, idx) => (
                            <div 
                              key={idx}
                              className="aspect-square rounded-lg overflow-hidden bg-muted border"
                            >
                              {img.imageUrl ? (
                                <img 
                                  src={img.imageUrl} 
                                  alt={`Geração ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {successImages.length > 6 && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            +{successImages.length - 6} imagens
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
