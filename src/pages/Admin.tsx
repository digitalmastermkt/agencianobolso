import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, FileText, Users, BarChart3 } from "lucide-react";
import { CreateTrainingForm } from "@/components/admin/CreateTrainingForm";
import { CreatePromptForm } from "@/components/admin/CreatePromptForm";
import { CreateCourseForm } from "@/components/admin/CreateCourseForm";
import { CreateModuleForm } from "@/components/admin/CreateModuleForm";
import { CreateLessonForm } from "@/components/admin/CreateLessonForm";

const AdminTrainings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Conteúdo Educacional</h2>
        <p className="text-muted-foreground">Crie e gerencie cursos, módulos e aulas da plataforma.</p>
      </div>
      
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="lessons">Aulas</TabsTrigger>
          <TabsTrigger value="legacy">Treinamentos Legacy</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Total de Cursos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">8</div>
                  <p className="text-sm text-muted-foreground">5 publicados, 3 rascunhos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Inscrições
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">234</div>
                  <p className="text-sm text-muted-foreground">Total de inscrições</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Taxa de Conclusão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">78%</div>
                  <p className="text-sm text-muted-foreground">Média geral</p>
                </CardContent>
              </Card>
            </div>
            <CreateCourseForm />
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Módulos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">24</div>
                  <p className="text-sm text-muted-foreground">Distribuídos em 8 cursos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Módulos Publicados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">18</div>
                  <p className="text-sm text-muted-foreground">6 em rascunho</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Média por Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">3</div>
                  <p className="text-sm text-muted-foreground">Módulos por curso</p>
                </CardContent>
              </Card>
            </div>
            <CreateModuleForm />
          </div>
        </TabsContent>

        <TabsContent value="lessons">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Aulas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">156</div>
                  <p className="text-sm text-muted-foreground">Distribuídas em 24 módulos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Duração Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">42h</div>
                  <p className="text-sm text-muted-foreground">Conteúdo disponível</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Média por Módulo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">6.5</div>
                  <p className="text-sm text-muted-foreground">Aulas por módulo</p>
                </CardContent>
              </Card>
            </div>
            <CreateLessonForm />
          </div>
        </TabsContent>

        <TabsContent value="legacy">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Treinamentos Legacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-sm text-muted-foreground">Sistema anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Migração Pendente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">4</div>
                  <p className="text-sm text-muted-foreground">Para nova estrutura</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Já Migrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">8</div>
                  <p className="text-sm text-muted-foreground">Convertidos para cursos</p>
                </CardContent>
              </Card>
            </div>
            <CreateTrainingForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminPrompts = () => {
  return (
    <div className="space-y-6">
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
            <div className="text-3xl font-bold">89</div>
            <p className="text-sm text-muted-foreground">67 publicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-muted-foreground">Categorias ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <p className="text-sm text-muted-foreground">Cópias este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42</div>
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
  );
};

const AdminUsers = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Usuários</h2>
        <p className="text-muted-foreground">Administre os usuários da plataforma.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <p className="text-sm text-muted-foreground">+12% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">892</div>
            <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">23</div>
            <p className="text-sm text-muted-foreground">Novos registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Engajamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">67%</div>
            <p className="text-sm text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Recentes</CardTitle>
          <CardDescription>Últimos usuários registrados na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { email: "joao@email.com", date: "Hoje", status: "Ativo" },
              { email: "maria@email.com", date: "Ontem", status: "Ativo" },
              { email: "pedro@email.com", date: "2 dias", status: "Inativo" }
            ].map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{user.email}</h4>
                  <p className="text-sm text-muted-foreground">Registrado há {user.date}</p>
                </div>
                <Badge variant={user.status === "Ativo" ? "default" : "secondary"}>
                  {user.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Admin() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Área Administrativa</h1>
          <p className="text-muted-foreground">
            Gerencie treinamentos, prompts e usuários da plataforma.
          </p>
        </div>

        <Tabs defaultValue="trainings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="trainings">
            <AdminTrainings />
          </TabsContent>

          <TabsContent value="prompts">
            <AdminPrompts />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}