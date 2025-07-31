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

interface CreateModuleFormProps {
  onSuccess?: () => void;
  preSelectedCourseId?: string;
}

export function CreateModuleForm({ onSuccess, preSelectedCourseId }: CreateModuleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, reset } = useForm<ModuleFormData>({
    defaultValues: {
      title: "",
      description: "",
      course_id: preSelectedCourseId || "",
      order_index: 0,
      is_published: false,
    },
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (preSelectedCourseId) {
      setValue("course_id", preSelectedCourseId);
    }
  }, [preSelectedCourseId, setValue]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cursos.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: ModuleFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("modules").insert({
        title: data.title,
        description: data.description,
        course_id: data.course_id,
        order_index: data.order_index,
        is_published: data.is_published,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Módulo criado com sucesso.",
      });

      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar módulo:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar módulo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Módulo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="course">Curso</Label>
            <Select
              value={watch("course_id")}
              onValueChange={(value) => setValue("course_id", value)}
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
              placeholder="Nome do módulo"
              {...register("title", { required: true })}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do módulo"
              {...register("description")}
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
            disabled={isLoading || !watch("course_id")}
            className="w-full"
          >
            {isLoading ? "Criando..." : "Criar Módulo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}