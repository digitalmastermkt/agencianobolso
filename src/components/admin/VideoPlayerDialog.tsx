import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Maximize2, Minimize2, Check, ChevronRight, Play, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title: string;
  description?: string;
  isPublished?: boolean;
  duration?: number;
}

export function VideoPlayerDialog({
  open,
  onOpenChange,
  videoUrl,
  title,
  description,
  isPublished,
  duration
}: VideoPlayerDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Função para converter URLs do YouTube para embed
  const getEmbedUrl = (url: string) => {
    // YouTube URLs
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
    }

    // Vimeo URLs
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // Se não for YouTube nem Vimeo, retorna a URL original
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${
          isFullscreen 
            ? "max-w-full max-h-full w-screen h-screen p-0 m-0" 
            : "max-w-3xl w-[90vw] max-h-[85vh] p-4"
        } transition-all duration-300`}
      >
        {!isFullscreen && (
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold truncate">
                {title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {isPublished !== undefined && (
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Publicado" : "Rascunho"}
                  </Badge>
                )}
                {duration && (
                  <Badge variant="outline">
                    {duration} min
                  </Badge>
                )}
              </div>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </DialogHeader>
        )}

        <div className={`${isFullscreen ? "h-full" : "aspect-video"} relative bg-black rounded-lg overflow-hidden`}>
          {/* Controles de fullscreen */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            {isFullscreen && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Player de vídeo */}
          <iframe
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        </div>

        {/* Informações adicionais quando não está em fullscreen */}
        {!isFullscreen && description && (
          <div className="pt-2">
            <h4 className="font-medium mb-2">Sobre esta aula</h4>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}