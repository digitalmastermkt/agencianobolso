import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Wand2, Layers, Palette, Type, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VisualIdentity } from "./IdentityVisualCard";
import { PersonAnalysis } from "./PersonPhotoUpload";

interface BannerImage {
  style: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
  prompt?: string;
  format?: string;
}

interface ProjectConfig {
  defaultFormats: string[];
  variationsCount: number;
}

interface DesignGeneratorFormProps {
  identity: VisualIdentity;
  person: PersonAnalysis;
  onImagesGenerated: (images: BannerImage[]) => void;
  projectConfig?: ProjectConfig | null;
  projectId?: string | null;
  initialBannerText?: string;
  initialCta?: string;
  initialFormats?: string[];
}

const FORMAT_OPTIONS = [
  { value: "quadrado", label: "Feed (1080x1080)", projectValue: "feed" },
  { value: "story", label: "Story (1080x1920)", projectValue: "story" },
  { value: "retangular", label: "Retangular (1200x628)", projectValue: "carousel" },
  { value: "banner", label: "Banner (1200x400)", projectValue: "banner" },
];

const STYLE_OPTIONS = [
  { 
    value: "editorial_premium", 
    label: "Editorial Premium", 
    description: "Estilo revista de moda, iluminação dramática, alto contraste",
    icon: "✨"
  },
  { 
    value: "corporate_elegante", 
    label: "Corporate Elegante", 
    description: "Clean, minimalista, tons neutros com accent color da marca",
    icon: "💼"
  },
  { 
    value: "dinamico_impactante", 
    label: "Dinâmico Impactante", 
    description: "Cores vibrantes, composição assimétrica, energia visual alta",
    icon: "⚡"
  },
];

