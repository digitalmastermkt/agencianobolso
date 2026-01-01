import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TrialStatusCard } from "@/components/TrialStatusCard";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Palette, 
  Loader2, 
  Upload, 
  X, 
  Image as ImageIcon,
  Copy,
  Check,
  LayoutTemplate,
  Type,
  Paintbrush,
  Download,
  Square,
  RectangleVertical,
  Smartphone,
  Scissors,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { useAuth } from "@/hooks/useAuth";
import { useBackgroundRemoval, loadImageFromUrl, blobToDataUrl } from "@/hooks/useBackgroundRemoval";
import { BannerComposite, BANNER_FORMATS, type BannerFormat } from "@/components/banner/BannerComposite";

interface ArtDirectorDecision {
  template: "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda";
  headline: string;
  subheadline?: string;
  cta?: string;
  style: "clean" | "minimal" | "premium";
  scene_prompt?: string;
}

interface ProjectBanner {
  id: string;
  format: BannerFormat;
  backgroundImageUrl: string;
  personPhotoUrl?: string;
  personCutoutUrl?: string; // Person with background removed
  personPosition: 'esquerda' | 'centro' | 'direita';
  headline: string;
  subheadline?: string;
  cta?: string;
  colors: {
    headline: string;
    subheadline: string;
    ctaBackground: string;
    ctaText: string;
    brandPrimary?: string;
  };
  brandColors?: string[];
  style: 'clean' | 'minimal' | 'premium';
  createdAt: string;
}

interface ProjectItem {
  id: string;
  name: string;
  banners: ProjectBanner[];
}

const PROJECTS_STORAGE_KEY = "art-director-projects-v2";
const MAX_BANNERS_BETA = 10;

// Cores padrão para textos
const DEFAULT_COLORS = {
  headline: '#ffffff',
  subheadline: '#f1f5f9',
  ctaBackground: '#ffffff',
  ctaText: '#0f172a',
};

