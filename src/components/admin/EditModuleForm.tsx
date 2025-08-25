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

interface ModuleFormData {
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_published: boolean;
}

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_published: boolean;
}

interface EditModuleFormProps {
  module: Module;
  onSuccess?: () => void;
}

export function EditModuleForm({ module, onSuccess }: EditModuleFormProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();

  const form = useForm<ModuleFormData>({
    defaultValues: {
      title: module.title,
      description: module.description || "",
      course_id: module.course_id,
      order_index: module.order_index,
      is_published: module.is_published
    }
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, title")
          .order("title");

        if (error) throw error;
        setCourses(data || []);
      } catch (error: any) {
        console.error("Erro ao buscar cursos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os cursos",
          variant: "destructive"
        });
      }
    };

    fetchCourses();
  }, []);

  const onSubmit = async (data: ModuleFormData) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("modules")
        .update({
          title: data.title,
          description: data.description,
          course_id: data.course_id,
          order_index: data.order_index,
          is_published: data.is_published
        })
        .eq("id", module.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Módulo atualizado com sucesso!"
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao atualizar módulo:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o módulo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="course_id">Curso</Label>
        <Select 
          value={form.watch("course_id")} 
          onValueChange={(value) => form.setValue("course_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
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
          placeholder="Nome do módulo"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Descrição do módulo"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="order_index">Ordem</Label>
        <Input
          id="order_index"
          type="number"
          {...form.register("order_index", { valueAsNumber: true })}
          placeholder="Ordem do módulo no curso"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={form.watch("is_published")}
          onCheckedChange={(checked) => form.setValue("is_published", checked)}
        />
        <Label htmlFor="is_published">Publicar módulo</Label>
      </div>

      <Button type="submit" disabled={loading || !form.watch("course_id")} className="w-full">
        {loading ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}