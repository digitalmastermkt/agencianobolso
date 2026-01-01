import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TrialStatusCard } from "@/components/TrialStatusCard";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  AlertCircle,
  Sparkles,
  Hexagon,
  Zap,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  User,
  Settings,
  FolderOpen,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { useAuth } from "@/hooks/useAuth";
import { useBackgroundRemoval, loadImageFromUrl, blobToDataUrl } from "@/hooks/useBackgroundRemoval";
import { BannerComposite, BANNER_FORMATS, type BannerFormat } from "@/components/banner/BannerComposite";
import { BrandProfileSelector } from "@/components/banner/BrandProfileSelector";
import { InstagramAnalyzer } from "@/components/banner/InstagramAnalyzer";
import { BrandPersonPhotosManager, PersonPhoto } from "@/components/banner/BrandPersonPhotosManager";

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
  personCutoutUrl?: string;
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
  decorationStyle?: 'geometric' | 'neon' | 'lines' | 'corners';
  style: 'clean' | 'minimal' | 'premium';
  createdAt: string;
}

interface ProjectItem {
  id: string;
  name: string;
  banners: ProjectBanner[];
}

interface BrandProfile {
  id: string;
  name: string;
  logo_url?: string | null;
  colors?: string[] | null;
  visual_style?: string | null;
  mood?: string | null;
  overall_description?: string | null;
  person_photos?: PersonPhoto[] | null;
}

// PersonPhoto imported from BrandPersonPhotosManager

interface VisualIdentity {
  colors: string[];
  typography?: {
    primaryFont?: string;
    secondaryFont?: string;
    style?: string;
  };
  visualStyle?: string;
  mood?: string;
  recurringElements?: string[];
  overallDescription?: string;
}

const PROJECTS_STORAGE_KEY = "art-director-projects-v2";
const MAX_BANNERS_BETA = 10;

const DEFAULT_COLORS = {
  headline: '#ffffff',
  subheadline: '#f1f5f9',
  ctaBackground: '#ffffff',
  ctaText: '#0f172a',
};

const STEPS = [
  { id: 1, title: 'Perfil de Marca', icon: User, description: 'Selecione ou crie seu perfil' },
  { id: 2, title: 'Configurar', icon: Settings, description: 'Logo e fotos' },
  { id: 3, title: 'Projeto', icon: FolderOpen, description: 'Organize seus banners' },
  { id: 4, title: 'Gerar', icon: Wand2, description: 'Crie o banner' },
  { id: 5, title: 'Resultado', icon: CheckCircle2, description: 'Exporte e salve' },
];

