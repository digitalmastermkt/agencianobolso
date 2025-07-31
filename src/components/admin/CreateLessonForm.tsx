import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LessonFormData {
  title: string;
  description: string;
  module_id: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
}

interface Module {
  id: string;
  title: string;
  course: {
    title: string;
  };
}

interface CreateLessonFormProps {
  onSuccess?: () => void;
  preSelectedModuleId?: string;
}

export function CreateLessonForm({ onSuccess, preSelectedModuleId }: CreateLessonFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, reset } = useForm<LessonFormData>({
    defaultValues: {
      title: "",
      description: "",
      module_id: preSelectedModuleId || "",
      video_url: "",
      duration_minutes: 0,
      order_index: 0,
      is_published: false,
    },
  });

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (preSelectedModuleId) {
      setValue("module_id", preSelectedModuleId);
    }
  }, [preSelectedModuleId, setValue]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          id, 
          title,
          courses!inner(title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedModules = data?.map(module => ({
        id: module.id,
        title: module.title,
        course: {
          title: (module.courses as any).title
        }
      })) || [];
      
      setModules(formattedModules);
    } catch (error) {
      console.error("Erro ao carregar módulos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: LessonFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("lessons").insert({
        title: data.title,
        description: data.description,
        module_id: data.module_id,
        video_url: data.video_url,
        duration_minutes: data.duration_minutes,
        order_index: data.order_index,
        is_published: data.is_published,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Aula criada com sucesso.",
      });

      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar aula:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar aula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Nova Aula</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="module">Módulo</Label>
            <Select
              value={watch("module_id")}
              onValueChange={(value) => setValue("module_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um módulo" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.course.title} - {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Nome da aula"
              {...register("title", { required: true })}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição da aula"
              {...register("description")}
            />
          </div>

          <div>
            <Label htmlFor="video_url">Link do Vídeo</Label>
            <Input
              id="video_url"
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
              {...register("video_url", { required: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Suporta YouTube, Vimeo, Loom, Panda Video e outras plataformas
            </p>
          </div>

          <div>
            <Label htmlFor="duration_minutes">Duração (minutos)</Label>
            <Input
              id="duration_minutes"
              type="number"
              placeholder="0"
              {...register("duration_minutes", { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label htmlFor="order_index">Ordem</Label>
            <Input
              id="order_index"
              type="number"
              placeholder="0"
              {...register("order_index", { valueAsNumber: true })}
            />
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
            disabled={isLoading || !watch("module_id")}
            className="w-full"
          >
            {isLoading ? "Criando..." : "Criar Aula"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}