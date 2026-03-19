import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Trash2,
  ChevronRight,
  ChevronLeft,
  User,
  Settings,
  FolderOpen,
  Wand2,
  CheckCircle2,
  ImagePlus,
  Package,
  FileText,
  Star,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { useBackgroundRemoval, loadImageFromUrl, blobToDataUrl } from "@/hooks/useBackgroundRemoval";
import { BannerComposite, BANNER_FORMATS, type BannerFormat } from "@/components/banner/BannerComposite";
import { BannerWithTextOverlay } from "@/components/banner/BannerWithTextOverlay";
import { BrandProfileSelector } from "@/components/banner/BrandProfileSelector";
import { InstagramAnalyzer } from "@/components/banner/InstagramAnalyzer";
import { BrandPersonPhotosManager, PersonPhoto } from "@/components/banner/BrandPersonPhotosManager";
import { GenerationsGallery } from "@/components/banner/GenerationsGallery";
import { ArtFavoriteButton } from "@/components/banner/ArtFavoriteButton";
import { ArtFavoritesGallery } from "@/components/banner/ArtFavoritesGallery";
import { BannerTextPreview } from "@/components/banner/BannerTextPreview";
import { CreditsBalanceDisplay } from "@/components/CreditsBalanceDisplay";
import { CREDIT_COSTS } from "@/lib/credits-config";
import { toPng } from 'html-to-image';

interface ArtDirectorDecision {
  template: "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda";
  headline: string;
  subheadline?: string;
  cta?: string;
  style: "clean" | "minimal" | "premium";
  scene_prompt?: string;
  pose_suggestion?: string;
}

// Generated image variation from AI
interface GeneratedVariation {
  id: string;
  imageUrl: string;
  isRegenerating?: boolean;
  logoUrl?: string | null;
  logoPosition?: string;
  // Text overlay data (when renderTextOnImage is false)
  textOverlay?: {
    headline: string;
    subheadline?: string;
    cta?: string;
    textColors: {
      headline: string;
      subheadline: string;
      cta_bg: string;
      cta_text: string;
    };
  };
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

// Visual styles are now auto-detected from context by the AI

export default function AgenteDiretorArte() {
  const { toast } = useToast();
  const { isMobile, buttonMinHeight, inputHeight } = useMobileOptimization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { subscribed, isMaster } = useSubscription();
  const { availableCredits, hasEnoughCredits, refresh: refreshCredits, isMaster: isMasterCredits } = useCreditsBalance();
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
  
  // New unified text fields
  const [artText, setArtText] = useState(""); // What the user wants on the art
  const [designOrientation, setDesignOrientation] = useState(""); // Visual instructions
  
  // Legacy fields kept for backward compat with results display
  const [contextDescription, setContextDescription] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [cta, setCta] = useState("");
  
  // Format & mode
  const [selectedFormat, setSelectedFormat] = useState<BannerFormat>('quadrado');
  const [creativeStyle, setCreativeStyle] = useState<'brand' | 'generic'>('brand');
  const [generationMode, setGenerationMode] = useState<'person' | 'product' | 'text-only'>('person');
  const [variationsCount, setVariationsCount] = useState<1 | 2>(2);
  
  // Reference images (up to 4) with type classification
  type ReferenceImageType = 'person' | 'product' | 'scene' | 'reference';
  interface ReferenceImage {
    url: string;
    type: ReferenceImageType;
  }
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const referenceInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const REFERENCE_TYPE_OPTIONS: { value: ReferenceImageType; label: string; icon: React.ReactNode }[] = [
    { value: 'person', label: 'Pessoa', icon: <User className="w-3 h-3" /> },
    { value: 'product', label: 'Produto', icon: <Package className="w-3 h-3" /> },
    { value: 'scene', label: 'Cenário', icon: <ImageIcon className="w-3 h-3" /> },
    { value: 'reference', label: 'Referência', icon: <Star className="w-3 h-3" /> },
  ];
  
  // Migrate old state values (e.g., 4) to max allowed (2)
  useEffect(() => {
    if ((variationsCount as number) > 2) {
      setVariationsCount(2);
    }
  }, []);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [productImage, setProductImage] = useState<string | null>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  
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
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  
  // UI state
  const [copied, setCopied] = useState(false);
  const [showJsonDebug, setShowJsonDebug] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Generation progress state
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState<string>("");
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
    () => projects.reduce((sum, project) => sum + (project.banners?.length || 0), 0),
    [projects]
  );
  
  // Beta limit only applies to non-subscribers (free/trial users)
  // Subscribers (Essencial, Premium, Elite) and master users have unlimited access
  const limitReached = !subscribed && !isMaster && totalBanners >= MAX_BANNERS_BETA;

