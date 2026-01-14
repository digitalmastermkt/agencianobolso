import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Images, Trash2, Download, Calendar, FileText, Loader2, Star, ExternalLink, Grid3X3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BannerImage {
  style?: string;
  imageUrl?: string;
  url?: string;
  success?: boolean;
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

interface GenerationsGalleryProps {
  projectId: string | null;
  projectName?: string;
  onFavorite?: (imageUrl: string, generationData: { bannerText: string; cta: string; format: string }) => void;
}

export function GenerationsGallery({ projectId, projectName, onFavorite }: GenerationsGalleryProps) {
  const [generations, setGenerations] = useState<ProjectGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<ProjectGeneration | null>(null);
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
      console.error("Erro ao buscar gerações:", error);
      toast({
        title: "Erro ao carregar galeria",
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
      if (selectedGeneration?.id === generationId) {
        setSelectedGeneration(null);
      }
      toast({
        title: "Geração excluída",
        description: "As imagens foram removidas",
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

  const handleDownload = async (imageUrl: string, index: number, format?: string) => {
    const { downloadImage } = await import('@/lib/downloadImage');
    const filename = `criativo-${format || 'banner'}-${Date.now()}-${index + 1}.png`;
    const success = await downloadImage(imageUrl, filename);
    
    if (success) {
      toast({
        title: "Download iniciado!",
        description: "Sua imagem está sendo baixada.",
      });
    } else {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem",
        variant: "destructive",
      });
    }
  };

  const handleFavorite = (imageUrl: string, generation: ProjectGeneration) => {
    if (onFavorite) {
      onFavorite(imageUrl, {
        bannerText: generation.banner_text || "",
        cta: generation.cta || "",
        format: generation.formats[0] || "quadrado",
      });
    }
  };

  const getImageUrl = (img: BannerImage): string | null => {
    return img.imageUrl || img.url || null;
  };

  const getSuccessImages = (generation: ProjectGeneration) => {
    return generation.images.filter(img => {
      const url = getImageUrl(img);
      return url && (img.success !== false);
    });
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      'quadrado': 'Feed',
      'story': 'Story',
      'stories': 'Stories',
      'retangular': 'Carrossel',
      'banner': 'Banner',
      'feed': 'Feed',
      'reels': 'Reels',
      'carousel': 'Carrossel',
      'retrato': 'Retrato',
    };
    return labels[format] || format;
  };

  const totalImages = generations.reduce((acc, g) => acc + getSuccessImages(g).length, 0);

  if (!projectId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Images className="w-4 h-4" />
          Galeria
          {totalImages > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalImages}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Galeria de Gerações
            {projectName && (
              <Badge variant="outline" className="ml-2">{projectName}</Badge>
            )}
          </DialogTitle>
          <CardDescription>
            {totalImages} imagem(ns) gerada(s) neste projeto
          </CardDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Images className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma imagem gerada neste projeto</p>
            <p className="text-sm">Gere suas artes para vê-las aqui</p>
          </div>
        ) : (
          <div className="flex gap-4 h-[60vh]">
            {/* Sidebar - Generation List */}
            <ScrollArea className="w-48 shrink-0 border-r pr-4">
              <div className="space-y-2">
                {generations.map((generation) => {
                  const successImages = getSuccessImages(generation);
                  const isSelected = selectedGeneration?.id === generation.id;
                  
                  return (
                    <button
                      key={generation.id}
                      onClick={() => setSelectedGeneration(generation)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/30 hover:bg-muted/50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(generation.created_at), "dd/MM HH:mm")}
                      </div>
                      
                      {generation.banner_text && (
                        <p className="text-xs font-medium line-clamp-2 mb-1">
                          {generation.banner_text}
                        </p>
                      )}
                      
                      <Badge variant="secondary" className="text-[10px]">
                        {successImages.length} img
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Main Content - Image Grid */}
            <div className="flex-1">
              {selectedGeneration ? (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {/* Generation Info */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(selectedGeneration.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                        {selectedGeneration.banner_text && (
                          <p className="font-medium text-lg mb-2">
                            {selectedGeneration.banner_text}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {selectedGeneration.cta && (
                            <Badge variant="outline">CTA: {selectedGeneration.cta}</Badge>
                          )}
                          {selectedGeneration.formats.map((fmt) => (
                            <Badge key={fmt} variant="secondary">
                              {getFormatLabel(fmt)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir geração?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Todas as imagens desta geração serão removidas permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(selectedGeneration.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {getSuccessImages(selectedGeneration).map((img, idx) => {
                        const imageUrl = getImageUrl(img);
                        if (!imageUrl) return null;

                        return (
                          <div
                            key={idx}
                            className="group relative aspect-square rounded-xl overflow-hidden border bg-muted"
                          >
                            <img
                              src={imageUrl}
                              alt={`Geração ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownload(imageUrl, idx, img.format || img.style)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {onFavorite && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleFavorite(imageUrl, selectedGeneration)}
                                >
                                  <Star className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => window.open(imageUrl, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Format badge */}
                            {(img.format || img.style) && (
                              <Badge 
                                variant="secondary" 
                                className="absolute top-2 left-2 text-[10px]"
                              >
                                {getFormatLabel(img.format || img.style || '')}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bulk download */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        getSuccessImages(selectedGeneration).forEach((img, idx) => {
                          const url = getImageUrl(img);
                          if (url) {
                            setTimeout(() => handleDownload(url, idx, img.format || img.style), idx * 500);
                          }
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Todas ({getSuccessImages(selectedGeneration).length})
                    </Button>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Images className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Selecione uma geração</p>
                    <p className="text-sm">para ver as imagens</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
