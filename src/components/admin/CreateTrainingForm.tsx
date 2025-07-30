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

interface TrainingFormData {
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
}

export function CreateTrainingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<TrainingFormData>({
    defaultValues: {
      is_published: false
    }
  });

  const isPublished = watch("is_published");

  const onSubmit = async (data: TrainingFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('trainings')
        .insert([
          {
            ...data,
            created_by: user.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Treinamento criado com sucesso."
      });

      reset();
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
            <Label htmlFor="thumbnail_url">URL da Thumbnail</Label>
            <Input
              id="thumbnail_url"
              {...register("thumbnail_url")}
              placeholder="https://exemplo.com/imagem.jpg"
            />
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