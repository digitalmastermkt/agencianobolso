import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Heart, 
  Zap, 
  MessageCircle, 
  Link as LinkIcon, 
  Image,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const agents = [
  {
    id: "vendas",
    name: "VENDAS",
    description: "Crie vídeos curtos persuasivos para vender produtos/serviços",
    icon: TrendingUp,
    style: "Bruno Ladeira (Ladeirinha)",
    features: ["Hook + Dor + Transformação", "Prova Social", "CTA Direto"],
    color: "from-emerald-500 to-teal-600",
    path: "/agentes/vendas"
  },
  {
    id: "storytelling", 
    name: "STORYTELLING",
    description: "Crie mini-roteiros com storytelling para conexão emocional",
    icon: Heart,
    style: "Leandro Aguiari",
    features: ["Abertura Emocional", "Microhistória", "Valores da Marca"],
    color: "from-pink-500 to-rose-600",
    path: "/agentes/storytelling"
  },
  {
    id: "viral",
    name: "VIRAL",
    description: "Crie vídeos curtos tipo Reels para viralizar",
    icon: Zap,
    style: "Camilo Coutinho",
    features: ["Hook Viral", "Timing de Cortes", "Hashtags Estratégicas"],
    color: "from-purple-500 to-violet-600",
    path: "/agentes/viral"
  },
  {
    id: "interacao",
    name: "INTERAÇÃO",
    description: "Crie sequência de stories provocativos para engajamento",
    icon: MessageCircle,
    style: "Rafael Bem",
    features: ["Stories Provocativos", "Enquetes e Perguntas", "Swipe e CTAs"],
    color: "from-blue-500 to-cyan-600",
    path: "/agentes/interacao"
  },
  {
    id: "conexao",
    name: "CONEXÃO",
    description: "Crie stories criativos que geram vínculo emocional",
    icon: LinkIcon,
    style: "Bastidores Autênticos",
    features: ["Bastidores", "Humanização", "Vínculo Emocional"],
    color: "from-orange-500 to-amber-600",
    path: "/agentes/conexao"
  },
  {
    id: "banner",
    name: "CRIADOR DE BANNER",
    description: "Crie posts visuais estilo banner para redes sociais",
    icon: Image,
    style: "Design Profissional",
    features: ["Copy Publicitária", "Prompt para IA", "Paleta de Cores"],
    color: "from-red-500 to-pink-600",
    path: "/agentes/banner"
  }
];

export default function Agentes() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-creative py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-float">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Agentes Criativos
              <span className="block text-2xl md:text-3xl font-normal mt-2 text-white/90">
                Powered by AI
              </span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              6 especialistas em IA para criar conteúdo viral, roteiros de vendas, 
              stories interativos e banners profissionais para suas redes sociais.
            </p>
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => {
              const IconComponent = agent.icon;
              return (
                <Card key={agent.id} className="group hover:shadow-card transition-all duration-300 border-0 bg-white/50 backdrop-blur-sm overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${agent.color}`}></div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${agent.color} text-white`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground">
                          {agent.name}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {agent.style}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {agent.description}
                    </CardDescription>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {agent.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
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
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Pronto para criar conteúdo viral?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Escolha o agente ideal para seu tipo de conteúdo e deixe a IA 
            criar roteiros profissionais em segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/treinamentos">
              <Button variant="outline" size="lg">
                Ver Treinamentos
              </Button>
            </Link>
            <Link to="/comunidade">
              <Button variant="creative" size="lg">
                Participar da Comunidade
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}