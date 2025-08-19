import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function PlansAdmin() {
  const { toast } = useToast();

  // plan_settings
  const [planSettings, setPlanSettings] = useState<Array<{ id: string; plan: string; monthly_credits: number; description: string | null }>>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // plan_agents_access
  const [agentRows, setAgentRows] = useState<Array<{ id: string; plan: string; agent_key: string; label: string | null }>>([]);
  const [newAgent, setNewAgent] = useState<{ plan: string; agent_key: string; label?: string }>({ plan: "Essencial", agent_key: "" });

  // plan_courses_access
  const [courseRows, setCourseRows] = useState<Array<{ id: string; plan: string; course_id: string }>>([]);
  const [newCourse, setNewCourse] = useState<{ plan: string; course_id: string }>({ plan: "Essencial", course_id: "" });

  const loadAll = async () => {
    try {
      setLoadingSettings(true);
      const [ps, agents, courses] = await Promise.all([
        supabase.from("plan_settings").select("id, plan, monthly_credits, description").order("plan", { ascending: true }),
        supabase.from("plan_agents_access").select("id, plan, agent_key, label").order("plan"),
        supabase.from("plan_courses_access").select("id, plan, course_id").order("plan"),
      ]);
      if (ps.error) throw ps.error;
      if (agents.error) throw agents.error;
      if (courses.error) throw courses.error;
      setPlanSettings(ps.data || []);
      setAgentRows(agents.data || []);
      setCourseRows(courses.data || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao carregar", description: e.message, variant: "destructive" });
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const savePlan = async (id: string, changes: Partial<{ monthly_credits: number; description: string }>) => {
    const { error } = await supabase.from("plan_settings").update(changes).eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plano atualizado" });
      await loadAll();
    }
  };

  const addAgent = async () => {
    if (!newAgent.agent_key) return;
    const { error } = await supabase.from("plan_agents_access").insert({ plan: newAgent.plan, agent_key: newAgent.agent_key, label: newAgent.label || null });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Agente vinculado" });
    setNewAgent({ plan: newAgent.plan, agent_key: "" });
    await loadAll();
  };

  const removeAgent = async (id: string) => {
    const { error } = await supabase.from("plan_agents_access").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Vínculo removido" });
    await loadAll();
  };

  const addCourse = async () => {
    if (!newCourse.course_id) return;
    const { error } = await supabase.from("plan_courses_access").insert({ plan: newCourse.plan, course_id: newCourse.course_id });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Curso vinculado" });
    setNewCourse({ plan: newCourse.plan, course_id: "" });
    await loadAll();
  };

  const removeCourse = async (id: string) => {
    const { error } = await supabase.from("plan_courses_access").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Vínculo removido" });
    await loadAll();
  };

  const knownPlans = useMemo(() => planSettings.map((p) => p.plan) as string[] || ["Essencial", "Premium", "Elite"], [planSettings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Planos e Acessos</h2>
        <p className="text-muted-foreground">Defina créditos e o que cada plano pode acessar.</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planSettings.map((ps) => (
              <Card key={ps.id}>
                <CardHeader>
                  <CardTitle>{ps.plan}</CardTitle>
                  <CardDescription>Defina créditos mensais e descrição.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Créditos mensais</Label>
                    <Input
                      type="number"
                      defaultValue={ps.monthly_credits}
                      onBlur={(e) => savePlan(ps.id, { monthly_credits: Number(e.currentTarget.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      defaultValue={ps.description ?? ""}
                      onBlur={(e) => savePlan(ps.id, { description: e.currentTarget.value })}
                    />
                  </div>
                  <Button onClick={() => savePlan(ps.id, { monthly_credits: ps.monthly_credits, description: ps.description ?? "" })}>
                    Salvar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Vincular Agentes IA aos Planos</CardTitle>
              <CardDescription>Defina quais agentes IA cada plano pode acessar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agentes Disponíveis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold text-primary">Agentes Disponíveis:</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>• <strong>vendas</strong> - Agente de Vendas</div>
                    <div>• <strong>storytelling</strong> - Agente de Storytelling</div>
                    <div>• <strong>viral</strong> - Agente Viral</div>
                    <div>• <strong>interacao</strong> - Agente de Interação</div>
                    <div>• <strong>conexao</strong> - Agente de Conexão</div>
                    <div>• <strong>banner</strong> - Agente de Banner</div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold text-primary">Planos Disponíveis:</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    {knownPlans.map((plan) => (
                      <div key={plan}>• <strong>{plan}</strong></div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold text-primary">Regra Atual:</h4>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Usuários gratuitos: apenas "vendas"<br/>
                    Planos pagos: conforme configurado abaixo
                  </div>
                </Card>
              </div>

              {/* Formulário de Adição */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-3">Vincular Novo Agente</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Plano</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newAgent.plan} 
                      onChange={(e) => setNewAgent((s) => ({ ...s, plan: e.target.value }))}
                    >
                      {knownPlans.map((plan) => (
                        <option key={plan} value={plan}>{plan}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Agente</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newAgent.agent_key} 
                      onChange={(e) => setNewAgent((s) => ({ ...s, agent_key: e.target.value }))}
                    >
                      <option value="">Selecione...</option>
                      <option value="vendas">Vendas</option>
                      <option value="storytelling">Storytelling</option>
                      <option value="viral">Viral</option>
                      <option value="interacao">Interação</option>
                      <option value="conexao">Conexão</option>
                      <option value="banner">Banner</option>
                    </select>
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Input 
                      placeholder="ex.: Agente de vendas"
                      value={newAgent.label || ''} 
                      onChange={(e) => setNewAgent((s) => ({ ...s, label: e.target.value }))} 
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addAgent} disabled={!newAgent.agent_key}>
                      Vincular
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Lista de Vínculos Atuais */}
              <div>
                <h4 className="font-semibold mb-3">Vínculos Configurados</h4>
                {agentRows.length === 0 && (
                  <Card className="p-4 text-center text-muted-foreground">
                    Nenhum agente vinculado ainda. Configure os agentes para cada plano acima.
                  </Card>
                )}
                <div className="space-y-2">
                  {agentRows.map((row) => (
                    <Card key={row.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">
                            {row.agent_key} → {row.plan}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {row.label || `Agente ${row.agent_key} disponível no plano ${row.plan}`}
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => removeAgent(row.id)}>
                          Remover
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Vincular cursos por plano</CardTitle>
              <CardDescription>Informe o UUID do curso para criar o vínculo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Plano</Label>
                  <Input list="plans2" value={newCourse.plan} onChange={(e) => setNewCourse((s) => ({ ...s, plan: e.currentTarget.value }))} />
                  <datalist id="plans2">
                    {knownPlans.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label>Course ID</Label>
                  <Input placeholder="uuid do curso" value={newCourse.course_id} onChange={(e) => setNewCourse((s) => ({ ...s, course_id: e.currentTarget.value }))} />
                </div>
                <div className="flex items-end">
                  <Button onClick={addCourse}>Adicionar</Button>
                </div>
              </div>

              <div className="space-y-2">
                {courseRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{row.course_id}</div>
                      <div className="text-sm text-muted-foreground">Plano: {row.plan}</div>
                    </div>
                    <Button variant="destructive" onClick={() => removeCourse(row.id)}>Remover</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
