import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Upload, X, Loader2, Plus, Pencil, Trash2, Check, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PersonAnalysis } from "./PersonPhotoUpload";

export interface PersonPhoto {
  id: string;
  photo_url: string;
  analysis: PersonAnalysis;
  name: string;
  created_at: string;
}

interface BrandPersonPhotosManagerProps {
  brandProfileId: string;
  photos: PersonPhoto[];
  onPhotosChange: (photos: PersonPhoto[]) => void;
  selectedPhotoId?: string | null;
  onSelectPhoto?: (photo: PersonPhoto) => void;
  maxPhotos?: number;
}

export function BrandPersonPhotosManager({
  brandProfileId,
  photos,
  onPhotosChange,
  selectedPhotoId,
  onSelectPhoto,
  maxPhotos = 5
}: BrandPersonPhotosManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= maxPhotos) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${maxPhotos} fotos por perfil`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        setUploadProgress(30);

        // Analyze the photo
        const { data, error } = await supabase.functions.invoke('analyze-person-photo', {
          body: { image: imageData }
        });

        setUploadProgress(70);

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Create new photo entry
        const newPhoto: PersonPhoto = {
          id: crypto.randomUUID(),
          photo_url: imageData,
          analysis: data.person,
          name: `Foto ${photos.length + 1}`,
          created_at: new Date().toISOString()
        };

        const updatedPhotos = [...photos, newPhoto];
        
        // Save to database
        const { error: updateError } = await supabase
          .from('brand_profiles')
          .update({
            person_photos: updatedPhotos as unknown as Record<string, never>[],
            updated_at: new Date().toISOString()
          })
          .eq('id', brandProfileId);

        if (updateError) throw updateError;

        setUploadProgress(100);
        onPhotosChange(updatedPhotos);
        setIsDialogOpen(false);
        
        toast({
          title: "Foto adicionada! 📸",
          description: "A foto foi analisada e salva no perfil",
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro ao adicionar foto",
        description: error.message || "Falha ao processar a foto",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      
      const { error } = await supabase
        .from('brand_profiles')
        .update({
          person_photos: updatedPhotos as unknown as Record<string, never>[],
          updated_at: new Date().toISOString()
        })
        .eq('id', brandProfileId);

      if (error) throw error;

      onPhotosChange(updatedPhotos);
      toast({
        title: "Foto removida",
        description: "A foto foi excluída do perfil",
      });
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro ao remover",
        description: "Falha ao excluir a foto",
        variant: "destructive",
      });
    }
  };

  const handleRenamePhoto = async (photoId: string) => {
    if (!editName.trim()) return;
    
    try {
      const updatedPhotos = photos.map(p => 
        p.id === photoId ? { ...p, name: editName.trim() } : p
      );
      
      const { error } = await supabase
        .from('brand_profiles')
        .update({
          person_photos: updatedPhotos as unknown as Record<string, never>[],
          updated_at: new Date().toISOString()
        })
        .eq('id', brandProfileId);

      if (error) throw error;

      onPhotosChange(updatedPhotos);
      setEditingId(null);
      setEditName("");
    } catch (error: any) {
      console.error('Error renaming photo:', error);
      toast({
        title: "Erro ao renomear",
        description: "Falha ao atualizar o nome",
        variant: "destructive",
      });
    }
  };

  const startEditing = (photo: PersonPhoto) => {
    setEditingId(photo.id);
    setEditName(photo.name);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Fotos do Perfil
            </CardTitle>
            <CardDescription>
              {photos.length}/{maxPhotos} fotos salvas
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                disabled={photos.length >= maxPhotos || isUploading}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Foto</DialogTitle>
                <DialogDescription>
                  Faça upload de uma foto da pessoa para usar nos designs
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {isUploading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analisando foto...</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="brand-photo-upload"
                    />
                    <label 
                      htmlFor="brand-photo-upload" 
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="p-3 rounded-full bg-primary/10">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-primary font-medium">Clique para enviar</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A foto será analisada automaticamente
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma foto salva</p>
            <p className="text-xs mt-1">Adicione fotos para usar nos seus designs</p>
          </div>
        ) : (
          <ScrollArea className="h-auto max-h-[300px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div 
                  key={photo.id}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedPhotoId === photo.id 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectPhoto?.(photo)}
                >
                  {/* Photo */}
                  <div className="aspect-square">
                    <img
                      src={photo.photo_url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Selected badge */}
                  {selectedPhotoId === photo.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    {/* Actions */}
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(photo);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A foto será removida permanentemente do perfil.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePhoto(photo.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    
                    {/* Name */}
                    <div className="text-white text-xs truncate font-medium">
                      {photo.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Rename Dialog */}
        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renomear Foto</DialogTitle>
            </DialogHeader>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nome da foto"
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
              <Button onClick={() => editingId && handleRenamePhoto(editingId)}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
