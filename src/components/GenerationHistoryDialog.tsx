import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Copy, Trash2, RotateCcw, Calendar } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { ExportButtons } from "./ExportButtons";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GenerationHistoryDialogProps {
  currentAgentType?: string;
  onReuse?: (formData: Record<string, string>) => void;
}

const agentNames: Record<string, string> = {
  vendas: "Vendas",
  storytelling: "Storytelling",
  viral: "Viral",
  interacao: "Interação",
  conexao: "Conexão",
  banner: "Banner",
};

export function GenerationHistoryDialog({ 
  currentAgentType, 
  onReuse 
}: GenerationHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const { getAllHistory, deleteItem, clearAgentHistory, totalItems } = useGenerationHistory();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(currentAgentType || "vendas");

  const allHistory = getAllHistory();
  const availableAgents = Object.keys(allHistory);

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copiado!",
        description: "Conteúdo copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o conteúdo",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast({
      title: "Removido",
      description: "Item removido do histórico",
    });
  };

  const handleClearAgent = (agentType: string) => {
    clearAgentHistory(agentType);
    toast({
      title: "Histórico limpo",
      description: `Todas as gerações de ${agentNames[agentType]} foram removidas`,
    });
  };

  const handleReuse = (formData: Record<string, string>) => {
    if (onReuse) {
      onReuse(formData);
      setOpen(false);
      toast({
        title: "Dados carregados",
        description: "Os dados do histórico foram carregados no formulário",
      });
    }
  };

  if (totalItems === 0) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <History className="w-4 h-4" />
            Histórico
            <Badge variant="secondary" className="ml-1">0</Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Histórico de Gerações</DialogTitle>
            <DialogDescription>
              Suas últimas gerações de IA aparecem aqui
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum histórico ainda</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Quando você gerar conteúdo com os agentes de IA, as últimas 10 gerações de cada agente serão salvas aqui.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          Histórico
          <Badge variant="secondary" className="ml-1">{totalItems}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Gerações</DialogTitle>
          <DialogDescription>
            Últimas 10 gerações de cada agente (salvas localmente)
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {Object.keys(agentNames).map(agentType => (
              <TabsTrigger 
                key={agentType} 
                value={agentType}
                disabled={!availableAgents.includes(agentType)}
              >
                {agentNames[agentType]}
                {allHistory[agentType] && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {allHistory[agentType].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(agentNames).map(agentType => (
            <TabsContent key={agentType} value={agentType} className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {allHistory[agentType]?.length || 0} geraç{allHistory[agentType]?.length === 1 ? 'ão' : 'ões'}
                </h3>
                {allHistory[agentType]?.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearAgent(agentType)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar tudo
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {!allHistory[agentType] || allHistory[agentType].length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma geração ainda para este agente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allHistory[agentType].map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {item.content}
                            </pre>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(item.content)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                          {onReuse && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReuse(item.formData)}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reutilizar
                            </Button>
                          )}
                          <ExportButtons
                            content={item.content}
                            agentType={item.agentType}
                          />
                          <FavoriteButton
                            agentType={item.agentType}
                            content={item.content}
                            formData={item.formData}
                            size="sm"
                          />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
