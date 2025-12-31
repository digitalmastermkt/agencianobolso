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
  Paintbrush
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { renderBannerFromDecision, type BannerDecision } from "@/components/renderBannerFromDecision";

interface ArtDirectorDecision {
  template: "pessoa_direita" | "pessoa_centro" | "pessoa_esquerda";
  headline: string;
  subheadline?: string;
  cta?: string;
  colors: string[];
  style: "clean" | "minimal" | "premium";
}

interface ProjectBanner extends BannerDecision {
  id: string;
  photoUrl: string;
  createdAt: string;
}

interface ProjectItem {
  id: string;
  name: string;
  banners: ProjectBanner[];
}

const PROJECTS_STORAGE_KEY = "art-director-projects";

export default function AgenteDiretorArte() {
  const { toast } = useToast();
  const { isMobile, buttonMinHeight, inputHeight } = useMobileOptimization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [bannerText, setBannerText] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [decision, setDecision] = useState<ArtDirectorDecision | null>(null);
  const [copied, setCopied] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const currentProjectRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
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
  }, []);

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const maxImages = 5 - images.length;

    for (let i = 0; i < Math.min(files.length, maxImages); i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setImages(prev => [...prev, ...newImages]);
    
    if (files.length > maxImages) {
      toast({
        title: "Limite de imagens",
        description: `Máximo de 5 imagens. ${files.length - maxImages} imagem(ns) ignorada(s).`,
        variant: "destructive"
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast({
        title: "Imagens necessárias",
        description: "Envie pelo menos 1 print do Instagram para análise.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setDecision(null);

    try {
      const { data, error } = await supabase.functions.invoke('art-director-decision', {
        body: { images, bannerText, ctaText }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDecision(data.decision);
      
      toast({
        title: "Decisão gerada!",
        description: "O Diretor de Arte analisou sua identidade visual."
      });

    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive"
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

  const inlineStyles = (source: HTMLElement, target: HTMLElement) => {
    const computed = window.getComputedStyle(source);
    target.setAttribute(
      "style",
      Array.from(computed)
        .map((key) => `${key}:${computed.getPropertyValue(key)};`)
        .join("")
    );

    Array.from(source.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return;
      const targetChild = target.children.item(index);
      if (targetChild instanceof HTMLElement) {
        inlineStyles(child, targetChild);
      }
    });
  };

  const handleExportBanner = async () => {
    if (!decision || !bannerRef.current) return;

    const node = bannerRef.current;
    const rect = node.getBoundingClientRect();
    const cloned = node.cloneNode(true) as HTMLElement;
    cloned.style.width = `${rect.width}px`;
    cloned.style.height = `${rect.height}px`;
    inlineStyles(node, cloned);

    const serialized = new XMLSerializer().serializeToString(cloned);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${serialized}</div>
        </foreignObject>
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const scale = window.devicePixelRatio || 2;
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const downloadUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `banner-${decision.template}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    };
    image.src = url;
  };

  const bannerDecision = useMemo(
    () =>
      decision
        ? {
            template: decision.template,
            headline: decision.headline,
            subheadline: decision.subheadline ?? "",
            cta: decision.cta ? { label: decision.cta } : undefined,
            colors: {
              background: decision.colors[0] ?? "#0f172a",
              headline: decision.colors[1] ?? "#f8fafc",
              subheadline: decision.colors[2] ?? "#e2e8f0",
              ctaBackground: decision.colors[3] ?? decision.colors[1] ?? "#f8fafc",
              ctaText: decision.colors[4] ?? decision.colors[0] ?? "#0f172a",
            },
            style: undefined,
          }
        : null,
    [decision]
  );

  useEffect(() => {
    if (!decision || !images[0]) return;
    const targetProjectId = currentProjectRef.current ?? createDefaultProject();
    if (!bannerDecision) return;

    const newBanner: ProjectBanner = {
      id: crypto.randomUUID(),
      photoUrl: images[0],
      createdAt: new Date().toISOString(),
      ...bannerDecision,
    };

    setProjects((prev) =>
      prev.map((project) =>
        project.id === targetProjectId
          ? { ...project, banners: [newBanner, ...project.banners] }
          : project
      )
    );
  }, [decision, images, bannerDecision]);

  const currentProject = projects.find((project) => project.id === currentProjectId) ?? null;

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
              Analisa prints do Instagram e retorna decisões de design em JSON.
              <span className="block text-sm mt-1 text-muted-foreground/80">
                Não gera imagens — apenas define template, cores e textos.
              </span>
            </p>
          </div>

          <div className="mb-8 max-w-md mx-auto">
            <TrialStatusCard />
            <SubscriptionStatusCard />
          </div>

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
                  <p className="text-sm text-muted-foreground">
                    Nenhum projeto criado ainda.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banners do projeto</CardTitle>
                <CardDescription>
                  Selecione um projeto para visualizar os banners associados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentProject ? (
                  currentProject.banners.length > 0 ? (
                    <div className="space-y-6">
                      {currentProject.banners.map((banner) => (
                        <div key={banner.id} className="space-y-3">
                          <div className="text-xs text-muted-foreground">
                            {new Date(banner.createdAt).toLocaleString()}
                          </div>
                          {renderBannerFromDecision(banner, banner.photoUrl)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ainda não há banners neste projeto.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Crie ou selecione um projeto para começar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Referências Visuais
                </CardTitle>
                <CardDescription>
                  Envie até 5 prints do Instagram para análise da identidade visual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div>
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
                      disabled={images.length >= 5}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {images.length >= 5 
                        ? 'Limite de 5 imagens atingido' 
                        : `Adicionar Prints (${images.length}/5)`}
                    </Button>

                    {images.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {images.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                            <img 
                              src={img} 
                              alt={`Print ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Banner Text */}
                  <div>
                    <Label htmlFor="bannerText" className="font-medium">
                      Texto do Banner (opcional)
                    </Label>
                    <Input
                      id="bannerText"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="Ex: Transforme sua vida hoje"
                      className={`mt-2 ${inputHeight}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O agente usará isso para sugerir headline e subheadline
                    </p>
                  </div>

                  {/* CTA Text */}
                  <div>
                    <Label htmlFor="ctaText" className="font-medium">
                      CTA desejado (opcional)
                    </Label>
                    <Input
                      id="ctaText"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Ex: Saiba mais"
                      className={`mt-2 ${inputHeight}`}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full ${buttonMinHeight}`} 
                    variant="gradient" 
                    disabled={loading || images.length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Palette className="w-5 h-5 mr-2" />
                        Gerar Decisão de Design
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
                  <span>Decisão do Diretor</span>
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
                      Analisando identidade visual...
                    </div>
                  </div>
                ) : decision ? (
                  <div className="space-y-6">
                    {/* Visual Preview */}
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

                      {/* Colors */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Paleta de Cores</p>
                        <div className="flex gap-2">
                          {decision.colors.map((color, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-lg border shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs font-mono">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {bannerDecision && images[0] && (
                      <div className="space-y-4">
                        <div ref={bannerRef} className="w-full">
                          {renderBannerFromDecision(bannerDecision, images[0])}
                        </div>
                        <Button
                          type="button"
                          onClick={handleExportBanner}
                          className="w-full"
                        >
                          Baixar imagem
                        </Button>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">JSON Completo</p>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(decision, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Palette className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Envie prints do Instagram para receber</p>
                    <p>as decisões de design em JSON.</p>
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
