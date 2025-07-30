import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Copy, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
}

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    filterPrompts();
  }, [prompts, searchTerm, selectedCategory]);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPrompts(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(prompt => prompt.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Erro ao carregar prompts:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar prompts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPrompts = () => {
    let filtered = prompts;

    if (searchTerm) {
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory);
    }

    setFilteredPrompts(filtered);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copiado!",
        description: "Prompt copiado para a área de transferência."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar prompt.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Carregando prompts...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Biblioteca de Prompts</h1>
          <p className="text-muted-foreground">
            Explore nossa coleção de prompts otimizados para diferentes necessidades.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Nenhum prompt encontrado com os filtros aplicados."
                  : "Nenhum prompt disponível no momento."
                }
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{prompt.title}</CardTitle>
                    <Badge variant="secondary">{prompt.category}</Badge>
                  </div>
                  {prompt.description && (
                    <CardDescription className="line-clamp-3">
                      {prompt.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="bg-muted/50 p-3 rounded-md mb-4">
                    <p className="text-sm line-clamp-3 text-muted-foreground">
                      {prompt.content}
                    </p>
                  </div>

                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {prompt.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{prompt.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => copyToClipboard(prompt.content)}
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Prompt
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}