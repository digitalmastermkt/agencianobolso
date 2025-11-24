import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Copy, Trash2, Calendar, RotateCcw } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

const agentNames: Record<string, string> = {
  vendas: "Vendas",
  storytelling: "Storytelling",
  viral: "Viral",
  interacao: "Interação",
  conexao: "Conexão",
  banner: "Banner",
};

const agentColors: Record<string, string> = {
  vendas: "from-emerald-500 to-teal-600",
  storytelling: "from-pink-500 to-rose-600",
  viral: "from-purple-500 to-violet-600",
  interacao: "from-blue-500 to-cyan-600",
  conexao: "from-green-500 to-emerald-600",
  banner: "from-orange-500 to-red-600",
};

export default function Favoritos() {
  const { favorites, loading, removeFavorite, getFavoritesByAgent, totalFavorites } = useFavorites();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("todos");

  const favoritesByAgent = getFavoritesByAgent();
  const availableAgents = Object.keys(favoritesByAgent);

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

  const handleDelete = async (favoriteId: string) => {
    await removeFavorite(favoriteId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (totalFavorites === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
                  <Star className="w-10 h-10" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Meus Favoritos</h1>
              <p className="text-muted-foreground">
                Suas gerações favoritas de IA aparecem aqui
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Nenhum favorito ainda</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Quando você marcar gerações como favoritas usando o botão ⭐, elas aparecerão aqui para acesso rápido.
              </p>
              <Button onClick={() => window.location.href = '/agentes'}>
                Explorar Agentes de IA
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
                <Star className="w-10 h-10 fill-current" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Meus Favoritos</h1>
            <p className="text-muted-foreground">
              {totalFavorites} geraç{totalFavorites === 1 ? 'ão' : 'ões'} salva{totalFavorites === 1 ? '' : 's'}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="todos">
                Todos
                <Badge variant="secondary" className="ml-1 text-xs">
                  {totalFavorites}
                </Badge>
              </TabsTrigger>
              {Object.keys(agentNames).map(agentType => (
                <TabsTrigger 
                  key={agentType} 
                  value={agentType}
                  disabled={!availableAgents.includes(agentType)}
                >
                  {agentNames[agentType]}
                  {favoritesByAgent[agentType] && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {favoritesByAgent[agentType].length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="todos" className="mt-6">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {favorites.map((favorite) => (
                    <Card key={favorite.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${agentColors[favorite.agent_type]} text-white`}>
                              <Star className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {agentNames[favorite.agent_type]}
                                <Badge variant="outline">{favorite.agent_type}</Badge>
                              </CardTitle>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(favorite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(favorite.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {favorite.generated_content}
                          </pre>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(favorite.generated_content)}
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {Object.keys(agentNames).map(agentType => (
              <TabsContent key={agentType} value={agentType} className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  {!favoritesByAgent[agentType] || favoritesByAgent[agentType].length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum favorito para este agente</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoritesByAgent[agentType].map((favorite) => (
                        <Card key={favorite.id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(favorite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(favorite.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <pre className="text-sm whitespace-pre-wrap font-mono">
                                {favorite.generated_content}
                              </pre>
                            </div>
                          </CardContent>
                          <CardFooter className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(favorite.generated_content)}
                              className="flex-1"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
