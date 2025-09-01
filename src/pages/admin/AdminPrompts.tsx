import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { CreatePromptForm } from "@/components/admin/CreatePromptForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminPrompts() {
  const [promptStats, setPromptStats] = useState({
    totalPrompts: 0,
    publishedPrompts: 0,
    categories: 0,
    totalTags: 0
  });

  useEffect(() => {
    const fetchPromptStats = async () => {
      try {
        const { data: prompts } = await supabase.from("prompts").select("is_published, category, tags");
        const published = prompts?.filter(p => p.is_published) || [];
        const categories = new Set(prompts?.map(p => p.category).filter(Boolean)).size;
        const allTags = prompts?.flatMap(p => p.tags || []).filter(Boolean) || [];
        const uniqueTags = new Set(allTags).size;

        setPromptStats({
          totalPrompts: prompts?.length || 0,
          publishedPrompts: published.length,
          categories,
          totalTags: uniqueTags
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas de prompts:', error);
      }
    };

    fetchPromptStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gerenciar Prompts</h2>
          <p className="text-muted-foreground">Administre a biblioteca de prompts da plataforma.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Total de Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{promptStats.totalPrompts}</div>
              <p className="text-sm text-muted-foreground">{promptStats.publishedPrompts} publicados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{promptStats.categories}</div>
              <p className="text-sm text-muted-foreground">Categorias ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{promptStats.publishedPrompts}</div>
              <p className="text-sm text-muted-foreground">Prompts ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{promptStats.totalTags}</div>
              <p className="text-sm text-muted-foreground">Tags únicas</p>
            </CardContent>
          </Card>
        </div>

        <CreatePromptForm />

        <Card>
          <CardHeader>
            <CardTitle>Prompts por Categoria</CardTitle>
            <CardDescription>Distribuição dos prompts por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { category: "Marketing", count: 23, color: "bg-blue-500" },
                { category: "Vendas", count: 18, color: "bg-green-500" },
                { category: "Criativo", count: 15, color: "bg-purple-500" },
                { category: "Técnico", count: 12, color: "bg-orange-500" },
                { category: "Educacional", count: 9, color: "bg-pink-500" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="flex-1">{item.category}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}