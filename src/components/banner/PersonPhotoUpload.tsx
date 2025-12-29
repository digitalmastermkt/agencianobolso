import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface PersonAnalysis {
  description: string;
  pose: string;
  suggestedContext: string;
  colorHarmony: {
    skinTone: string;
    hairColor: string;
    clothingColors: string[];
  };
  style: string;
  expression: string;
}

interface PersonPhotoUploadProps {
  onPersonAnalyzed: (person: PersonAnalysis) => void;
  onPersonChange?: (person: PersonAnalysis) => void;
}

export function PersonPhotoUpload({ onPersonAnalyzed, onPersonChange }: PersonPhotoUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [person, setPerson] = useState<PersonAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setPerson(null);
      // Auto-analyze when image is uploaded
      analyzeImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setProgress(10);

    try {
      setProgress(40);
      
      const { data, error } = await supabase.functions.invoke('analyze-person-photo', {
        body: { image: imageData }
      });

      setProgress(80);

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setProgress(100);
      setPerson(data.person);
      onPersonAnalyzed(data.person);

      toast({
        title: "Foto analisada! 👤",
        description: "Dados da pessoa extraídos com sucesso",
      });

    } catch (error: any) {
      console.error('Error analyzing person photo:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Falha ao analisar foto da pessoa",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPerson(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Foto da Pessoa
          </CardTitle>
          <CardDescription>
            Faça upload de uma foto da pessoa para incluir no design
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!image ? (
            /* Upload Area */
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="person-upload"
                disabled={isAnalyzing}
              />
              <label 
                htmlFor="person-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">Clique para enviar</span> a foto
                </div>
                <p className="text-xs text-muted-foreground">
                  A análise será feita automaticamente
                </p>
              </label>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={image}
                  alt="Foto da pessoa"
                  className="max-h-64 rounded-lg border shadow-md"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md hover:bg-destructive/90 transition-colors"
                  disabled={isAnalyzing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analisando foto...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Re-analyze Button */}
              {!isAnalyzing && person && (
                <Button
                  onClick={() => analyzeImage(image)}
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Analisar Novamente
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Person Analysis Result */}
      {person && (
        <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Análise da Pessoa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            <div className="space-y-1">
              <div className="text-sm font-medium">Descrição</div>
              <p className="text-sm text-muted-foreground">{person.description}</p>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Pose: {person.pose}</Badge>
              <Badge variant="outline">Estilo: {person.style}</Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                {person.expression}
              </Badge>
            </div>

            {/* Color Harmony */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Harmonia de Cores</div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  Pele: {person.colorHarmony.skinTone}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Cabelo: {person.colorHarmony.hairColor}
                </Badge>
                {person.colorHarmony.clothingColors.map((color, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Suggested Context */}
            <div className="pt-2 border-t">
              <div className="text-sm font-medium mb-1">Contexto Sugerido</div>
              <p className="text-sm text-muted-foreground italic">
                "{person.suggestedContext}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
