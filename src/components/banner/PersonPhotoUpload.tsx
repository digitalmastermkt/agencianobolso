import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Upload, X, Loader2, CheckCircle2, RefreshCw, ImageIcon, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BrandPersonPhotosManager, PersonPhoto } from "./BrandPersonPhotosManager";

export interface ImageContent {
  contentType: "person" | "product" | "scene" | "person_with_product" | "person_in_scene" | "other";
  personDetails: {
    present: boolean;
    position: "front" | "side" | "diagonal" | "back";
    clothing: string;
    expression: string;
  };
  productDetails: {
    present: boolean;
    category: "roupa" | "acessório" | "alimento" | "eletrônico" | "móvel" | "outro";
    description: string;
  };
  sceneDetails: {
    present: boolean;
    environment: "estúdio" | "loja" | "natureza" | "escritório" | "externo" | string;
  };
}

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
  imageContent?: ImageContent;
}

interface BrandProfile {
  id: string;
  name: string;
  person_photos?: PersonPhoto[];
}

interface PersonPhotoUploadProps {
  onPersonAnalyzed: (person: PersonAnalysis) => void;
  onPersonChange?: (person: PersonAnalysis) => void;
  projectId?: string | null;
  initialPhotoUrl?: string | null;
  initialAnalysis?: PersonAnalysis | null;
  brandProfile?: BrandProfile | null;
  onBrandPhotosChange?: (photos: PersonPhoto[]) => void;
}

export function PersonPhotoUpload({ 
  onPersonAnalyzed, 
  onPersonChange, 
  projectId,
  initialPhotoUrl,
  initialAnalysis,
  brandProfile,
  onBrandPhotosChange
}: PersonPhotoUploadProps) {
  const [image, setImage] = useState<string | null>(initialPhotoUrl || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [person, setPerson] = useState<PersonAnalysis | null>(initialAnalysis || null);
  const [progress, setProgress] = useState(0);
  const [isFromProject, setIsFromProject] = useState(!!initialPhotoUrl);
  const [selectedBrandPhotoId, setSelectedBrandPhotoId] = useState<string | null>(null);
  const [showUploadMode, setShowUploadMode] = useState(false);
  const { toast } = useToast();

  // Photos from brand profile
  const brandPhotos: PersonPhoto[] = (brandProfile?.person_photos || []) as PersonPhoto[];

  // Update state when initial values change (project selection)
  useEffect(() => {
    if (initialPhotoUrl && initialAnalysis) {
      setImage(initialPhotoUrl);
      setPerson(initialAnalysis);
      setIsFromProject(true);
    }
  }, [initialPhotoUrl, initialAnalysis]);

  // Save person analysis to project
  const saveToProject = async (personData: PersonAnalysis, imageData: string) => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('brand_projects')
        .update({
          person_photo_url: imageData,
          person_analysis: personData as unknown as Record<string, never>,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Salvo no projeto! 💾",
        description: "Foto e análise salvos automaticamente",
      });
    } catch (error: any) {
      console.error('Error saving to project:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar no projeto",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setPerson(null);
      setIsFromProject(false);
      setSelectedBrandPhotoId(null);
      setShowUploadMode(false);
      // Auto-analyze when image is uploaded
      analyzeImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleReplacePhoto = () => {
    setImage(null);
    setPerson(null);
    setIsFromProject(false);
    setSelectedBrandPhotoId(null);
    setShowUploadMode(false);
  };

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

      // Auto-save to project if projectId is provided
      if (projectId && imageData) {
        await saveToProject(data.person, imageData);
      }

      toast({
        title: "Foto analisada! 👤",
        description: projectId ? "Dados salvos no projeto" : "Dados da pessoa extraídos com sucesso",
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
    setIsFromProject(false);
    setSelectedBrandPhotoId(null);
  };

  // Handle selecting a photo from the brand profile
  const handleSelectBrandPhoto = (photo: PersonPhoto) => {
    setSelectedBrandPhotoId(photo.id);
    setImage(photo.photo_url);
    setPerson(photo.analysis);
    setIsFromProject(false);
    onPersonAnalyzed(photo.analysis);
    
    // Save to project if projectId is provided
    if (projectId) {
      saveToProject(photo.analysis, photo.photo_url);
    }
    
    toast({
      title: "Foto selecionada! ✓",
      description: `Usando "${photo.name}" para o design`,
    });
  };

  // Handle photos change from brand manager
  const handleBrandPhotosChange = (photos: PersonPhoto[]) => {
    onBrandPhotosChange?.(photos);
  };

  // Helper to check if current photo is base64 (new upload) vs URL (stored)
  const isBase64Image = image?.startsWith('data:');

  // If brand profile has photos, show selection mode
  const hasBrandPhotos = brandPhotos.length > 0;

  return (
    <div className="space-y-4">
      {/* Brand Profile Photos Manager */}
      {brandProfile && (
        <BrandPersonPhotosManager
          brandProfileId={brandProfile.id}
          photos={brandPhotos}
          onPhotosChange={handleBrandPhotosChange}
          selectedPhotoId={selectedBrandPhotoId}
          onSelectPhoto={handleSelectBrandPhoto}
        />
      )}

      {/* Photo Selection / Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Foto para o Design
            {isFromProject && (
              <Badge variant="outline" className="ml-2 text-xs bg-green-500/10 text-green-600 border-green-500/30">
                Salva no projeto
              </Badge>
            )}
            {selectedBrandPhotoId && (
              <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/30">
                Do perfil
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {hasBrandPhotos 
              ? "Selecione uma foto salva acima ou faça upload de uma nova"
              : "Faça upload de uma foto da pessoa para incluir no design"
            }
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
                  <span className="text-primary font-medium">Clique para enviar</span> uma nova foto
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
              {(isAnalyzing || isSaving) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isSaving ? "Salvando no projeto..." : "Analisando foto..."}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Re-analyze / Replace Buttons */}
              {!isAnalyzing && !isSaving && (
                <div className="flex gap-2">
                  {person && isBase64Image && (
                    <Button
                      onClick={() => analyzeImage(image!)}
                      variant="outline"
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Analisar Novamente
                    </Button>
                  )}
                  <Button
                    onClick={handleReplacePhoto}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Trocar Foto
                  </Button>
                </div>
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
