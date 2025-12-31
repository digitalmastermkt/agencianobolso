import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, RotateCcw } from "lucide-react";
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
}

interface AgentPromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: AgentPrompt | null;
  onSave: (prompt: Partial<AgentPrompt>) => Promise<void>;
}

export function AgentPromptEditor({
  open,
  onOpenChange,
  prompt,
  onSave,
}: AgentPromptEditorProps) {
  const [promptContent, setPromptContent] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [originalContent, setOriginalContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (prompt) {
      setPromptContent(prompt.prompt_content);
      setSystemPrompt(prompt.system_prompt || "");
      setDescription(prompt.description || "");
      setOriginalContent(prompt.prompt_content);
    }
  }, [prompt]);

  const handleSave = async () => {
    if (!prompt) return;

    setSaving(true);
    try {
      await onSave({
        prompt_content: promptContent,
        system_prompt: systemPrompt || null,
        description: description || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInsertVariable = (variable: string) => {
    const variableText = `{{${variable}}}`;
    setPromptContent((prev) => prev + variableText);
    
    toast({
      title: "Variável inserida",
      description: `${variableText} foi adicionada ao prompt.`,
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptContent);
    toast({
      title: "Copiado",
      description: "Prompt copiado para a área de transferência.",
    });
  };

  const handleResetPrompt = () => {
    setPromptContent(originalContent);
    toast({
      title: "Restaurado",
      description: "Prompt restaurado para a versão original.",
    });
  };

  const countCharacters = (text: string) => text.length;
  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Prompt: {prompt.agent_name}
          </DialogTitle>
          <DialogDescription>
            Edite o prompt mestre do agente. Use as variáveis disponíveis para
            personalizar o conteúdo gerado.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="prompt" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt">Prompt Mestre</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4">
              {/* Variables */}
              <div>
                <Label className="text-sm font-medium">Variáveis Disponíveis</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Clique para inserir no prompt
                </p>
                <div className="flex flex-wrap gap-1">
                  {prompt.variables?.map((variable) => (
                    <Badge
                      key={variable}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleInsertVariable(variable)}
                    >
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Prompt Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt-content">Prompt Mestre</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPrompt}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetPrompt}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restaurar
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[300px] border rounded-md">
                  <Textarea
                    id="prompt-content"
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                    className="min-h-[300px] border-0 resize-none font-mono text-sm"
                    placeholder="Digite o prompt do agente..."
                  />
                </ScrollArea>
                <div className="flex justify-end gap-4 text-xs text-muted-foreground">
                  <span>{countCharacters(promptContent)} caracteres</span>
                  <span>{countWords(promptContent)} palavras</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Agente</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição breve do que o agente faz..."
                />
              </div>

              {/* System Prompt (for banner_personalized) */}
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt (Opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Usado para instruções de sistema adicionais (como no Banner Personalizado)
                </p>
                <ScrollArea className="h-[200px] border rounded-md">
                  <Textarea
                    id="system-prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[200px] border-0 resize-none font-mono text-sm"
                    placeholder="System prompt opcional..."
                  />
                </ScrollArea>
              </div>

              {/* Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Informações</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Chave do Agente:</dt>
                    <dd className="font-mono">{prompt.agent_key}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status:</dt>
                    <dd>{prompt.is_active ? "Ativo" : "Inativo"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Variáveis:</dt>
                    <dd>{prompt.variables?.length || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