export function DesignGeneratorForm({ 
  identity, 
  person, 
  onImagesGenerated, 
  projectConfig,
  projectId,
  initialBannerText,
  initialCta,
  initialFormats
}: DesignGeneratorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [multiFormatMode, setMultiFormatMode] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["quadrado"]);
  const [selectedStyle, setSelectedStyle] = useState("editorial_premium");
  const [formData, setFormData] = useState({
    bannerText: "",
    cta: "",
    formato: "quadrado",
    additionalInfo: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Map project formats to form format values
  const formatMap: Record<string, string> = {
    'feed': 'quadrado',
    'story': 'story',
    'reels': 'story',
    'carousel': 'retangular',
    'banner': 'banner',
  };

  // Update format when projectConfig changes
  useEffect(() => {
    if (projectConfig?.defaultFormats?.length) {
      const mappedFormats = projectConfig.defaultFormats
        .map(f => formatMap[f])
        .filter(Boolean);
      
      if (mappedFormats.length > 0) {
        setFormData(prev => ({ ...prev, formato: mappedFormats[0] }));
        setSelectedFormats(mappedFormats);
        // Enable multi-format mode if project has multiple formats
        if (mappedFormats.length > 1) {
          setMultiFormatMode(true);
        }
      }
    }
  }, [projectConfig]);

  // Update form when initial values change (from history reuse)
  useEffect(() => {
    if (initialBannerText !== undefined || initialCta !== undefined) {
      setFormData(prev => ({
        ...prev,
        bannerText: initialBannerText || prev.bannerText,
        cta: initialCta || prev.cta,
      }));
    }
    if (initialFormats?.length) {
      const mappedFormats = initialFormats
        .map(f => formatMap[f] || f)
        .filter(Boolean);
      if (mappedFormats.length > 0) {
        setSelectedFormats(mappedFormats);
        setFormData(prev => ({ ...prev, formato: mappedFormats[0] }));
        if (mappedFormats.length > 1) {
          setMultiFormatMode(true);
        }
      }
    }
  }, [initialBannerText, initialCta, initialFormats]);

  const toggleFormat = (format: string) => {
    if (selectedFormats.includes(format)) {
      if (selectedFormats.length > 1) {
        setSelectedFormats(selectedFormats.filter(f => f !== format));
      }
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  // Save generation to project history
  const saveToProjectHistory = async (images: BannerImage[], formats: string[]) => {
    if (!projectId || !user) return;

    try {
      await supabase
        .from('project_generations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          images: images as unknown as Record<string, never>,
          banner_text: formData.bannerText,
          cta: formData.cta,
          formats: formats,
        });
    } catch (error) {
      console.error('Error saving to project history:', error);
    }
  };

  const handleGenerate = async () => {
    if (!formData.bannerText.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Informe o texto principal do banner",
        variant: "destructive",
      });
      return;
    }

    const formatsToGenerate = multiFormatMode ? selectedFormats : [formData.formato];
    const totalFormats = formatsToGenerate.length;

    setIsGenerating(true);
    setProgress(0);
    setProgressText("Preparando dados...");

    try {
      const allImages: BannerImage[] = [];
      
      for (let i = 0; i < formatsToGenerate.length; i++) {
        const formato = formatsToGenerate[i];
        const formatLabel = FORMAT_OPTIONS.find(f => f.value === formato)?.label || formato;
        
        setProgress((i / totalFormats) * 80 + 10);
        setProgressText(`Gerando ${formatLabel} (${i + 1}/${totalFormats})...`);

        const { data, error } = await supabase.functions.invoke('generate-personalized-banner', {
          body: {
            identity,
            person,
            bannerText: formData.bannerText,
            cta: formData.cta,
            formato: formato,
            additionalInfo: formData.additionalInfo,
            generationStyle: selectedStyle
          }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Add format info to images
        const imagesWithFormat = (data.images || []).map((img: BannerImage) => ({
          ...img,
          format: formato
        }));
        
        allImages.push(...imagesWithFormat);
      }

      setProgress(95);
      setProgressText("Finalizando...");

      // Save to project history if projectId is provided
      if (projectId) {
        await saveToProjectHistory(allImages, formatsToGenerate);
      }

      setProgress(100);
      setProgressText("Concluído!");
      
      onImagesGenerated(allImages);

      const successCount = allImages.filter((img: BannerImage) => img.success).length;
      toast({
        title: "Artes geradas! 🎉",
        description: `${successCount} variações criadas em ${totalFormats} formato(s)`,
      });

    } catch (error: any) {
      console.error('Error generating personalized banners:', error);
      toast({
        title: "Erro na geração",
        description: error.message || "Falha ao gerar banners personalizados",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressText("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Gerar Arte Personalizada
        </CardTitle>
        <CardDescription>
          Configure os detalhes finais para gerar suas variações de arte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identity Preview Card */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Identidade Visual do Perfil</span>
          </div>
          
          {/* Colors */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-muted-foreground">Cores:</span>
            <div className="flex gap-1.5">
              {identity.colors.slice(0, 6).map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-md border border-background shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          {/* Typography & Style */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Type className="w-3 h-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {identity.typography.style}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {identity.typography.weight}
              </Badge>
            </div>
          </div>
          
          {/* Visual Style & Mood */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary text-xs">
              {identity.visualStyle}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {identity.mood}
            </Badge>
          </div>

          {/* Generation Style Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <Label>Estilo de Geração</Label>
            </div>
            <div className="grid gap-2">
              {STYLE_OPTIONS.map((style) => (
                <div
                  key={style.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStyle === style.value
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedStyle(style.value)}
                >
                  <div className="text-xl">{style.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{style.label}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </div>
                  {selectedStyle === style.value && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Person Summary */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Pessoa no Design</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{person.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="secondary" className="text-xs">{person.pose}</Badge>
            <Badge variant="outline" className="text-xs">{person.expression}</Badge>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="bannerText">Texto Principal do Banner *</Label>
            <Input
              id="bannerText"
              value={formData.bannerText}
              onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
              placeholder="Ex: Transforme sua vida em 30 dias"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="cta">Call-to-Action (CTA)</Label>
            <Input
              id="cta"
              value={formData.cta}
              onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
              placeholder="Ex: Comece agora, Saiba mais, Inscreva-se"
              className="mt-1.5"
            />
          </div>

          {/* Multi-format toggle */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <Checkbox
              id="multiFormat"
              checked={multiFormatMode}
              onCheckedChange={(checked) => setMultiFormatMode(!!checked)}
            />
            <Label htmlFor="multiFormat" className="flex items-center gap-2 cursor-pointer">
              <Layers className="w-4 h-4" />
              Gerar múltiplos formatos
            </Label>
            {multiFormatMode && (
              <Badge variant="secondary" className="ml-auto">
                {selectedFormats.length} formato(s)
              </Badge>
            )}
          </div>

          {/* Format Selection */}
          {multiFormatMode ? (
            <div className="space-y-2">
              <Label>Selecione os formatos</Label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((format) => (
                  <div
                    key={format.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFormats.includes(format.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleFormat(format.value)}
                  >
                    <Checkbox
                      checked={selectedFormats.includes(format.value)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm">{format.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="formato">Formato da Imagem</Label>
              <Select 
                value={formData.formato} 
                onValueChange={(value) => setFormData({ ...formData, formato: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="additionalInfo">Informações Adicionais</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Instruções extras, detalhes específicos, etc."
              rows={2}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>{progressText}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {multiFormatMode 
                ? `Gerando ${selectedFormats.length} formato(s)...`
                : "Tempo estimado: 20-30 segundos"
              }
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !formData.bannerText.trim()}
          className="w-full"
          variant="gradient"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar {multiFormatMode ? `${selectedFormats.length} Formato(s)` : "Arte Personalizada"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
