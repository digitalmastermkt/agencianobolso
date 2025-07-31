import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface CourseFormData {
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
}

interface CreateCourseFormProps {
  onSuccess?: () => void;
}

export function CreateCourseForm({ onSuccess }: CreateCourseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, reset } = useForm<CourseFormData>({
    defaultValues: {
      title: "",
      description: "",
      thumbnail_url: "",
      is_published: false,
    },
  });

  const handleThumbnailUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('training-thumbnails')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('training-thumbnails')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setSelectedThumbnailFile(null);
    setThumbnailPreview(null);
    setValue("thumbnail_url", "");
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let thumbnailUrl = data.thumbnail_url;

      if (selectedThumbnailFile) {
        setIsUploadingThumbnail(true);
        thumbnailUrl = await handleThumbnailUpload(selectedThumbnailFile);
        setIsUploadingThumbnail(false);
      }

      const { error } = await supabase.from("courses").insert({
        title: data.title,
        description: data.description,
        thumbnail_url: thumbnailUrl,
        is_published: data.is_published,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Curso criado com sucesso.",
      });

      reset();
      setSelectedThumbnailFile(null);
      setThumbnailPreview(null);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar curso:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar curso.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploadingThumbnail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Curso</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Nome do curso"
              {...register("title", { required: true })}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do curso"
              {...register("description")}
            />
          </div>

          <div>
            <Label htmlFor="thumbnail">Thumbnail do Curso</Label>
            {!thumbnailPreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Carregar imagem
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeThumbnail}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={watch("is_published")}
              onCheckedChange={(checked) => setValue("is_published", checked)}
            />
            <Label htmlFor="published">Publicar imediatamente</Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading || isUploadingThumbnail}
            className="w-full"
          >
            {isUploadingThumbnail
              ? "Enviando imagem..."
              : isLoading
              ? "Criando..."
              : "Criar Curso"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}