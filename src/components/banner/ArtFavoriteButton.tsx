import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ArtFavoriteButtonProps {
  imageUrl: string;
  bannerText?: string;
  cta?: string;
  format?: string;
  projectId?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ArtFavoriteButton({
  imageUrl,
  bannerText = "",
  cta = "",
  format = "quadrado",
  projectId,
  variant = "outline",
  size = "sm",
  className,
  showLabel = false,
}: ArtFavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  // Check if this image is already favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !imageUrl) return;

      const { data } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("agent_type", "diretor_arte")
        .eq("generated_content", imageUrl)
        .maybeSingle();

      if (data) {
        setIsFavorited(true);
        setFavoriteId(data.id);
      } else {
        setIsFavorited(false);
        setFavoriteId(null);
      }
    };

    checkFavorite();
  }, [user, imageUrl]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar favoritos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorited && favoriteId) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("id", favoriteId);

        if (error) throw error;

        setIsFavorited(false);
        setFavoriteId(null);
        toast({
          title: "Removido dos favoritos",
          description: "Arte removida da sua coleção",
        });
      } else {
        // Add to favorites
        const { data, error } = await supabase
          .from("user_favorites")
          .insert({
            user_id: user.id,
            agent_type: "diretor_arte",
            generated_content: imageUrl,
            input_data: {
              banner_text: bannerText,
              cta: cta,
              format: format,
              project_id: projectId,
              type: "art_creative",
            },
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Já está nos favoritos",
              description: "Esta arte já foi favoritada",
            });
            return;
          }
          throw error;
        }

        setIsFavorited(true);
        setFavoriteId(data.id);
        toast({
          title: "Adicionado aos favoritos! ⭐",
          description: "Arte salva na sua coleção",
        });
      }
    } catch (error) {
      console.error("Erro ao favoritar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar favoritos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        "gap-1.5",
        isFavorited && "text-amber-500 hover:text-amber-600",
        className
      )}
    >
      <Star
        className={cn(
          "w-4 h-4",
          isFavorited && "fill-current"
        )}
      />
      {showLabel && (isFavorited ? "Favoritado" : "Favoritar")}
    </Button>
  );
}
