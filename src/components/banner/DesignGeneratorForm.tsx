import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisualIdentity } from "./IdentityVisualCard";
import { PersonAnalysis } from "./PersonPhotoUpload";

interface BannerImage {
  style: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
  prompt?: string;
}

interface DesignGeneratorFormProps {
  identity: VisualIdentity;
  person: PersonAnalysis;
  onImagesGenerated: (images: BannerImage[]) => void;
}

export function DesignGeneratorForm({ identity, person, onImagesGenerated }: DesignGeneratorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [formData, setFormData] = useState({
    bannerText: "",
    cta: "",
    formato: "quadrado",
    additionalInfo: ""
  });
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!formData.bannerText.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Informe o texto principal do banner",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressText("Preparando dados...");

    try {
      setProgress(10);
      setProgressText("Cruzando informações...");

      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(25);
      setProgressText("Gerando prompts otimizados...");

      const { data, error } = await supabase.functions.invoke('generate-personalized-banner', {
        body: {
          identity,
          person,
          bannerText: formData.bannerText,
          cta: formData.cta,
          formato: formData.formato,
          additionalInfo: formData.additionalInfo
        }
      });

      setProgress(50);
      setProgressText("Criando arte 1/3...");
      
      // Simulate progressive updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(65);
      setProgressText("Criando arte 2/3...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(80);
      setProgressText("Criando arte 3/3...");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(95);
      setProgressText("Finalizando...");

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setProgress(100);
      setProgressText("Concluído!");
      
      onImagesGenerated(data.images);

      const successCount = data.images.filter((img: BannerImage) => img.success).length;
      toast({
        title: "Artes geradas! 🎉",
        description: `${successCount} variações criadas com sucesso`,
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
          Configure os detalhes finais para gerar suas 3 variações de arte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
            <div className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-1">
              Identidade Visual
            </div>
            <div className="flex flex-wrap gap-1">
              {identity.colors.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-background"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {identity.visualStyle}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
              Pessoa
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              {person.description}
            </div>
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
                <SelectItem value="quadrado">Quadrado (1080x1080)</SelectItem>
                <SelectItem value="retangular">Retangular (1200x628)</SelectItem>
                <SelectItem value="story">Story (1080x1920)</SelectItem>
                <SelectItem value="banner">Banner (1200x400)</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              Tempo estimado: 20-30 segundos
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
              Gerando 3 Variações...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Arte Personalizada
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
