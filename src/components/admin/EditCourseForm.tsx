import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface CourseFormData {
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
}

interface EditCourseFormProps {
  course: Course;
  onSuccess?: () => void;
}

export function EditCourseForm({ course, onSuccess }: EditCourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(course.thumbnail_url || "");
  const { toast } = useToast();

  const form = useForm<CourseFormData>({
    defaultValues: {
      title: course.title,
      description: course.description || "",
      thumbnail_url: course.thumbnail_url || "",
      is_published: course.is_published
    }
  });

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview("");
    form.setValue("thumbnail_url", "");
  };

  const handleThumbnailUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `course-thumbnails/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('training-thumbnails')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('training-thumbnails')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true);

      let thumbnailUrl = data.thumbnail_url;
      
      if (thumbnailFile) {
        thumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      }

      const { error } = await supabase
        .from("courses")
        .update({
          title: data.title,
          description: data.description,
          thumbnail_url: thumbnailUrl,
          is_published: data.is_published
        })
        .eq("id", course.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Curso atualizado com sucesso!"
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao atualizar curso:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o curso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          {...form.register("title", { required: true })}
          placeholder="Nome do curso"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Descrição do curso"
          rows={3}
        />
      </div>

      <div>
        <Label>Thumbnail</Label>
        <div className="mt-2">
          {thumbnailPreview ? (
            <div className="relative inline-block">
              <img
                src={thumbnailPreview}
                alt="Preview"
                className="w-32 h-20 object-cover rounded border"
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Clique para fazer upload de uma imagem
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={form.watch("is_published")}
          onCheckedChange={(checked) => form.setValue("is_published", checked)}
        />
        <Label htmlFor="is_published">Publicar curso</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}