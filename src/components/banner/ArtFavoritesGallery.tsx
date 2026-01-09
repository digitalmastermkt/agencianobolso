import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Star, Trash2, Download, Calendar, Loader2, ExternalLink, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface FavoriteArt {
  id: string;
  user_id: string;
  generated_content: string; // This is the image URL
  input_data: {
    banner_text?: string;
    cta?: string;
    format?: string;
    project_id?: string;
    type?: string;
  };
  created_at: string;
}

interface ArtFavoritesGalleryProps {
  onReuse?: (bannerText: string, cta: string, format: string) => void;
}

export function ArtFavoritesGallery({ onReuse }: ArtFavoritesGalleryProps) {
  const [favorites, setFavorites] = useState<FavoriteArt[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      fetchFavorites();
    }
  }, [open, user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", user.id)
        .eq("agent_type", "diretor_arte")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedFavorites: FavoriteArt[] = (data || []).map(f => ({
        ...f,
        input_data: (f.input_data as FavoriteArt['input_data']) || {},
      }));

      setFavorites(typedFavorites);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
      toast({
        title: "Erro ao carregar favoritos",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast({
        title: "Favorito removido",
        description: "Arte removida da sua coleção",
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

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `favorito-${Date.now()}-${index + 1}.png`;
    link.click();
    
    toast({
      title: "Download iniciado!",
      description: "Sua imagem está sendo baixada.",
    });
  };

  const handleReuse = (favorite: FavoriteArt) => {
    if (onReuse && favorite.input_data) {
      onReuse(
        favorite.input_data.banner_text || "",
        favorite.input_data.cta || "",
        favorite.input_data.format || "quadrado"
      );
      setOpen(false);
      toast({
        title: "Dados carregados! ✨",
        description: "Texto e CTA aplicados no formulário",
      });
    }
  };

  const getFormatLabel = (format?: string) => {
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
    return labels[format || ''] || format || 'Banner';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Heart className="w-4 h-4" />
          Favoritos
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {favorites.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Artes Favoritas
          </DialogTitle>
          <CardDescription>
            Suas melhores criações salvas para acesso rápido
          </CardDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma arte favorita ainda</p>
            <p className="text-sm">Clique na estrela ⭐ nas suas artes para salvá-las aqui</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
              {favorites.map((favorite, idx) => (
                <div
                  key={favorite.id}
                  className="group relative aspect-square rounded-xl overflow-hidden border bg-muted"
                >
                  <img
                    src={favorite.generated_content}
                    alt={`Favorito ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Star badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-amber-500/90 text-white border-0">
                      <Star className="w-3 h-3 fill-current" />
                    </Badge>
                  </div>

                  {/* Format badge */}
                  {favorite.input_data?.format && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-[10px]"
                    >
                      {getFormatLabel(favorite.input_data.format)}
                    </Badge>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                    {/* Banner text preview */}
                    {favorite.input_data?.banner_text && (
                      <p className="text-white text-xs text-center line-clamp-2 mb-2">
                        {favorite.input_data.banner_text}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(favorite.generated_content, idx)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {onReuse && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReuse(favorite)}
                        >
                          Reusar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(favorite.generated_content, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 mt-1"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover dos favoritos?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta arte será removida da sua coleção de favoritos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(favorite.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Date */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4">
                    <div className="flex items-center gap-1 text-[10px] text-white/70">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(favorite.created_at), "dd/MM/yy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