export default function AgenteDiretorArte() {
  const { toast } = useToast();
  const { isMobile, buttonMinHeight, inputHeight } = useMobileOptimization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const bannerRef = useRef<HTMLDivElement>(null);
  
  // Background removal hook
  const { 
    removeBackground, 
    isProcessing: isRemovingBg, 
    progress: bgRemovalProgress,
    error: bgRemovalError 
  } = useBackgroundRemoval();
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [personCutoutUrl, setPersonCutoutUrl] = useState<string | null>(null); // Background removed
  const [bannerText, setBannerText] = useState("");
  const [ctaText, setCtaText] = useState("");
  
  // Format & mode
  const [selectedFormat, setSelectedFormat] = useState<BannerFormat>('quadrado');
  const [preserveIdentity, setPreserveIdentity] = useState(true);
  
  // Brand profile
  const [brandProfile, setBrandProfile] = useState<Record<string, unknown> | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  
  // Generated content
  const [decision, setDecision] = useState<ArtDirectorDecision | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  // UI state
  const [copied, setCopied] = useState(false);
  const [showJsonDebug, setShowJsonDebug] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const currentProjectRef = useRef<string | null>(null);
  
  const storageKey = useMemo(
    () => `${PROJECTS_STORAGE_KEY}:${user?.id ?? "anonymous"}`,
    [user?.id]
  );
  
  const totalBanners = useMemo(
    () => projects.reduce((sum, project) => sum + project.banners.length, 0),
    [projects]
  );
  
  const limitReached = totalBanners >= MAX_BANNERS_BETA;

  // Load projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ProjectItem[];
        setProjects(parsed);
        if (parsed.length > 0) {
          setCurrentProjectId(parsed[0].id);
          currentProjectRef.current = parsed[0].id;
        }
      } catch {
        setProjects([]);
      }
    }
  }, [storageKey]);

  // Save projects to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(projects));
  }, [projects, storageKey]);

  // Load brand profile
  useEffect(() => {
    const loadBrandProfile = async () => {
      if (!user?.id) return;
      
      const { data: profileData, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && profileData) {
        setBrandProfile(profileData as unknown as Record<string, unknown>);
        if (Array.isArray(profileData.colors)) {
          setBrandColors(profileData.colors);
        }
      }
    };
    
    loadBrandProfile();
  }, [user?.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    const imageDataUrl = await new Promise<string>((resolve) => {
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages([imageDataUrl]);
    setPersonCutoutUrl(null); // Reset cutout when new image uploaded

    // Auto remove background if preserveIdentity is enabled
    if (preserveIdentity) {
      try {
        toast({
          title: "Processando imagem...",
          description: "Removendo fundo automaticamente. Isso pode levar alguns segundos.",
        });
        
        const img = await loadImageFromUrl(imageDataUrl);
        const cutoutBlob = await removeBackground(img);
        const cutoutDataUrl = await blobToDataUrl(cutoutBlob);
        setPersonCutoutUrl(cutoutDataUrl);
        
        toast({
          title: "Fundo removido!",
          description: "Sua foto está pronta para composição.",
        });
      } catch (err) {
        console.error("Error removing background:", err);
        toast({
          title: "Aviso",
          description: "Não foi possível remover o fundo. A foto original será usada.",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPersonCutoutUrl(null);
  };

  // Manual background removal trigger
  const handleRemoveBackground = async () => {
    if (!images[0]) return;
    
    try {
      toast({
        title: "Processando...",
        description: "Removendo fundo da imagem.",
      });
      
      const img = await loadImageFromUrl(images[0]);
      const cutoutBlob = await removeBackground(img);
      const cutoutDataUrl = await blobToDataUrl(cutoutBlob);
      setPersonCutoutUrl(cutoutDataUrl);
      
      toast({
        title: "Fundo removido!",
        description: "Foto processada com sucesso.",
      });
    } catch (err) {
      console.error("Error removing background:", err);
      toast({
        title: "Erro",
        description: "Não foi possível remover o fundo.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (limitReached) {
      toast({
        title: "Limite do beta atingido",
        description: "Você atingiu o limite de 10 artes do beta. Obrigado por testar!",
        variant: "destructive",
      });
      return;
    }

    const description = bannerText.trim();
    if (!description) {
      toast({
        title: "Descrição necessária",
        description: "Digite uma descrição (texto principal) para gerar o criativo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setDecision(null);
    setBackgroundImageUrl(null);
    setGeneratedImageUrl(null);

    try {
      const personImageUrl = images[0] ?? null;

      const { data, error } = await supabase.functions.invoke("generate_creatives", {
        body: { 
          description, 
          brandProfile: brandProfile || {}, 
          format: selectedFormat, 
          personImageUrl,
          preserve_identity: preserveIdentity,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Mapeia resposta do backend
      const newDecision: ArtDirectorDecision = {
        template: data.template,
        headline: data.headline,
        subheadline: data.subheadline,
        cta: data.cta || ctaText,
        style: data.style,
        scene_prompt: data.scene_prompt,
      };
      
      setDecision(newDecision);
      
      // Definir imagem baseado no modo
      if (preserveIdentity && data.backgroundImageUrl) {
        setBackgroundImageUrl(data.backgroundImageUrl);
      } else if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      }

      toast({
        title: "Banner gerado!",
        description: preserveIdentity 
          ? "Fundo gerado com sucesso. Sua foto será sobreposta." 
          : "Criativo completo gerado com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Erro na geração:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyJson = () => {
    if (!decision) return;
    navigator.clipboard.writeText(JSON.stringify(decision, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "JSON copiado!",
      description: "Decisão copiada para a área de transferência."
    });
  };

  const getTemplateLabel = (template: string) => {
    const labels: Record<string, string> = {
      'pessoa_direita': 'Pessoa à Direita',
      'pessoa_centro': 'Pessoa ao Centro',
      'pessoa_esquerda': 'Pessoa à Esquerda'
    };
    return labels[template] || template;
  };

  const getStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      'clean': 'Clean',
      'minimal': 'Minimal',
      'premium': 'Premium'
    };
    return labels[style] || style;
  };

  const handleCreateProject = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      toast({
        title: "Informe um nome",
        description: "Digite o nome do projeto para continuar.",
        variant: "destructive",
      });
      return;
    }

    const newProject: ProjectItem = {
      id: crypto.randomUUID(),
      name: trimmedName,
      banners: [],
    };

    setProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    currentProjectRef.current = newProject.id;
    setProjectName("");
  };

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    currentProjectRef.current = projectId;
  };

  const createDefaultProject = () => {
    const defaultProject: ProjectItem = {
      id: crypto.randomUUID(),
      name: "Projeto Geral",
      banners: [],
    };
    setProjects((prev) => [defaultProject, ...prev]);
    setCurrentProjectId(defaultProject.id);
    currentProjectRef.current = defaultProject.id;
    return defaultProject.id;
  };

  // Export banner at exact dimensions
  const handleExportBanner = async () => {
    if (!bannerRef.current) return;
    
    setExporting(true);
    
    try {
      const { width, height } = BANNER_FORMATS[selectedFormat];
      
      // Create offscreen canvas at exact dimensions
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar o canvas');
      }

      // Get the background image
      const bgUrl = preserveIdentity ? backgroundImageUrl : (generatedImageUrl || backgroundImageUrl);
      if (!bgUrl) {
        throw new Error('Nenhuma imagem de fundo disponível');
      }

      // Load and draw background
      const bgImage = await loadImage(bgUrl);
      ctx.drawImage(bgImage, 0, 0, width, height);

      // Draw gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.5);
      gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height * 0.5);

      // Draw person if preserveIdentity mode
      if (preserveIdentity && images[0]) {
        const personImage = await loadImage(images[0]);
        const personHeight = height * 0.7;
        const personWidth = (personImage.width / personImage.height) * personHeight;
        
        let personX: number;
        const personPosition = decision?.template?.replace('pessoa_', '') || 'centro';
        
        switch (personPosition) {
          case 'esquerda':
            personX = width * 0.05;
            break;
          case 'direita':
            personX = width - personWidth - width * 0.05;
            break;
          default:
            personX = (width - personWidth) / 2;
        }
        
        const personY = height - personHeight;
        ctx.drawImage(personImage, personX, personY, personWidth, personHeight);
      }

      // Draw text
      if (decision) {
        const safeMargin = width * 0.05;
        const fontSize = width * 0.06;
        
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        // Headline
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = DEFAULT_COLORS.headline;
        
        const personPosition = decision.template?.replace('pessoa_', '') || 'centro';
        let textX: number;
        let textAlign: CanvasTextAlign = 'left';
        let maxTextWidth = width * 0.5;
        
        switch (personPosition) {
          case 'esquerda':
            textX = width - safeMargin;
            textAlign = 'right';
            break;
          case 'direita':
            textX = safeMargin;
            textAlign = 'left';
            break;
          default:
            textX = width / 2;
            textAlign = 'center';
            maxTextWidth = width * 0.9;
        }
        
        ctx.textAlign = textAlign;
        
        // Wrap text
        const headlineLines = wrapText(ctx, decision.headline, maxTextWidth);
        let y = safeMargin;
        headlineLines.forEach(line => {
          ctx.fillText(line, textX, y);
          y += fontSize * 1.2;
        });

        // Subheadline
        if (decision.subheadline) {
          ctx.font = `${fontSize * 0.6}px system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = DEFAULT_COLORS.subheadline;
          y += fontSize * 0.3;
          const subLines = wrapText(ctx, decision.subheadline, maxTextWidth);
          subLines.forEach(line => {
            ctx.fillText(line, textX, y);
            y += fontSize * 0.8;
          });
        }

        // CTA
        if (decision.cta) {
          ctx.font = `600 ${fontSize * 0.45}px system-ui, -apple-system, sans-serif`;
          y += fontSize * 0.5;
          
          const ctaWidth = ctx.measureText(decision.cta.toUpperCase()).width + fontSize;
          const ctaHeight = fontSize * 0.8;
          
          let ctaX: number;
          switch (personPosition) {
            case 'esquerda':
              ctaX = textX - ctaWidth;
              break;
            case 'direita':
              ctaX = textX;
              break;
            default:
              ctaX = textX - ctaWidth / 2;
          }
          
          // CTA background
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = DEFAULT_COLORS.ctaBackground;
          ctx.beginPath();
          ctx.roundRect(ctaX, y, ctaWidth, ctaHeight, width * 0.02);
          ctx.fill();
          
          // CTA text
          ctx.fillStyle = DEFAULT_COLORS.ctaText;
          ctx.textAlign = 'center';
          ctx.fillText(decision.cta.toUpperCase(), ctaX + ctaWidth / 2, y + (ctaHeight - fontSize * 0.4) / 2);
        }
      }

      // Export
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Falha ao gerar imagem');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `banner-${selectedFormat}-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Imagem exportada!",
          description: `Banner ${BANNER_FORMATS[selectedFormat].width}x${BANNER_FORMATS[selectedFormat].height}px baixado.`,
        });
      }, 'image/png');
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Não foi possível gerar a imagem.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Helper functions
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Save banner to project
  useEffect(() => {
    if (!decision) return;
    
    const bgImage = preserveIdentity ? backgroundImageUrl : generatedImageUrl;
    if (!bgImage) return;
    
    if (limitReached) {
      return;
    }
    
    const targetProjectId = currentProjectRef.current ?? createDefaultProject();

    const personPosition = decision.template.replace('pessoa_', '') as 'esquerda' | 'centro' | 'direita';
    
    const newBanner: ProjectBanner = {
      id: crypto.randomUUID(),
      format: selectedFormat,
      backgroundImageUrl: bgImage,
      personPhotoUrl: preserveIdentity ? images[0] : undefined,
      personCutoutUrl: preserveIdentity ? personCutoutUrl ?? undefined : undefined,
      personPosition,
      headline: decision.headline,
      subheadline: decision.subheadline,
      cta: decision.cta,
      colors: {
        ...DEFAULT_COLORS,
        brandPrimary: brandColors[0],
      },
      brandColors: brandColors,
      style: decision.style,
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) =>
      prev.map((project) =>
        project.id === targetProjectId
          ? { ...project, banners: [newBanner, ...project.banners] }
          : project
      )
    );
  }, [decision, backgroundImageUrl, generatedImageUrl, personCutoutUrl, brandColors]);

  const currentProject = projects.find((project) => project.id === currentProjectId) ?? null;

  // Calculate preview scale based on container width
  const getPreviewScale = () => {
    const containerWidth = 400; // Approximate container width
    const { width } = BANNER_FORMATS[selectedFormat];
    return Math.min(containerWidth / width, 0.4);
  };

  // Get format icon
  const getFormatIcon = (format: BannerFormat) => {
    switch (format) {
      case 'stories':
        return <Smartphone className="w-4 h-4" />;
      case 'retrato':
        return <RectangleVertical className="w-4 h-4" />;
      case 'quadrado':
        return <Square className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                <Palette className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Diretor de Arte</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gera criativos profissionais com IA, preservando sua identidade visual.
              <span className="block text-sm mt-1 text-muted-foreground/80">
                Escolha o formato, envie sua foto e deixe a IA criar o cenário perfeito.
              </span>
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <Badge variant="secondary">Beta</Badge>
              <p className="text-sm text-muted-foreground">
                {totalBanners}/{MAX_BANNERS_BETA} artes do beta
              </p>
            </div>
            {limitReached && (
              <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Você atingiu o limite de 10 artes do beta. Obrigado por testar!
              </div>
            )}
          </div>

          <div className="mb-8 max-w-md mx-auto">
            <TrialStatusCard />
            <SubscriptionStatusCard />
          </div>

          {/* Projects Section */}
          <div className="mb-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projetos</CardTitle>
                <CardDescription>
                  Crie projetos e organize os banners gerados por cliente ou campanha.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Nome do projeto"
                  />
                  <Button type="button" onClick={handleCreateProject}>
                    Criar projeto
                  </Button>
                </div>

                {projects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {projects.map((project) => (
                      <Button
                        key={project.id}
                        type="button"
                        variant={project.id === currentProjectId ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectProject(project.id)}
                      >
                        {project.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center sm:p-8">
                    <h3 className="text-lg font-semibold">Crie seu primeiro projeto</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Em 3 passos: 1) crie um projeto, 2) envie sua foto,
                      3) gere o banner e baixe a imagem.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Banners */}
            {currentProject && currentProject.banners.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Banners do projeto</CardTitle>
                  <CardDescription>
                    {currentProject.banners.length} banner(s) gerado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentProject.banners.map((banner) => (
                      <div key={banner.id} className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(banner.createdAt).toLocaleString()}
                        </div>
                        <div className="overflow-hidden rounded-lg border">
                          <BannerComposite
                            format={banner.format}
                            backgroundImageUrl={banner.backgroundImageUrl}
                            personPhotoUrl={banner.personPhotoUrl}
                            personPosition={banner.personPosition}
                            headline={banner.headline}
                            subheadline={banner.subheadline}
                            cta={banner.cta}
                            colors={banner.colors}
                            style={banner.style}
                            previewScale={0.15}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card id="gerar-banner">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Criar Banner
                </CardTitle>
                <CardDescription>
                  Configure o formato, modo e envie sua foto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Format Selector */}
                  <div>
                    <Label className="font-medium mb-3 block">Formato</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(BANNER_FORMATS) as BannerFormat[]).map((format) => (
                        <Button
                          key={format}
                          type="button"
                          variant={selectedFormat === format ? "default" : "outline"}
                          className="flex flex-col items-center gap-1 h-auto py-3"
                          onClick={() => setSelectedFormat(format)}
                        >
                          {getFormatIcon(format)}
                          <span className="text-xs font-medium">{BANNER_FORMATS[format].label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {BANNER_FORMATS[format].width}x{BANNER_FORMATS[format].height}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Preserve Identity Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="preserve-identity" className="font-medium">
                        Preservar Identidade
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {preserveIdentity 
                          ? "Sua foto será sobreposta ao cenário gerado pela IA" 
                          : "A IA gerará a pessoa + cenário (pode distorcer)"}
                      </p>
                    </div>
                    <Switch
                      id="preserve-identity"
                      checked={preserveIdentity}
                      onCheckedChange={setPreserveIdentity}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label className="font-medium mb-2 block">
                      {preserveIdentity ? "Sua Foto (será sobreposta)" : "Referência Visual"}
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full border-dashed border-2 ${inputHeight}`}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={images.length >= 1 || isRemovingBg}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {isRemovingBg ? 'Processando...' : 'Adicionar Foto'}
                    </Button>

                    {/* Background removal progress */}
                    {isRemovingBg && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Scissors className="w-4 h-4 animate-pulse" />
                          <span>Removendo fundo... {bgRemovalProgress}%</span>
                        </div>
                        <Progress value={bgRemovalProgress} className="h-2" />
                      </div>
                    )}

                    {/* Image preview with cutout */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {/* Original */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Original</p>
                          <div className="relative aspect-square rounded-lg overflow-hidden border">
                            <img 
                              src={images[0]} 
                              alt="Foto original"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(0)}
                              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Cutout */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Sem fundo</p>
                          <div className="relative aspect-square rounded-lg overflow-hidden border bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E')]">
                            {personCutoutUrl ? (
                              <img 
                                src={personCutoutUrl} 
                                alt="Foto sem fundo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleRemoveBackground}
                                  disabled={isRemovingBg}
                                >
                                  <Scissors className="w-4 h-4 mr-1" />
                                  Remover
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {bgRemovalError && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        {bgRemovalError}
                      </div>
                    )}
                  </div>

                  {/* Banner Text */}
                  <div>
                    <Label htmlFor="bannerText" className="font-medium">
                      Briefing / Texto Principal
                    </Label>
                    <Input
                      id="bannerText"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="Ex: Lançamento de verão com 50% de desconto"
                      className={`mt-2 ${inputHeight}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Descreva o objetivo do banner
                    </p>
                  </div>

                  {/* CTA Text */}
                  <div>
                    <Label htmlFor="ctaText" className="font-medium">
                      CTA (opcional)
                    </Label>
                    <Input
                      id="ctaText"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Ex: Compre agora"
                      className={`mt-2 ${inputHeight}`}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full ${buttonMinHeight}`} 
                    variant="gradient" 
                    disabled={loading || images.length === 0 || limitReached}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Palette className="w-5 h-5 mr-2" />
                        Gerar Banner
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resultado</span>
                  {decision && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyJson}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? 'Copiado!' : 'Copiar JSON'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                    <div className="text-center text-muted-foreground text-sm mt-4">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      {preserveIdentity 
                        ? "Gerando cenário de fundo..." 
                        : "Gerando criativo completo..."}
                    </div>
                  </div>
                ) : decision && (backgroundImageUrl || generatedImageUrl) ? (
                  <div className="space-y-6">
                    {/* Banner Preview */}
                    <div className="flex justify-center">
                      <div 
                        ref={bannerRef} 
                        className="overflow-hidden rounded-lg border shadow-lg"
                      >
                        <BannerComposite
                          format={selectedFormat}
                          backgroundImageUrl={preserveIdentity ? backgroundImageUrl! : (generatedImageUrl || backgroundImageUrl!)}
                          personPhotoUrl={preserveIdentity ? images[0] : undefined}
                          personCutoutUrl={preserveIdentity ? personCutoutUrl ?? undefined : undefined}
                          personPosition={decision.template.replace('pessoa_', '') as 'esquerda' | 'centro' | 'direita'}
                          headline={decision.headline}
                          subheadline={decision.subheadline}
                          cta={decision.cta}
                          colors={{ ...DEFAULT_COLORS, brandPrimary: brandColors[0] }}
                          brandColors={brandColors}
                          highlightKeyword={brandColors.length > 0}
                          style={decision.style}
                          previewScale={getPreviewScale()}
                        />
                      </div>
                    </div>

                    {/* Export Button */}
                    <Button
                      type="button"
                      onClick={handleExportBanner}
                      className="w-full"
                      disabled={exporting}
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar {BANNER_FORMATS[selectedFormat].width}x{BANNER_FORMATS[selectedFormat].height}px
                        </>
                      )}
                    </Button>

                    {/* Decision Details */}
                    <div className="space-y-4">
                      {/* Template */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Template</p>
                          <p className="font-medium">{getTemplateLabel(decision.template)}</p>
                        </div>
                      </div>

                      {/* Style */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Paintbrush className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Estilo</p>
                          <Badge variant="secondary">{getStyleLabel(decision.style)}</Badge>
                        </div>
                      </div>

                      {/* Headline */}
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Type className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Headline</p>
                          <p className="font-bold text-lg">{decision.headline}</p>
                          {decision.subheadline && (
                            <p className="text-sm text-muted-foreground mt-1">{decision.subheadline}</p>
                          )}
                          {decision.cta && (
                            <Badge className="mt-2">{decision.cta}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Raw JSON */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">JSON (debug)</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowJsonDebug((prev) => !prev)}
                        >
                          {showJsonDebug ? "Ocultar JSON" : "Mostrar JSON"}
                        </Button>
                      </div>
                      {showJsonDebug && (
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(decision, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Palette className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Configure o formato, envie sua foto</p>
                    <p>e gere seu banner profissional.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
