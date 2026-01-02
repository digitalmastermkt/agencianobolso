import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Palette,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPanel } from "@/components/subscriptions/SubscriptionPanel";
import { TrialStatusCard } from "@/components/TrialStatusCard";
import { useAgentAvailability } from "@/hooks/useAgentAvailability";

interface AgentStats {
  id: string;
  name: string;
  icon: any;
  color: string;
  path: string;
  usageCount: number;
  lastUsed: string | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { isAvailable, loading: availabilityLoading } = useAgentAvailability();
  
  const agents = [
    {
      id: "diretor-arte",
      name: "DIRETOR DE ARTE",
      icon: Palette,
      color: "from-violet-500 to-purple-600",
      path: "/agentes/diretor-arte",
      style: "Artes com IA"
    }
  ];

  // Filter only available agents
  const availableAgents = agents.filter(agent => isAvailable(agent.id));

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadAgentStats();
    }
  }, [user]);

  const loadAgentStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('agent_type, created_at')
        .eq('user_id', user?.id);

      if (error) throw error;

      const statsMap = new Map();
      let total = 0;

      // Initialize all agents with zero usage
      agents.forEach(agent => {
        statsMap.set(agent.id, {
          ...agent,
          usageCount: 0,
          lastUsed: null
        });
      });

      // Count usage for each agent
      data?.forEach(generation => {
        const agentId = generation.agent_type.toLowerCase();
        if (statsMap.has(agentId)) {
          const current = statsMap.get(agentId);
          current.usageCount += 1;
          if (!current.lastUsed || generation.created_at > current.lastUsed) {
            current.lastUsed = generation.created_at;
          }
        }
        total += 1;
      });

      setAgentStats(Array.from(statsMap.values()));
      setTotalGenerations(total);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca usado";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getMostUsedAgent = () => {
    return agentStats.reduce((prev, current) => 
      (prev.usageCount > current.usageCount) ? prev : current
    );
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const mostUsedAgent = getMostUsedAgent();
  const highlightSubscription = searchParams.get('tab') === 'subscription';

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta, {user?.email}
            </p>
          </div>

          <div className={highlightSubscription ? "ring-2 ring-primary rounded-lg p-1 mb-4" : ""}>
            <SubscriptionPanel />
          </div>

          {/* Trial Status */}
          <div className="mb-6">
            <TrialStatusCard />
          </div>

          {/* Featured Agent - Diretor de Arte */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-foreground">Agente Disponível</h2>
            </div>
            
            <Card className="group hover:shadow-neon hover:scale-[1.01] transition-all duration-300 ring-2 ring-primary/20 bg-gradient-to-br from-violet-500/5 to-purple-600/5">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600"></div>
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                      <Palette className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        DIRETOR DE ARTE
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Artes com IA</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 animate-pulse">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  Crie artes profissionais com IA que parecem feitas por um designer experiente. 
                  Templates inteligentes, tipografia premium e paletas de cores harmoniosas.
                </CardDescription>

                <div className="flex flex-wrap gap-2">
                  {["Template Inteligente", "Tipografia", "Paleta de Cores", "CTA Otimizado"].map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <Link to="/agentes/diretor-arte" className="block">
                  <Button 
                    className="w-full group-hover:shadow-glow transition-all duration-300"
                    variant="gradient"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Criar Arte Agora
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/agentes">
                  <Button variant="outline" className="w-full hover:scale-[1.02] transition-transform">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ver Todos os Agentes
                  </Button>
                </Link>
                <Link to="/agentes/diretor-arte">
                  <Button variant="gradient" className="w-full hover:scale-[1.02] transition-transform">
                    <Palette className="w-4 h-4 mr-2" />
                    Criar Arte com IA
                  </Button>
                </Link>
                <Link to="/treinamentos">
                  <Button variant="outline" className="w-full hover:scale-[1.02] transition-transform">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ver Treinamentos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}