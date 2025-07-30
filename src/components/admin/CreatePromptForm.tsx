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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PromptFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string;
  is_published: boolean;
}

const categories = [
  "vendas",
  "storytelling", 
  "viral",
  "interacao",
  "conexao",
  "banner",
  "geral"
];

export function CreatePromptForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<PromptFormData>({
    defaultValues: {
      is_published: false,
      category: "geral"
    }
  });

  const isPublished = watch("is_published");

  const onSubmit = async (data: PromptFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const { error } = await supabase
        .from('prompts')
        .insert([
          {
            title: data.title,
            description: data.description,
            content: data.content,
            category: data.category,
            tags: tagsArray,
            is_published: data.is_published,
            created_by: user.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Prompt criado com sucesso."
      });

      reset();
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar prompt.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Prompt</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Nome do prompt"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrição do prompt"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="content">Conteúdo do Prompt</Label>
            <Textarea
              id="content"
              {...register("content", { required: true })}
              placeholder="O prompt completo aqui..."
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select onValueChange={(value) => setValue("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="tag1, tag2, tag3"
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
            {loading ? "Criando..." : "Criar Prompt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}