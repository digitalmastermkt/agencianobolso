import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Heart, 
  Zap, 
  MessageCircle, 
  Link as LinkIcon, 
  Image,
  ArrowRight,
  BarChart3,
  Clock,
  Target,
  Sparkles
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPanel } from "@/components/subscriptions/SubscriptionPanel";

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

  const agents = [
    {
      id: "vendas",
      name: "VENDAS",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      path: "/agentes/vendas"
    },
    {
      id: "storytelling", 
      name: "STORYTELLING",
      icon: Heart,
      color: "from-pink-500 to-rose-600",
      path: "/agentes/storytelling"
    },
    {
      id: "viral",
      name: "VIRAL",
      icon: Zap,
      color: "from-purple-500 to-violet-600",
      path: "/agentes/viral"
    },
    {
      id: "interacao",
      name: "INTERAÇÃO",
      icon: MessageCircle,
      color: "from-blue-500 to-cyan-600",
      path: "/agentes/interacao"
    },
    {
      id: "conexao",
      name: "CONEXÃO",
      icon: LinkIcon,
      color: "from-orange-500 to-amber-600",
      path: "/agentes/conexao"
    },
    {
      id: "banner",
      name: "CRIADOR DE BANNER",
      icon: Image,
      color: "from-red-500 to-pink-600",
      path: "/agentes/banner"
    }
  ];

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

          {/* Agents Grid with Stats */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Seus Agentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentStats.map((agent) => {
                const IconComponent = agent.icon;
                const progressValue = totalGenerations > 0 ? (agent.usageCount / totalGenerations) * 100 : 0;
                
                return (
                  <Card key={agent.id} className="group hover:shadow-card transition-all duration-300">
                    <div className={`h-2 bg-gradient-to-r ${agent.color}`}></div>
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${agent.color} text-white`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                              {agent.name}
                            </CardTitle>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {agent.usageCount} usos
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Uso relativo</span>
                          <span className="font-medium">{Math.round(progressValue)}%</span>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Último uso: {formatDate(agent.lastUsed)}
                      </div>

                      <Link to={agent.path} className="block">
                        <Button 
                          className="w-full group-hover:shadow-glow transition-all duration-300"
                          variant="gradient"
                        >
                          Usar Agente
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                  <Button variant="outline" className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ver Todos os Agentes
                  </Button>
                </Link>
                <Link to="/agentes/vendas">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Criar Vídeo de Vendas
                  </Button>
                </Link>
                <Link to="/agentes/viral">
                  <Button variant="outline" className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Conteúdo Viral
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