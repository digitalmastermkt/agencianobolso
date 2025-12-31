import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgentPromptEditor } from "@/components/admin/AgentPromptEditor";
import { 
  TrendingUp, 
  Heart, 
  Zap, 
  MessageCircle, 
  Link as LinkIcon, 
  Image,
  Loader2,
  Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentPrompt {
  id: string;
  agent_key: string;
  agent_name: string;
  prompt_content: string;
  system_prompt: string | null;
  description: string | null;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const agentIcons: Record<string, { icon: React.ElementType; color: string }> = {
  vendas: { icon: TrendingUp, color: "text-emerald-600" },
  storytelling: { icon: Heart, color: "text-pink-600" },
  viral: { icon: Zap, color: "text-purple-600" },
  interacao: { icon: MessageCircle, color: "text-blue-600" },
  conexao: { icon: LinkIcon, color: "text-orange-600" },
  banner: { icon: Image, color: "text-red-600" },
};

export default function AdminAgentPrompts() {
  const [prompts, setPrompts] = useState<AgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<AgentPrompt | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { toast } = useToast();

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agent_master_prompts")
        .select("*")
        .order("agent_name");

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error("Erro ao buscar prompts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os prompts dos agentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleEdit = (prompt: AgentPrompt) => {
    setSelectedPrompt(prompt);
    setEditorOpen(true);
  };

  const handleSave = async (updatedPrompt: Partial<AgentPrompt>) => {
    if (!selectedPrompt) return;

    try {
      const { error } = await supabase
        .from("agent_master_prompts")
        .update({
          prompt_content: updatedPrompt.prompt_content,
          system_prompt: updatedPrompt.system_prompt,
          description: updatedPrompt.description,
        })
        .eq("id", selectedPrompt.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Prompt atualizado com sucesso!",
      });

      setEditorOpen(false);
      fetchPrompts();
    } catch (error) {
      console.error("Erro ao salvar prompt:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o prompt.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Prompts dos Agentes</h2>
          <p className="text-muted-foreground">
            Gerencie os prompts mestres de cada agente de IA. As alterações são aplicadas em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((prompt) => {
            const iconConfig = agentIcons[prompt.agent_key] || { icon: MessageCircle, color: "text-gray-600" };
            const Icon = iconConfig.icon;

            return (
              <Card key={prompt.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${iconConfig.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{prompt.agent_name}</CardTitle>
                        <CardDescription className="text-xs">
                          {prompt.agent_key}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={prompt.is_active ? "default" : "secondary"}>
                      {prompt.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {prompt.description || "Sem descrição"}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {prompt.variables?.slice(0, 4).map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {(prompt.variables?.length || 0) > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{(prompt.variables?.length || 0) - 4}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Atualizado: {formatDate(prompt.updated_at)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {prompts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum prompt de agente encontrado.
            </CardContent>
          </Card>
        )}
      </div>

      <AgentPromptEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        prompt={selectedPrompt}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}
