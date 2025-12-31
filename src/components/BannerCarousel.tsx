import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Star, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BannerImage {
  style: string;
  imageUrl: string | null;
  success: boolean;
  error?: string;
}

interface BannerCarouselProps {
  images: BannerImage[];
  onFavorite?: (imageUrl: string, style: string) => void;
  onRegenerateVariation?: (style: string) => void;
  className?: string;
}

export function BannerCarousel({ 
  images, 
  onFavorite, 
  onRegenerateVariation,
  className 
}: BannerCarouselProps) {
  const { toast } = useToast();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const successfulImages = images.filter(img => img.success && img.imageUrl);

  const handleDownload = async (imageUrl: string, style: string) => {
    try {
      let blob: Blob;

      if (imageUrl.startsWith('data:')) {
        // Convert base64 to blob
        const base64Data = imageUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
      } else {
        // Remote URL (ex: DALL·E 3) -> fetch and download
        const resp = await fetch(imageUrl);
        if (!resp.ok) throw new Error(`Falha ao baixar imagem: ${resp.status}`);
        blob = await resp.blob();
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `banner-${style.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado! 📥',
        description: `Banner ${style} baixado com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar a imagem',
        variant: 'destructive',
      });
    }
  };

  if (successfulImages.length === 0) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Não foi possível gerar as imagens. Tente novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent>
          {successfulImages.map((image, index) => (
            <CarouselItem key={index}>
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Badge com estilo da variação */}
                    <Badge 
                      className="absolute top-4 left-4 z-10"
                      variant="secondary"
                    >
                      {image.style}
                    </Badge>

                    {/* Imagem gerada */}
                    <div className="aspect-square md:aspect-video overflow-hidden rounded-t-lg bg-muted">
                      <img
                        src={image.imageUrl!}
                        alt={`Banner - ${image.style}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Ações */}
                    <div className="p-4 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(image.imageUrl!, image.style)}
                          className="flex-1 min-w-[120px]"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PNG
                        </Button>
                        
                        {onFavorite && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onFavorite(image.imageUrl!, image.style)}
                            className="flex-1 min-w-[120px]"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Favoritar
                          </Button>
                        )}
                        
                        {onRegenerateVariation && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRegenerateVariation(image.style)}
                            className="flex-1 min-w-[120px]"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerar
                          </Button>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground text-center">
                        Variação {index + 1} de {successfulImages.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="hidden md:block">
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </div>
      </Carousel>

      {/* Indicadores de navegação para mobile */}
      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {successfulImages.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              current === index ? 'w-8 bg-primary' : 'w-2 bg-muted'
            }`}
            aria-label={`Ir para variação ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
