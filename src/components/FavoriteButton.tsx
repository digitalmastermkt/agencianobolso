import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  agentType: string;
  content: string;
  formData: Record<string, any>;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FavoriteButton({
  agentType,
  content,
  formData,
  variant = "outline",
  size = "default",
  className,
}: FavoriteButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites(agentType);
  const favorited = isFavorited(content);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(agentType, content, formData);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        "gap-2",
        favorited && "text-amber-500 hover:text-amber-600",
        className
      )}
    >
      <Star 
        className={cn(
          "w-4 h-4",
          favorited && "fill-current"
        )} 
      />
      {size !== "icon" && (favorited ? "Favoritado" : "Favoritar")}
    </Button>
  );
}