export default function AgenteDiretorArte() {
  const { toast } = useToast();
  const { isMobile, buttonMinHeight, inputHeight } = useMobileOptimization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const bannerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  
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
  const [personCutoutUrl, setPersonCutoutUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  
  // Format & mode
  const [selectedFormat, setSelectedFormat] = useState<BannerFormat>('quadrado');
  const [preserveIdentity, setPreserveIdentity] = useState(true);
  const [decorationStyle, setDecorationStyle] = useState<'geometric' | 'neon' | 'lines' | 'corners'>('geometric');
  
  // Brand profile
  const [selectedBrandProfileId, setSelectedBrandProfileId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [personPhotos, setPersonPhotos] = useState<PersonPhoto[]>([]);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<PersonPhoto | null>(null);
  
  // Visual identity
  const [extractedIdentity, setExtractedIdentity] = useState<VisualIdentity | null>(null);
  
  // Generated content
  const [decision, setDecision] = useState<ArtDirectorDecision | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  // UI state
  const [copied, setCopied] = useState(false);
  const [showJsonDebug, setShowJsonDebug] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const currentProjectRef = useRef<string | null>(null);
  
  // Delete confirmation dialog
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  
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

  // Load brand profile when selected
  useEffect(() => {
    const loadBrandProfile = async () => {
      if (!selectedBrandProfileId || !user?.id) {
        setBrandProfile(null);
        setBrandColors([]);
        setPersonPhotos([]);
        return;
      }
      
      const { data: profileData, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("id", selectedBrandProfileId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && profileData) {
        const profile = profileData as unknown as BrandProfile;
        setBrandProfile(profile);
        if (Array.isArray(profile.colors)) {
          setBrandColors(profile.colors);
        }
        if (Array.isArray(profile.person_photos)) {
          setPersonPhotos(profile.person_photos);
        }
      }
    };
    
    loadBrandProfile();
  }, [selectedBrandProfileId, user?.id]);

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
    setPersonCutoutUrl(null);
    setSelectedGalleryPhoto(null);

    if (preserveIdentity) {
      try {
        toast({
          title: "Processando imagem...",
          description: "Removendo fundo automaticamente.",
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
    setSelectedGalleryPhoto(null);
  };

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBrandProfileId) return;

    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const logoData = reader.result as string;
        
        const { error } = await supabase
          .from('brand_profiles')
          .update({
            logo_url: logoData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBrandProfileId);

        if (error) throw error;

        setBrandProfile(prev => prev ? { ...prev, logo_url: logoData } : null);
        toast({
          title: "Logo atualizado! 🎨",
          description: "O logo foi salvo no perfil de marca.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro ao enviar logo",
        description: error.message || "Falha ao processar o logo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!selectedBrandProfileId) return;

    try {
      const { error } = await supabase
        .from('brand_profiles')
        .update({
          logo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBrandProfileId);

      if (error) throw error;

      setBrandProfile(prev => prev ? { ...prev, logo_url: null } : null);
      toast({
        title: "Logo removido",
        description: "O logo foi removido do perfil de marca.",
      });
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: "Erro ao remover logo",
        description: error.message || "Falha ao remover o logo",
        variant: "destructive",
      });
    }
  };

  const handleSelectGalleryPhoto = async (photo: PersonPhoto) => {
    setSelectedGalleryPhoto(photo);
    setImages([photo.photo_url]);
    setPersonCutoutUrl(null);
    
    if (preserveIdentity) {
      try {
        toast({
          title: "Processando...",
          description: "Removendo fundo da foto selecionada.",
        });
        
        const img = await loadImageFromUrl(photo.photo_url);
        const cutoutBlob = await removeBackground(img);
        const cutoutDataUrl = await blobToDataUrl(cutoutBlob);
        setPersonCutoutUrl(cutoutDataUrl);
        
        toast({
          title: "Fundo removido!",
          description: "Foto da galeria processada.",
        });
      } catch (err) {
        console.error("Error removing background:", err);
      }
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

    const descriptionText = description.trim();
    if (!descriptionText) {
      toast({
        title: "Descrição necessária",
        description: "Descreva o criativo que você quer gerar.",
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
          description: descriptionText, 
          brandProfile: brandProfile || {}, 
          format: selectedFormat, 
          personImageUrl,
          preserve_identity: preserveIdentity,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newDecision: ArtDirectorDecision = {
        template: data.template,
        headline: data.headline,
        subheadline: data.subheadline,
        cta: data.cta,
        style: data.style,
        scene_prompt: data.scene_prompt,
      };
      
      setDecision(newDecision);
      
      if (preserveIdentity && data.backgroundImageUrl) {
        setBackgroundImageUrl(data.backgroundImageUrl);
      } else if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      }

      // Auto advance to result step
      setCurrentStep(5);

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

  const handleDeleteProject = (project: ProjectItem) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    
    setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
    
    if (currentProjectId === projectToDelete.id) {
      const remaining = projects.filter(p => p.id !== projectToDelete.id);
      if (remaining.length > 0) {
        setCurrentProjectId(remaining[0].id);
        currentProjectRef.current = remaining[0].id;
      } else {
        setCurrentProjectId(null);
        currentProjectRef.current = null;
      }
    }
    
    toast({
      title: "Projeto excluído",
      description: `O projeto "${projectToDelete.name}" foi excluído.`,
    });
    
    setProjectToDelete(null);
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

  const handleExportBanner = async () => {
    if (!bannerRef.current) return;
    
    setExporting(true);
    
    try {
      const { width, height } = BANNER_FORMATS[selectedFormat];
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar o canvas');
      }

      const bgUrl = preserveIdentity ? backgroundImageUrl : (generatedImageUrl || backgroundImageUrl);
      if (!bgUrl) {
        throw new Error('Nenhuma imagem de fundo disponível');
      }

      const bgImage = await loadImage(bgUrl);
      ctx.drawImage(bgImage, 0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.5);
      gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height * 0.5);

      if (preserveIdentity && images[0]) {
        const personImage = await loadImage(personCutoutUrl || images[0]);
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

      if (decision) {
        const safeMargin = width * 0.05;
        const fontSize = width * 0.06;
        
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

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
        
        const headlineLines = wrapText(ctx, decision.headline, maxTextWidth);
        let y = safeMargin;
        headlineLines.forEach(line => {
          ctx.fillText(line, textX, y);
          y += fontSize * 1.2;
        });

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
          
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = DEFAULT_COLORS.ctaBackground;
          ctx.beginPath();
          ctx.roundRect(ctaX, y, ctaWidth, ctaHeight, width * 0.02);
          ctx.fill();
          
          ctx.fillStyle = DEFAULT_COLORS.ctaText;
          ctx.textAlign = 'center';
          ctx.fillText(decision.cta.toUpperCase(), ctaX + ctaWidth / 2, y + (ctaHeight - fontSize * 0.4) / 2);
        }
      }

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
    
    if (limitReached) return;
    
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
      decorationStyle: decorationStyle,
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

  const getPreviewScale = () => {
    const containerWidth = 400;
    const { width } = BANNER_FORMATS[selectedFormat];
    return Math.min(containerWidth / width, 0.4);
  };

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

  const canAdvanceStep = () => {
    switch (currentStep) {
      case 1:
        return !!selectedBrandProfileId;
      case 2:
        return true; // Optional step
      case 3:
        return !!currentProjectId;
      case 4:
        return images.length > 0 && description.trim().length > 0;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5 && canAdvanceStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleIdentityExtracted = (identity: VisualIdentity) => {
    setExtractedIdentity(identity);
    if (identity.colors) {
      setBrandColors(identity.colors);
    }
  };

  const handlePersonPhotosChange = (photos: PersonPhoto[]) => {
    setPersonPhotos(photos);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <BrandProfileSelector
              selectedProfileId={selectedBrandProfileId}
              onSelectProfile={(profile) => setSelectedBrandProfileId(profile?.id || '')}
            />
            
            {selectedBrandProfileId && (
              <InstagramAnalyzer
                onIdentityExtracted={handleIdentityExtracted}
                onIdentityChange={handleIdentityExtracted}
                selectedBrandProfileId={selectedBrandProfileId}
              />
            )}
            
            {brandProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo da Identidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {brandColors.length > 0 && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Cores da marca</Label>
                      <div className="flex gap-2 mt-1">
                        {brandColors.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {brandProfile.visual_style && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Estilo Visual</Label>
                      <p className="text-sm font-medium">{brandProfile.visual_style}</p>
                    </div>
                  )}
                  {brandProfile.mood && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Mood</Label>
                      <Badge variant="secondary">{brandProfile.mood}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {selectedBrandProfileId ? (
              <>
                {/* Logo upload section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Logo da Marca
                    </CardTitle>
                    <CardDescription>
                      Faça upload do logo para usar nos seus banners
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {brandProfile?.logo_url ? (
                      <div className="flex items-center gap-4">
                        <img 
                          src={brandProfile.logo_url} 
                          alt="Logo" 
                          className="w-20 h-20 object-contain rounded-lg border bg-white p-2"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Logo carregado</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Trocar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveLogo}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          <span className="text-primary font-medium">Clique para enviar</span> o logo da marca
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG ou SVG (fundo transparente recomendado)
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {isUploadingLogo && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando logo...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Person photos gallery */}
                <BrandPersonPhotosManager
                  brandProfileId={selectedBrandProfileId}
                  photos={personPhotos}
                  onPhotosChange={handlePersonPhotosChange}
                  onSelectPhoto={(photo) => handleSelectGalleryPhoto(photo)}
                  maxPhotos={10}
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-muted-foreground">
                    Selecione um perfil de marca no passo anterior para configurar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
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
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          project.id === currentProjectId 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => handleSelectProject(project.id)}
                        >
                          <span className="font-medium">{project.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({project.banners.length} banner{project.banners.length !== 1 ? 's' : ''})
                          </span>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold">Crie seu primeiro projeto</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Projetos ajudam a organizar seus banners por cliente ou campanha.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                            personCutoutUrl={banner.personCutoutUrl}
                            personPosition={banner.personPosition}
                            headline={banner.headline}
                            subheadline={banner.subheadline}
                            cta={banner.cta}
                            colors={banner.colors}
                            brandColors={banner.brandColors}
                            showDecorations={(banner.brandColors?.length ?? 0) > 0}
                            decorationStyle={banner.decorationStyle}
                            highlightKeyword={(banner.brandColors?.length ?? 0) > 0}
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
        );

      case 4:
        return (
          <Card>
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

                {/* Decoration Style Selector */}
                <div>
                  <Label className="font-medium mb-3 block">Estilo de Decoração</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant={decorationStyle === 'geometric' ? "default" : "outline"}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                      onClick={() => setDecorationStyle('geometric')}
                    >
                      <Hexagon className="w-4 h-4" />
                      <span className="text-[10px]">Geométrico</span>
                    </Button>
                    <Button
                      type="button"
                      variant={decorationStyle === 'neon' ? "default" : "outline"}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                      onClick={() => setDecorationStyle('neon')}
                    >
                      <Zap className="w-4 h-4" />
                      <span className="text-[10px]">Neon</span>
                    </Button>
                    <Button
                      type="button"
                      variant={decorationStyle === 'lines' ? "default" : "outline"}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                      onClick={() => setDecorationStyle('lines')}
                    >
                      <Minus className="w-4 h-4" />
                      <span className="text-[10px]">Linhas</span>
                    </Button>
                    <Button
                      type="button"
                      variant={decorationStyle === 'corners' ? "default" : "outline"}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                      onClick={() => setDecorationStyle('corners')}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px]">Cantos</span>
                    </Button>
                  </div>
                </div>

                {/* Gallery Photos */}
                {personPhotos.length > 0 && (
                  <div>
                    <Label className="font-medium mb-3 block">Fotos da Galeria</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {personPhotos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedGalleryPhoto?.id === photo.id 
                              ? 'border-primary ring-2 ring-primary/30' 
                              : 'border-transparent hover:border-muted-foreground/30'
                          }`}
                          onClick={() => handleSelectGalleryPhoto(photo)}
                        >
                          <img 
                            src={photo.photo_url} 
                            alt={photo.name || 'Foto'} 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Photo */}
                <div>
                  <Label className="font-medium mb-2 block">
                    {preserveIdentity ? "Sua Foto (será sobreposta)" : "Referência Visual"}
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
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
                    {isRemovingBg ? 'Processando...' : 'Upload Nova Foto'}
                  </Button>

                  {isRemovingBg && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Scissors className="w-4 h-4 animate-pulse" />
                        <span>Removendo fundo... {bgRemovalProgress}%</span>
                      </div>
                      <Progress value={bgRemovalProgress} className="h-2" />
                    </div>
                  )}

                  {images.length > 0 && (
                    <div className="mt-4">
                      <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E')]">
                          <img 
                            src={personCutoutUrl || images[0]} 
                            alt="Foto selecionada"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(0)}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {isRemovingBg && (
                          <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        )}
                        {personCutoutUrl && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              <Check className="w-2.5 h-2.5 mr-0.5" />
                              Sem fundo
                            </Badge>
                          </div>
                        )}
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

                {/* Description - Single field */}
                <div>
                  <Label htmlFor="description" className="font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o criativo que você quer gerar... Ex: Lançamento de verão com 50% de desconto, saiba mais no site"
                    className="mt-2 min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      A IA identificará título, subtítulo e CTA automaticamente
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {description.length}/500
                    </span>
                  </div>
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
        );

      case 5:
        return (
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
                        showDecorations={brandColors.length > 0}
                        decorationStyle={decorationStyle}
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
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <LayoutTemplate className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Template</p>
                        <p className="font-medium">{getTemplateLabel(decision.template)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Paintbrush className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Estilo</p>
                        <Badge variant="secondary">{getStyleLabel(decision.style)}</Badge>
                      </div>
                    </div>

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

                  {/* Create New Banner */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setCurrentStep(4)}
                  >
                    Criar Novo Banner
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhum banner gerado ainda.</p>
                  <p className="text-sm mt-2">Vá para o passo "Gerar" para criar seu banner.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCurrentStep(4)}
                  >
                    Ir para Geração
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                <Palette className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Diretor de Arte</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gera criativos profissionais com IA, preservando sua identidade visual.
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

          <div className="mb-6 max-w-md mx-auto">
            <TrialStatusCard />
            <SubscriptionStatusCard />
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex flex-col items-center gap-1 transition-all ${
                        isActive 
                          ? 'text-primary' 
                          : isCompleted 
                            ? 'text-primary/70' 
                            : 'text-muted-foreground'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${isActive ? '' : 'opacity-70'}`}>
                        {step.title}
                      </span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            {currentStep < 5 && (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!canAdvanceStep()}
              >
                Avançar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto "{projectToDelete?.name}" e todos os seus {projectToDelete?.banners.length || 0} banner(s) serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
