import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface LessonFormData {
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  module_id: string;
  order_index: number;
  is_published: boolean;
}

interface Module {
  id: string;
  title: string;
  courses?: { title: string };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  module_id: string;
  order_index: number;
  is_published: boolean;
}

interface EditLessonFormProps {
  lesson: Lesson;
  onSuccess?: () => void;
}

export function EditLessonForm({ lesson, onSuccess }: EditLessonFormProps) {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const { toast } = useToast();

  const form = useForm<LessonFormData>({
    defaultValues: {
      title: lesson.title,
      description: lesson.description || "",
      video_url: lesson.video_url,
      duration_minutes: lesson.duration_minutes || 0,
      module_id: lesson.module_id,
      order_index: lesson.order_index,
      is_published: lesson.is_published
    }
  });

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase
          .from("modules")
          .select(`
            id,
            title,
            courses(title)
          `)
          .order("title");

        if (error) throw error;
        setModules(data || []);
      } catch (error: any) {
        console.error("Erro ao buscar módulos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os módulos",
          variant: "destructive"
        });
      }
    };

    fetchModules();
  }, []);

  const onSubmit = async (data: LessonFormData) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("lessons")
        .update({
          title: data.title,
          description: data.description,
          video_url: data.video_url,
          duration_minutes: data.duration_minutes,
          module_id: data.module_id,
          order_index: data.order_index,
          is_published: data.is_published
        })
        .eq("id", lesson.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso!"
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao atualizar aula:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a aula",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="module_id">Módulo</Label>
        <Select 
          value={form.watch("module_id")} 
          onValueChange={(value) => form.setValue("module_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um módulo" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.title} ({module.courses?.title})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          {...form.register("title", { required: true })}
          placeholder="Nome da aula"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Descrição da aula"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="video_url">URL do Vídeo</Label>
        <Input
          id="video_url"
          {...form.register("video_url", { required: true })}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div>
        <Label htmlFor="duration_minutes">Duração (minutos)</Label>
        <Input
          id="duration_minutes"
          type="number"
          {...form.register("duration_minutes", { valueAsNumber: true })}
          placeholder="Duração em minutos"
        />
      </div>

      <div>
        <Label htmlFor="order_index">Ordem</Label>
        <Input
          id="order_index"
          type="number"
          {...form.register("order_index", { valueAsNumber: true })}
          placeholder="Ordem da aula no módulo"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={form.watch("is_published")}
          onCheckedChange={(checked) => form.setValue("is_published", checked)}
        />
        <Label htmlFor="is_published">Publicar aula</Label>
      </div>

      <Button type="submit" disabled={loading || !form.watch("module_id")} className="w-full">
        {loading ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}