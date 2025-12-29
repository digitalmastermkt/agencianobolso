import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Instagram, Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IdentityVisualCard, VisualIdentity } from "./IdentityVisualCard";

interface InstagramAnalyzerProps {
  onIdentityExtracted: (identity: VisualIdentity) => void;
  onIdentityChange?: (identity: VisualIdentity) => void;
}

export function InstagramAnalyzer({ onIdentityExtracted, onIdentityChange }: InstagramAnalyzerProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [identity, setIdentity] = useState<VisualIdentity | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 5 imagens permitidas",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [images.length, toast]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (identity) {
      setIdentity(null);
    }
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      toast({
        title: "Nenhuma imagem",
        description: "Adicione pelo menos uma imagem do Instagram",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(10);

    try {
      setProgress(30);
      
      const { data, error } = await supabase.functions.invoke('analyze-instagram-identity', {
        body: { images }
      });

      setProgress(80);

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setProgress(100);
      setIdentity(data.identity);
      onIdentityExtracted(data.identity);

      toast({
        title: "Análise concluída! 🎨",
        description: `${data.imagesAnalyzed} imagem(ns) analisada(s) com sucesso`,
      });

    } catch (error: any) {
      console.error('Error analyzing images:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Falha ao analisar imagens do Instagram",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleIdentityChange = (newIdentity: VisualIdentity) => {
    setIdentity(newIdentity);
    onIdentityChange?.(newIdentity);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            Prints do Instagram
          </CardTitle>
          <CardDescription>
            Faça upload de 1 a 5 prints do Instagram para extrair a identidade visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="instagram-upload"
              disabled={images.length >= 5 || isAnalyzing}
            />
            <label 
              htmlFor="instagram-upload" 
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">Clique para enviar</span> ou arraste imagens
              </div>
              <Badge variant="secondary">
                {images.length}/5 imagens
              </Badge>
            </label>
          </div>

          {/* Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={img}
                    alt={`Instagram print ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isAnalyzing}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analisando identidade visual...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={analyzeImages}
            disabled={images.length === 0 || isAnalyzing}
            className="w-full"
            variant="gradient"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : identity ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Analisar Novamente
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Analisar Identidade Visual
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Identity Result */}
      {identity && (
        <IdentityVisualCard 
          identity={identity} 
          onIdentityChange={handleIdentityChange}
          editable={true}
        />
      )}
    </div>
  );
}
