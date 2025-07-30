import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";

interface TrainingFormData {
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  is_published: boolean;
}

export function CreateTrainingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<TrainingFormData>({
    defaultValues: {
      is_published: false
    }
  });

  const isPublished = watch("is_published");

  const handleThumbnailUpload = async (file: File) => {
    if (!user) return null;
    
    setUploadingThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('training-thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('training-thumbnails')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setValue("thumbnail_url", "");
  };

  const onSubmit = async (data: TrainingFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      let thumbnailUrl = data.thumbnail_url;
      
      // Upload thumbnail if file is selected
      if (thumbnailFile) {
        const uploadedUrl = await handleThumbnailUpload(thumbnailFile);
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('trainings')
        .insert([
          {
            ...data,
            thumbnail_url: thumbnailUrl,
            created_by: user.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Treinamento criado com sucesso."
      });

      reset();
      setThumbnailFile(null);
      setThumbnailPreview(null);
    } catch (error) {
      console.error('Error creating training:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar treinamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Treinamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Nome do treinamento"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrição do treinamento"
              rows={3}
            />
          </div>

          <div>
            <Label>Thumbnail do Treinamento</Label>
            <div className="space-y-2">
              {thumbnailPreview ? (
                <div className="relative inline-block">
                  <img 
                    src={thumbnailPreview} 
                    alt="Preview" 
                    className="w-32 h-20 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeThumbnail}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <Label 
                    htmlFor="thumbnail-upload"
                    className="flex items-center justify-center w-full h-20 border-2 border-dashed border-muted-foreground/25 rounded-md cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingThumbnail ? "Enviando..." : "Carregar imagem"}
                      </span>
                    </div>
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="video_url">Link do Vídeo</Label>
            <Input
              id="video_url"
              {...register("video_url")}
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              Suporta YouTube, Vimeo, Loom, Panda Video e outras plataformas
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_published"
              checked={isPublished}
              onCheckedChange={(checked) => setValue("is_published", checked)}
            />
            <Label htmlFor="is_published">Publicar imediatamente</Label>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar Treinamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}