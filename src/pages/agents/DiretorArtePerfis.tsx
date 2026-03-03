import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, AlertCircle, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BrandProfileSelector } from "@/components/banner/BrandProfileSelector";
import { InstagramAnalyzer } from "@/components/banner/InstagramAnalyzer";
import { BrandPersonPhotosManager, PersonPhoto } from "@/components/banner/BrandPersonPhotosManager";
import { useNavigate } from "react-router-dom";

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

export default function DiretorArtePerfis() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedBrandProfileId, setSelectedBrandProfileId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [personPhotos, setPersonPhotos] = useState<PersonPhoto[]>([]);
  const [extractedIdentity, setExtractedIdentity] = useState<VisualIdentity | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
        if (Array.isArray(profile.colors)) setBrandColors(profile.colors);
        if (Array.isArray(profile.person_photos)) setPersonPhotos(profile.person_photos);
      }
    };
    loadBrandProfile();
  }, [selectedBrandProfileId, user?.id]);

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
          .update({ logo_url: logoData, updated_at: new Date().toISOString() })
          .eq('id', selectedBrandProfileId);
        if (error) throw error;
        setBrandProfile(prev => prev ? { ...prev, logo_url: logoData } : null);
        toast({ title: "Logo atualizado! 🎨", description: "O logo foi salvo no perfil de marca." });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({ title: "Erro ao enviar logo", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!selectedBrandProfileId) return;
    try {
      const { error } = await supabase
        .from('brand_profiles')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', selectedBrandProfileId);
      if (error) throw error;
      setBrandProfile(prev => prev ? { ...prev, logo_url: null } : null);
      toast({ title: "Logo removido" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleIdentityExtracted = (identity: VisualIdentity) => {
    setExtractedIdentity(identity);
    if (identity.colors) setBrandColors(identity.colors);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Perfis de Marca</h1>
              <p className="text-sm text-muted-foreground">Gerencie sua identidade visual e fotos</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Brand Profile Selector */}
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

            {/* Identity Summary */}
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
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: color }} />
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

            {/* Logo Upload */}
            {selectedBrandProfileId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Logo da Marca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {brandProfile?.logo_url ? (
                    <div className="flex items-center gap-4">
                      <img src={brandProfile.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-lg border bg-white p-2" />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-1" /> Trocar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive">
                          <X className="w-4 h-4 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        <span className="text-primary font-medium">Clique para enviar</span> o logo da marca
                      </p>
                    </div>
                  )}
                  <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  {isUploadingLogo && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando logo...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Person Photos */}
            {selectedBrandProfileId && (
              <BrandPersonPhotosManager
                brandProfileId={selectedBrandProfileId}
                photos={personPhotos}
                onPhotosChange={setPersonPhotos}
                onSelectPhoto={() => {}}
                maxPhotos={10}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