  // Load projects from Supabase (with localStorage fallback)
  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) {
        // Fallback to localStorage for anonymous users
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              // Validar e garantir que cada projeto tenha a propriedade banners
              const validProjects: ProjectItem[] = parsed.map((p: any) => ({
                id: p.id || crypto.randomUUID(),
                name: p.name || 'Projeto sem nome',
                banners: Array.isArray(p.banners) ? p.banners : [],
              }));
              setProjects(validProjects);
              if (validProjects.length > 0) {
                setCurrentProjectId(validProjects[0].id);
                currentProjectRef.current = validProjects[0].id;
              }
            }
          } catch {
            setProjects([]);
          }
        }
        return;
      }

      // Load from Supabase for authenticated users - include generation count
      const { data, error } = await supabase
        .from('brand_projects')
        .select('*, project_generations(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const loadedProjects: ProjectItem[] = data.map((p: any) => {
          // Extract count from nested aggregation
          const generationCount = p.project_generations?.[0]?.count || 0;
          return {
            id: p.id,
            name: p.name,
            banners: Array(generationCount).fill({}), // Placeholder to show correct count
          };
        });
        setProjects(loadedProjects);
        if (loadedProjects.length > 0) {
          setCurrentProjectId(loadedProjects[0].id);
          currentProjectRef.current = loadedProjects[0].id;
        }
      }
    };

    loadProjects();
  }, [user?.id, storageKey]);

  // Save project to Supabase when created
  const saveProjectToSupabase = async (project: ProjectItem) => {
    if (!user?.id) return;

    await supabase.from('brand_projects').insert({
      id: project.id,
      user_id: user.id,
      brand_profile_id: selectedBrandProfileId || null,
      name: project.name,
    });
  };

  // Delete project from Supabase
  const deleteProjectFromSupabase = async (projectId: string) => {
    if (!user?.id) return;

    // Delete generations first (cascade)
    await supabase
      .from('project_generations')
      .delete()
      .eq('project_id', projectId);

    await supabase
      .from('brand_projects')
      .delete()
      .eq('id', projectId);
  };

  // Save generation to Supabase
  const saveGenerationToSupabase = async (projectId: string, imageUrls: string[]) => {
    if (!user?.id) return;

    await supabase.from('project_generations').insert({
      project_id: projectId,
      user_id: user.id,
      images: imageUrls.map(url => ({ url, style: selectedFormat })),
      banner_text: headline.trim(),
      cta: cta.trim() || null,
      formats: [selectedFormat],
    });
  };

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

    if (generationMode === 'person') {
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

  // Simplified: No background removal needed - AI will recreate the person
  const handleSelectGalleryPhoto = async (photo: PersonPhoto) => {
    setSelectedGalleryPhoto(photo);
    setImages([photo.photo_url]);
    setPersonCutoutUrl(null); // No longer used
    
    toast({
      title: "Foto selecionada! 📸",
      description: "A IA vai recriar sua pessoa no cenário.",
    });
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

    const artTextTrimmed = artText.trim();
    
    if (!artTextTrimmed) {
      toast({
        title: "Texto da arte obrigatório",
        description: "Descreva o que você quer na arte.",
        variant: "destructive",
      });
      return;
    }

    // Determine generation mode from reference images
    // If no references, it's text-only; otherwise AI decides
    const hasReferences = referenceImages.length > 0 || images.length > 0 || !!productImage;
    const effectiveMode = hasReferences ? 'person' : 'text-only';

    setLoading(true);
    setDecision(null);
    setBackgroundImageUrl(null);
    setGeneratedImageUrl(null);
    setGeneratedVariations([]);
    setSelectedVariationId(null);
    
    // Start progress simulation
    setGenerationProgress(0);
    setGenerationStep("Otimizando foto profissional...");
    
    const progressSteps = [
      { progress: 20, step: "Analisando contexto...", delay: 2000 },
      { progress: 40, step: "Definindo direção artística...", delay: 3000 },
      { progress: 60, step: `Gerando variação 1 de ${variationsCount}...`, delay: 8000 },
      { progress: 80, step: variationsCount >= 2 ? `Gerando variação 2 de ${variationsCount}...` : "Finalizando...", delay: 10000 },
      { progress: 95, step: "Salvando...", delay: 3000 },
    ];
    
    let stepIndex = 0;
    progressIntervalRef.current = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setGenerationProgress(progressSteps[stepIndex].progress);
        setGenerationStep(progressSteps[stepIndex].step);
        stepIndex++;
      }
    }, 3000);

    try {
      // Determine which image to send based on mode
      const imageToSend = generationMode === 'product' ? productImage : images[0];

      // Collect all reference images (from referenceImages + legacy person/product uploads)
      // Collect all reference images with types
      const allReferenceImages: ReferenceImage[] = [...referenceImages];
      if (images[0] && !allReferenceImages.find(r => r.url === images[0])) {
        allReferenceImages.unshift({ url: images[0], type: 'person' });
      }
      if (productImage && !allReferenceImages.find(r => r.url === productImage)) {
        allReferenceImages.push({ url: productImage, type: 'product' });
      }

      // Use new V2 edge function with typed references
      const { data, error } = await supabase.functions.invoke("generate-creative-v2", {
        body: { 
          // New fields
          artText: artTextTrimmed,
          designOrientation: designOrientation.trim() || undefined,
          creativeStyle, // 'brand' | 'generic'
          referenceImages: allReferenceImages.slice(0, 4), // Max 4 with types
          // Legacy fields for backward compat
          context: artTextTrimmed,
          headline: artTextTrimmed.substring(0, 50),
          brandProfile: brandProfile || {}, 
          format: selectedFormat, 
          personImageBase64: allReferenceImages[0] || undefined,
          generationMode: effectiveMode,
          variationsCount,
          renderTextOnImage: true,
          logoUrl: includeLogo && brandProfile?.logo_url ? brandProfile.logo_url : null,
          brandIdentity: {
            colors: brandColors.length > 0 ? brandColors : brandProfile?.colors || [],
            typography: extractedIdentity?.typography,
            visualStyle: extractedIdentity?.visualStyle || brandProfile?.visual_style,
            mood: extractedIdentity?.mood || brandProfile?.mood,
            recurringElements: extractedIdentity?.recurringElements,
          },
        },
      });

      if (error) throw error;
      if (data?.insufficient_credits) {
        toast({
          title: "Créditos insuficientes",
          description: `Você precisa de ${data.credits_required} crédito(s) mas tem ${data.credits_available}. Adquira mais créditos.`,
          variant: "destructive",
        });
        refreshCredits();
        return;
      }
      if (data?.error) throw new Error(data.error);

      const newDecision: ArtDirectorDecision = {
        template: data.template,
        headline: data.headline,
        subheadline: data.subheadline,
        cta: data.cta,
        style: data.style,
        scene_prompt: data.scene_prompt,
        pose_suggestion: data.pose_suggestion,
      };
      
      setDecision(newDecision);
      
      // Handle multiple variations from V2 API
      // Include logo info and text overlay data
      const returnedLogoUrl = includeLogo && brandProfile?.logo_url ? brandProfile.logo_url : null;
      
      // Text overlay data (used when renderTextOnImage is false)
      const textOverlayData = !data.renderTextOnImage ? {
        headline: data.headline || artTextTrimmed,
        subheadline: data.subheadline || undefined,
        cta: cta.trim() || undefined,
        textColors: data.text_colors || {
          headline: "#FFFFFF",
          subheadline: "#F1F5F9",
          cta_bg: data.brandApplied?.primaryColor || "#3B82F6",
          cta_text: "#FFFFFF"
        },
      } : undefined;
      
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        const variations: GeneratedVariation[] = data.images.map((imageUrl: string, index: number) => ({
          id: crypto.randomUUID(),
          imageUrl,
          logoUrl: returnedLogoUrl,
          logoPosition: data.logoPosition || "bottom-right",
          textOverlay: textOverlayData,
        }));
        setGeneratedVariations(variations);
        setSelectedVariationId(variations[0].id);
        setGeneratedImageUrl(variations[0].imageUrl);

        // Save generation to Supabase
        if (currentProjectId) {
          await saveGenerationToSupabase(currentProjectId, data.images);
        }
      } else if (data.imageUrl) {
        // Fallback for single image
        const variation: GeneratedVariation = {
          id: crypto.randomUUID(),
          imageUrl: data.imageUrl,
          logoUrl: returnedLogoUrl,
          logoPosition: data.logoPosition || "bottom-right",
          textOverlay: textOverlayData,
        };
        setGeneratedVariations([variation]);
        setSelectedVariationId(variation.id);
        setGeneratedImageUrl(data.imageUrl);

        // Save generation to Supabase
        if (currentProjectId) {
          await saveGenerationToSupabase(currentProjectId, [data.imageUrl]);
        }
      }

      // Auto advance to result step
      setCurrentStep(5);

      const partialMsg = data.partial 
        ? ` (${data.images?.length || 1} de ${data.requestedVariations || variationsCount} variações geradas)`
        : "";

      toast({
        title: `Criativo gerado! ✨${partialMsg}`,
        description: data.partial 
          ? "Algumas variações demoraram demais. Você pode regenerar as faltantes."
          : data.usedFallback 
            ? "Imagem gerada com sucesso (modo alternativo)." 
            : "Pessoa recriada no cenário com preservação de identidade!",
      });
    } catch (error: unknown) {
      console.error("Erro na geração:", error);
      const errorMsg = error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação.";
      const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('546') || errorMsg.includes('non-2xx');
      toast({
        title: isTimeout ? "Tempo limite excedido" : "Erro",
        description: isTimeout 
          ? "A geração demorou muito. Tente novamente com 1 variação."
          : errorMsg,
        variant: "destructive",
      });
    } finally {
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setGenerationProgress(100);
      setGenerationStep("Concluído!");
      setLoading(false);
    }
  };

  // Regenerate a single variation
  const handleRegenerateVariation = async (variationId: string) => {
    if (!decision || !images[0]) return;

    setGeneratedVariations(prev => 
      prev.map(v => v.id === variationId ? { ...v, isRegenerating: true } : v)
    );

    try {
      const { data, error } = await supabase.functions.invoke("generate-creative-v2", {
        body: { 
          context: contextDescription.trim(),
          headline: headline.trim(),
          subheadline: subheadline.trim() || undefined,
          cta: cta.trim() || undefined,
          brandProfile: brandProfile || {}, 
          format: selectedFormat, 
          personImageBase64: images[0],
          variationsCount: 1,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.images && data.images.length > 0) {
        setGeneratedVariations(prev => 
          prev.map(v => v.id === variationId 
            ? { ...v, imageUrl: data.images[0], isRegenerating: false } 
            : v
          )
        );
        
        // Update selected if this was the selected one
        if (selectedVariationId === variationId) {
          setGeneratedImageUrl(data.images[0]);
        }

        toast({
          title: "Variação regenerada! ✨",
          description: "Nova versão gerada com sucesso.",
        });
      }
    } catch (error: unknown) {
      console.error("Erro ao regenerar:", error);
      setGeneratedVariations(prev => 
        prev.map(v => v.id === variationId ? { ...v, isRegenerating: false } : v)
      );
      toast({
        title: "Erro ao regenerar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Download selected variation - with text overlay support
  const handleDownloadVariation = async (variation: GeneratedVariation, filename?: string) => {
    const finalFilename = filename || `criativo-${selectedFormat}-${Date.now()}.png`;
    
    // If variation has textOverlay, we need to render the component and capture it
    if (variation.textOverlay) {
      try {
        // Create a temporary container for the full-resolution banner
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
        
        // Import ReactDOM to render the component
        const ReactDOM = await import('react-dom/client');
        const React = await import('react');
        const { BannerWithTextOverlay } = await import('@/components/banner/BannerWithTextOverlay');
        
        // Create the banner element at full resolution (scale = 1)
        const bannerElement = React.createElement(BannerWithTextOverlay, {
          format: selectedFormat,
          backgroundImageUrl: variation.imageUrl,
          textOverlay: variation.textOverlay,
          logoUrl: variation.logoUrl,
          logoPosition: 'bottom-right',
          brandColors: brandColors,
          previewScale: 1, // Full resolution
        });
        
        // Render to the container
        const root = ReactDOM.createRoot(container);
        root.render(bannerElement);
        
        // Wait for render and images to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the rendered banner div
        const bannerDiv = container.querySelector('.banner-with-text-overlay') as HTMLElement;
        
        if (bannerDiv) {
          // Use html-to-image to capture
          const dataUrl = await toPng(bannerDiv, {
            quality: 1,
            pixelRatio: 1,
            cacheBust: true,
          });
          
          // Download the image
          const link = document.createElement('a');
          link.download = finalFilename;
          link.href = dataUrl;
          link.click();
          
          toast({
            title: "Download concluído!",
            description: "Banner com texto exportado em alta resolução.",
          });
        } else {
          throw new Error('Could not find banner element');
        }
        
        // Cleanup
        root.unmount();
        document.body.removeChild(container);
        
      } catch (error) {
        console.error('Error exporting banner with text overlay:', error);
        // Fallback to direct image download
        const { downloadImage } = await import('@/lib/downloadImage');
        await downloadImage(variation.imageUrl, finalFilename);
        toast({
          title: "Download iniciado",
          description: "Imagem baixada (sem overlay de texto).",
        });
      }
    } else {
      // Direct download for images with text baked in
      const { downloadImage } = await import('@/lib/downloadImage');
      const success = await downloadImage(variation.imageUrl, finalFilename);
      
      if (success) {
        toast({
          title: "Download iniciado!",
          description: "Sua imagem está sendo baixada.",
        });
      } else {
        toast({
          title: "Erro no download",
          description: "Não foi possível baixar a imagem",
          variant: "destructive",
        });
      }
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

  const handleCreateProject = async () => {
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

    // Save to Supabase
    await saveProjectToSupabase(newProject);

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

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    // Delete from Supabase
    await deleteProjectFromSupabase(projectToDelete.id);
    
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

      const bgUrl = generationMode === 'person' ? backgroundImageUrl : (generatedImageUrl || backgroundImageUrl);
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

      if (generationMode === 'person' && images[0]) {
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
    
    const bgImage = generationMode === 'person' ? backgroundImageUrl : generatedImageUrl;
    if (!bgImage) return;
    
    if (limitReached) return;
    
    const targetProjectId = currentProjectRef.current ?? createDefaultProject();

    const personPosition = decision.template.replace('pessoa_', '') as 'esquerda' | 'centro' | 'direita';
    
    const newBanner: ProjectBanner = {
      id: crypto.randomUUID(),
      format: selectedFormat,
      backgroundImageUrl: bgImage,
      personPhotoUrl: generationMode === 'person' ? images[0] : undefined,
      personCutoutUrl: generationMode === 'person' ? personCutoutUrl ?? undefined : undefined,
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
        return artText.trim().length > 0;
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
                          PNG com fundo transparente recomendado para melhor resultado
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3" />
                          <span>Dica: Logos com fundo branco podem não integrar bem à arte</span>
                        </div>
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
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Projetos</CardTitle>
                    <CardDescription>
                      Crie projetos e organize os banners gerados por cliente ou campanha.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <ArtFavoritesGallery 
                      onReuse={(bannerText, ctaText, format) => {
                        setHeadline(bannerText);
                        setCta(ctaText);
                        setSelectedFormat(format as BannerFormat);
                      }}
                    />
                    {currentProjectId && (
                      <GenerationsGallery
                        projectId={currentProjectId}
                        projectName={currentProject?.name}
                        onFavorite={(imageUrl, data) => {
                          // The favorite button inside gallery handles this
                        }}
                      />
                    )}
                  </div>
                </div>
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
                            ({project.banners?.length || 0} banner{(project.banners?.length || 0) !== 1 ? 's' : ''})
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

            {/* Banner preview is now handled by GenerationsGallery component */}
            {/* The banners array is just a placeholder for counting */}
          </div>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Criar Banner
              </CardTitle>
              <CardDescription>
                Configure e gere sua arte criativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Art Text */}
                <div>
                  <Label htmlFor="artText" className="font-medium">
                    Texto da arte *
                  </Label>
                  <Textarea
                    id="artText"
                    value={artText}
                    onChange={(e) => setArtText(e.target.value)}
                    placeholder="Descreva o criativo que você quer gerar... Ex: Promoção Black Friday com 50% de desconto em todos os cursos"
                    className="mt-2 min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      A IA vai criar automaticamente o melhor headline, subtítulo e CTA
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {artText.length}/500
                    </span>
                  </div>
                </div>

                {/* Design Orientation */}
                <div>
                  <Label htmlFor="designOrientation" className="font-medium">
                    Orientação de Design e Cena <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="designOrientation"
                    value={designOrientation}
                    onChange={(e) => setDesignOrientation(e.target.value)}
                    placeholder="Ex: fundo neutro, sem efeitos especiais, pouco brilho, estilo minimalista"
                    className="mt-2 min-h-[80px] resize-none"
                    maxLength={300}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-muted-foreground">
                      {designOrientation.length}/300
                    </span>
                  </div>
                </div>

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

                {/* Creative Style Selector */}
                <div>
                  <Label className="font-medium mb-3 block">Estilo do Criativo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreativeStyle('brand')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        creativeStyle === 'brand'
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                      }`}
                    >
                      <Palette className={`w-6 h-6 ${creativeStyle === 'brand' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${creativeStyle === 'brand' ? 'text-primary' : ''}`}>
                        Marca
                      </span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        Usa identidade visual do perfil
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setCreativeStyle('generic')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        creativeStyle === 'generic'
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                      }`}
                    >
                      <Sparkles className={`w-6 h-6 ${creativeStyle === 'generic' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${creativeStyle === 'generic' ? 'text-primary' : ''}`}>
                        Genérico
                      </span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        Cria baseado no contexto
                      </span>
                    </button>
                  </div>
                </div>

                {/* Reference Photos Grid (up to 4) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium">Fotos e Referências</Label>
                    <span className="text-xs text-muted-foreground">{referenceImages.length}/4</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((slotIndex) => {
                      const img = referenceImages[slotIndex];
                      return (
                        <div key={slotIndex} className="relative">
                          {img ? (
                            <div className="space-y-1.5">
                              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/30">
                                <img 
                                  src={img.url} 
                                  alt={`Referência ${slotIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReferenceImages(prev => prev.filter((_, i) => i !== slotIndex));
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-sm"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              {/* Type selector */}
                              <div className="grid grid-cols-2 gap-0.5">
                                {REFERENCE_TYPE_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setReferenceImages(prev => prev.map((r, i) => 
                                        i === slotIndex ? { ...r, type: opt.value } : r
                                      ));
                                    }}
                                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium transition-colors ${
                                      img.type === opt.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    {opt.icon}
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                ref={(el) => { referenceInputRefs.current[slotIndex] = el; }}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    if (ev.target?.result) {
                                      setReferenceImages(prev => {
                                        const next = [...prev];
                                        next.push({ url: ev.target!.result as string, type: 'reference' });
                                        return next.slice(0, 4);
                                      });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                  e.target.value = '';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => referenceInputRefs.current[slotIndex]?.click()}
                                disabled={referenceImages.length > slotIndex}
                                className="w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-30"
                              >
                                <Plus className="w-5 h-5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">Adicionar</span>
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Adicione fotos e classifique como Pessoa, Produto, Cenário ou Referência. A IA vai combinar os elementos.
                  </p>
                </div>

                {/* Gallery Photos from Brand Profile */}
                {personPhotos.length > 0 && (
                  <div>
                    <Label className="font-medium mb-3 block">Fotos da Galeria do Perfil</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {personPhotos.map((photo) => {
                        const isSelected = referenceImages.some(r => r.url === photo.photo_url);
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            disabled={referenceImages.length >= 4 && !isSelected}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all disabled:opacity-40 ${
                              isSelected
                                ? 'border-primary ring-2 ring-primary/30' 
                                : 'border-transparent hover:border-muted-foreground/30'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setReferenceImages(prev => prev.filter(r => r.url !== photo.photo_url));
                              } else if (referenceImages.length < 4) {
                                setReferenceImages(prev => [...prev, { url: photo.photo_url, type: 'person' as ReferenceImageType }]);
                              }
                            }}
                          >
                            <img 
                              src={photo.photo_url} 
                              alt={photo.name || 'Foto'} 
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Logo Toggle */}
                {brandProfile?.logo_url && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={brandProfile.logo_url} 
                        alt="Logo da marca" 
                        className="w-8 h-8 object-contain rounded"
                      />
                      <div>
                        <Label className="font-medium">Incluir Logo</Label>
                        <p className="text-xs text-muted-foreground">
                          Logo será posicionada sutilmente
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={includeLogo} 
                      onCheckedChange={setIncludeLogo}
                    />
                  </div>
                )}

                {/* Variations Count */}
                <div>
                  <Label className="font-medium mb-3 block">Variações</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([1, 2] as const).map((count) => (
                      <Button
                        key={count}
                        type="button"
                        variant={variationsCount === count ? "default" : "outline"}
                        className="flex flex-col items-center gap-1 h-auto py-3"
                        onClick={() => setVariationsCount(count)}
                      >
                        <ImagePlus className="w-4 h-4" />
                        <span className="text-sm font-medium">{count}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {count === 1 ? 'Mais rápido' : 'Recomendado'}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full ${buttonMinHeight} ${loading ? 'h-auto py-3' : ''}`} 
                  variant="gradient" 
                  disabled={loading || !artText.trim() || limitReached}
                >
                  {loading ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">{generationStep}</span>
                      </div>
                      <div className="w-full bg-primary-foreground/20 rounded-full h-1.5">
                        <div 
                          className="bg-primary-foreground h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      <span className="text-xs opacity-80">{generationProgress}%</span>
                    </div>
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
        const selectedVariation = generatedVariations.find(v => v.id === selectedVariationId);
        
        return (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Suas Variações
                  </CardTitle>
                  {decision && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={copyJson}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {generatedVariations.length > 0 
                    ? `${generatedVariations.length} variação(ões) geradas com preservação de identidade`
                    : "Gerando suas variações..."}
                </CardDescription>
              </CardHeader>
            </Card>

            {loading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-6">
                    {/* Animated icon */}
                    <div className="relative w-20 h-20 mx-auto">
                      <Loader2 className="w-20 h-20 animate-spin text-primary/30" />
                      <Sparkles className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                    </div>
                    
                    {/* Current step */}
                    <div>
                      <p className="font-medium text-lg">{generationStep}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gerando {variationsCount} variação(ões) com preservação de identidade
                      </p>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="max-w-xs mx-auto space-y-2">
                      <Progress value={generationProgress} className="h-2" />
                      <p className="text-sm font-medium text-primary">{generationProgress}%</p>
                    </div>
                    
                    {/* Step indicators */}
                    <div className="flex justify-center gap-2 flex-wrap">
                      {[
                        { label: 'Foto', threshold: 15 },
                        { label: 'Direção', threshold: 30 },
                        { label: 'Geração', threshold: 45 },
                        { label: 'Upload', threshold: 90 },
                      ].map((step) => (
                        <Badge 
                          key={step.label}
                          variant={generationProgress >= step.threshold ? "default" : "outline"}
                          className={`transition-all duration-300 ${
                            generationProgress >= step.threshold && generationProgress < (step.threshold + 15)
                              ? 'animate-pulse ring-2 ring-primary/50'
                              : ''
                          }`}
                        >
                          {generationProgress >= step.threshold && (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          {step.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : generatedVariations.length > 0 ? (
              <>
                {/* Variations Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {generatedVariations.map((variation, index) => (
                    <Card 
                      key={variation.id}
                      className={`cursor-pointer transition-all overflow-hidden ${
                        selectedVariationId === variation.id 
                          ? 'ring-2 ring-primary shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedVariationId(variation.id);
                        setGeneratedImageUrl(variation.imageUrl);
                      }}
                    >
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {variation.isRegenerating ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        ) : variation.textOverlay ? (
                          <BannerWithTextOverlay
                            format={selectedFormat}
                            backgroundImageUrl={variation.imageUrl}
                            textOverlay={variation.textOverlay}
                            logoUrl={variation.logoUrl}
                            brandColors={brandColors}
                            previewScale={0.2}
                          />
                        ) : (
                          <>
                            <img 
                              src={variation.imageUrl} 
                              alt={`Variação ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {variation.logoUrl && (
                              <img 
                                src={variation.logoUrl} 
                                alt="Logo"
                                className="absolute bottom-3 right-3 w-12 h-12 object-contain drop-shadow-lg"
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                              />
                            )}
                          </>
                        )}
                        
                        {/* Selection indicator */}
                        {selectedVariationId === variation.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        
                        {/* Variation number */}
                        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                          #{index + 1}
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadVariation(variation, `criativo-${index + 1}-${Date.now()}.png`);
                          }}
                          disabled={variation.isRegenerating}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Baixar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Selected Variation Preview */}
                {selectedVariation && decision && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-lg">Pré-visualização</CardTitle>
                      <ArtFavoriteButton
                        imageUrl={selectedVariation.imageUrl}
                        bannerText={headline}
                        cta={cta}
                        format={selectedFormat}
                        projectId={currentProjectId || undefined}
                        showLabel
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-center">
                        <div className="overflow-hidden rounded-lg border shadow-lg max-w-md">
                          {selectedVariation.textOverlay ? (
                            <BannerWithTextOverlay
                              format={selectedFormat}
                              backgroundImageUrl={selectedVariation.imageUrl}
                              textOverlay={selectedVariation.textOverlay}
                              logoUrl={selectedVariation.logoUrl}
                              brandColors={brandColors}
                              previewScale={0.35}
                            />
                          ) : (
                            <div className="relative">
                              <img 
                                src={selectedVariation.imageUrl} 
                                alt="Preview selecionado"
                                className="w-full h-auto"
                              />
                              {selectedVariation.logoUrl && (
                                <img 
                                  src={selectedVariation.logoUrl} 
                                  alt="Logo"
                                  className="absolute bottom-4 right-4 w-16 h-16 object-contain drop-shadow-lg"
                                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Download full res */}
                      <Button
                        type="button"
                        onClick={() => handleDownloadVariation(selectedVariation)}
                        className="w-full"
                        variant="gradient"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar em Alta Resolução
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Decision Details */}
                {decision && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Direção Artística</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <LayoutTemplate className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Template</p>
                            <p className="font-medium text-sm">{getTemplateLabel(decision.template)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Paintbrush className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Estilo</p>
                            <Badge variant="secondary">{getStyleLabel(decision.style)}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Type className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Textos</p>
                          <p className="font-bold">{decision.headline}</p>
                          {decision.subheadline && (
                            <p className="text-sm text-muted-foreground mt-1">{decision.subheadline}</p>
                          )}
                          {decision.cta && (
                            <Badge className="mt-2">{decision.cta}</Badge>
                          )}
                        </div>
                      </div>

                      {decision.scene_prompt && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Cenário gerado</p>
                          <p className="text-sm">{decision.scene_prompt}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Create New */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep(4)}
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Criar Novo Criativo
                </Button>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhum criativo gerado ainda.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vá para o passo "Gerar" para criar seu criativo.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCurrentStep(4)}
                  >
                    Ir para Geração
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const selectedVariation = generatedVariations.find(v => v.id === selectedVariationId);

  return (
    <DashboardLayout>
      <div className="min-h-screen py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Diretor de Arte</h1>
                <p className="text-sm text-muted-foreground">Crie artes profissionais com IA</p>
              </div>
            </div>
            <CreditsBalanceDisplay compact />
          </div>

          {!subscribed && !isMaster && (
            <div className="mb-4 max-w-md">
              <TrialStatusCard />
              <SubscriptionStatusCard />
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Form */}
            <div className="space-y-4">
              {/* Art Reference */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Art Text */}
                  <div>
                    <Label htmlFor="artText" className="font-medium">Texto da arte *</Label>
                    <Textarea
                      id="artText"
                      value={artText}
                      onChange={(e) => setArtText(e.target.value)}
                      placeholder="Descreva o criativo que você quer gerar... Ex: Promoção Black Friday com 50% de desconto em todos os cursos"
                      className="mt-2 min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-muted-foreground">A IA vai criar automaticamente o melhor headline, subtítulo e CTA</p>
                      <span className="text-xs text-muted-foreground">{artText.length}/500</span>
                    </div>
                  </div>

                  {/* Design Orientation */}
                  <div>
                    <Label htmlFor="designOrientation" className="font-medium">
                      Orientação de Design e Cena <span className="text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Textarea
                      id="designOrientation"
                      value={designOrientation}
                      onChange={(e) => setDesignOrientation(e.target.value)}
                      placeholder="Ex: fundo neutro, sem efeitos especiais, pouco brilho, estilo minimalista"
                      className="mt-2 min-h-[70px] resize-none"
                      maxLength={300}
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-muted-foreground">{designOrientation.length}/300</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Use art as reference */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Creative Style Selector */}
                  <div>
                    <Label className="font-medium mb-3 block">Estilo do Criativo</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCreativeStyle('brand')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          creativeStyle === 'brand'
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                        }`}
                      >
                        <Palette className={`w-6 h-6 ${creativeStyle === 'brand' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${creativeStyle === 'brand' ? 'text-primary' : ''}`}>Marca</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">Usa identidade visual do perfil</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreativeStyle('generic')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          creativeStyle === 'generic'
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                        }`}
                      >
                        <Sparkles className={`w-6 h-6 ${creativeStyle === 'generic' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${creativeStyle === 'generic' ? 'text-primary' : ''}`}>Genérico</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">Cria baseado no contexto</span>
                      </button>
                    </div>
                  </div>

                  {/* Reference Photos Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-medium">Fotos e Referências</Label>
                      <span className="text-xs text-muted-foreground">{referenceImages.length}/4</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((slotIndex) => {
                        const img = referenceImages[slotIndex];
                        return (
                          <div key={slotIndex} className="relative">
                            {img ? (
                              <div className="space-y-1.5">
                                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/30">
                                  <img src={img.url} alt={`Referência ${slotIndex + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setReferenceImages(prev => prev.filter((_, i) => i !== slotIndex))}
                                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-sm"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-0.5">
                                  {REFERENCE_TYPE_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setReferenceImages(prev => prev.map((r, i) => 
                                          i === slotIndex ? { ...r, type: opt.value } : r
                                        ));
                                      }}
                                      className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium transition-colors ${
                                        img.type === opt.value
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                      }`}
                                    >
                                      {opt.icon}
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={(el) => { referenceInputRefs.current[slotIndex] = el; }}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      if (ev.target?.result) {
                                        setReferenceImages(prev => {
                                          const next = [...prev];
                                          next.push({ url: ev.target!.result as string, type: 'reference' });
                                          return next.slice(0, 4);
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = '';
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => referenceInputRefs.current[slotIndex]?.click()}
                                  disabled={referenceImages.length > slotIndex}
                                  className="w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-30"
                                >
                                  <Plus className="w-5 h-5 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">Adicionar</span>
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Adicione fotos e classifique como Pessoa, Produto, Cenário ou Referência.
                    </p>
                  </div>

                  {/* Gallery Photos from Brand Profile */}
                  {personPhotos.length > 0 && (
                    <div>
                      <Label className="font-medium mb-3 block">Fotos da Galeria do Perfil</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {personPhotos.map((photo) => {
                          const isSelected = referenceImages.some(r => r.url === photo.photo_url);
                          return (
                            <button
                              key={photo.id}
                              type="button"
                              disabled={referenceImages.length >= 4 && !isSelected}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all disabled:opacity-40 ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary/30'
                                  : 'border-transparent hover:border-muted-foreground/30'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setReferenceImages(prev => prev.filter(r => r.url !== photo.photo_url));
                                } else if (referenceImages.length < 4) {
                                  setReferenceImages(prev => [...prev, { url: photo.photo_url, type: 'person' as ReferenceImageType }]);
                                }
                              }}
                            >
                              <img src={photo.photo_url} alt={photo.name || 'Foto'} className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Format, Logo, Variations */}
              <Card>
                <CardContent className="pt-6 space-y-4">
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
                          <span className="text-[10px] text-muted-foreground">{BANNER_FORMATS[format].width}x{BANNER_FORMATS[format].height}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Toggle */}
                  {brandProfile?.logo_url && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img src={brandProfile.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
                        <div>
                          <Label className="font-medium">Incluir Logo</Label>
                          <p className="text-xs text-muted-foreground">Logo será posicionada sutilmente</p>
                        </div>
                      </div>
                      <Switch checked={includeLogo} onCheckedChange={setIncludeLogo} />
                    </div>
                  )}

                  {/* Variations Count */}
                  <div>
                    <Label className="font-medium mb-3 block">Variações</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([1, 2] as const).map((count) => (
                        <Button
                          key={count}
                          type="button"
                          variant={variationsCount === count ? "default" : "outline"}
                          className="flex flex-col items-center gap-1 h-auto py-3"
                          onClick={() => setVariationsCount(count)}
                        >
                          <ImagePlus className="w-4 h-4" />
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-[10px] text-muted-foreground">{count === 1 ? 'Mais rápido' : 'Recomendado'}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <form onSubmit={handleSubmit}>
                    <Button
                      type="submit"
                      className="w-full min-h-[48px]"
                      variant="gradient"
                      size="lg"
                      disabled={loading || !artText.trim() || limitReached}
                    >
                      {loading ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">{generationStep}</span>
                          </div>
                          <div className="w-full bg-primary-foreground/20 rounded-full h-1.5">
                            <div className="bg-primary-foreground h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${generationProgress}%` }} />
                          </div>
                          <span className="text-xs opacity-80">{generationProgress}%</span>
                        </div>
                      ) : (
                        <>
                          <Palette className="w-5 h-5 mr-2" />
                          Gerar Arte
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Results */}
            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center space-y-6">
                      <div className="relative w-20 h-20 mx-auto">
                        <Loader2 className="w-20 h-20 animate-spin text-primary/30" />
                        <Sparkles className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{generationStep}</p>
                        <p className="text-sm text-muted-foreground mt-1">Gerando {variationsCount} variação(ões)</p>
                      </div>
                      <div className="max-w-xs mx-auto space-y-2">
                        <Progress value={generationProgress} className="h-2" />
                        <p className="text-sm font-medium text-primary">{generationProgress}%</p>
                      </div>
                      <div className="flex justify-center gap-2 flex-wrap">
                        {[
                          { label: 'Foto', threshold: 15 },
                          { label: 'Direção', threshold: 30 },
                          { label: 'Geração', threshold: 45 },
                          { label: 'Upload', threshold: 90 },
                        ].map((step) => (
                          <Badge
                            key={step.label}
                            variant={generationProgress >= step.threshold ? "default" : "outline"}
                            className={`transition-all duration-300 ${generationProgress >= step.threshold && generationProgress < step.threshold + 15 ? 'animate-pulse ring-2 ring-primary/50' : ''}`}
                          >
                            {generationProgress >= step.threshold && <Check className="w-3 h-3 mr-1" />}
                            {step.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : generatedVariations.length > 0 ? (
                <>
                  {/* Variations Grid */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          Suas Variações
                        </CardTitle>
                        {decision && (
                          <Button variant="ghost" size="sm" onClick={copyJson}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      <CardDescription>{generatedVariations.length} variação(ões) geradas</CardDescription>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-2 gap-3">
                    {generatedVariations.map((variation, index) => (
                      <Card
                        key={variation.id}
                        className={`cursor-pointer transition-all overflow-hidden ${
                          selectedVariationId === variation.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                        }`}
                        onClick={() => { setSelectedVariationId(variation.id); setGeneratedImageUrl(variation.imageUrl); }}
                      >
                        <div className="relative aspect-square bg-muted overflow-hidden">
                          {variation.isRegenerating ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                          ) : variation.textOverlay ? (
                            <BannerWithTextOverlay
                              format={selectedFormat}
                              backgroundImageUrl={variation.imageUrl}
                              textOverlay={variation.textOverlay}
                              logoUrl={variation.logoUrl}
                              brandColors={brandColors}
                              previewScale={0.2}
                            />
                          ) : (
                            <>
                              <img src={variation.imageUrl} alt={`Variação ${index + 1}`} className="w-full h-full object-cover" />
                              {variation.logoUrl && (
                                <img src={variation.logoUrl} alt="Logo" className="absolute bottom-3 right-3 w-12 h-12 object-contain drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                              )}
                            </>
                          )}
                          {selectedVariationId === variation.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">#{index + 1}</div>
                        </div>
                        <CardContent className="p-3">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={(e) => { e.stopPropagation(); handleDownloadVariation(variation, `criativo-${index + 1}-${Date.now()}.png`); }}
                            disabled={variation.isRegenerating}
                          >
                            <Download className="w-3 h-3 mr-1" /> Baixar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Selected Variation Preview */}
                  {selectedVariation && decision && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-lg">Pré-visualização</CardTitle>
                        <ArtFavoriteButton
                          imageUrl={selectedVariation.imageUrl}
                          bannerText={headline}
                          cta={cta}
                          format={selectedFormat}
                          projectId={currentProjectId || undefined}
                          showLabel
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-center">
                          <div className="overflow-hidden rounded-lg border shadow-lg max-w-full">
                            {selectedVariation.textOverlay ? (
                              <BannerWithTextOverlay
                                format={selectedFormat}
                                backgroundImageUrl={selectedVariation.imageUrl}
                                textOverlay={selectedVariation.textOverlay}
                                logoUrl={selectedVariation.logoUrl}
                                brandColors={brandColors}
                                previewScale={0.35}
                              />
                            ) : (
                              <div className="relative">
                                <img src={selectedVariation.imageUrl} alt="Preview" className="w-full h-auto" />
                                {selectedVariation.logoUrl && (
                                  <img src={selectedVariation.logoUrl} alt="Logo" className="absolute bottom-4 right-4 w-16 h-16 object-contain drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button type="button" onClick={() => handleDownloadVariation(selectedVariation)} className="w-full" variant="gradient">
                          <Download className="w-4 h-4 mr-2" /> Baixar em Alta Resolução
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Decision Details */}
                  {decision && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Direção Artística</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <LayoutTemplate className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Template</p>
                              <p className="font-medium text-sm">{getTemplateLabel(decision.template)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Paintbrush className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Estilo</p>
                              <Badge variant="secondary">{getStyleLabel(decision.style)}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Type className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Textos</p>
                            <p className="font-bold">{decision.headline}</p>
                            {decision.subheadline && <p className="text-sm text-muted-foreground mt-1">{decision.subheadline}</p>}
                            {decision.cta && <Badge className="mt-2">{decision.cta}</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold">Nenhuma imagem ainda</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                      Preencha o formulário ao lado e clique em Gerar para criar seus primeiros criativos.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto "{projectToDelete?.name}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
