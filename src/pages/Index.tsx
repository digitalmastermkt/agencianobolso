import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  BookOpen, 
  ArrowRight,
  Zap,
  Heart,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-creative py-20 lg:py-32">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-float">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                  SparkAgen AI
                  <span className="block text-2xl md:text-3xl lg:text-4xl font-normal mt-4 text-white/90">
                    Criatividade Inteligente para Negócios Locais
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-10 leading-relaxed">
                  Plataforma criativa de IA com agentes especializados em vídeos curtos, 
                  stories, banners e engajamento direto nas redes sociais.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/agentes">
                  <Button variant="creative" size="xl" className="animate-glow">
                    <Sparkles className="w-6 h-6 mr-3" />
                    Começar Agora
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </Link>
                <Link to="/treinamentos">
                  <Button variant="outline" size="xl" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <BookOpen className="w-6 h-6 mr-3" />
                    Ver Treinamentos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                6 Agentes Especializados
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Cada agente é um roteirista IA independente, especializado em diferentes tipos de conteúdo criativo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Agent Cards */}
              <Card className="group hover:shadow-card transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">VENDAS</CardTitle>
                      <Badge variant="secondary" className="mt-1">Bruno Ladeira Style</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Vídeos persuasivos com hook + dor + transformação + CTA direto
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-card transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">STORYTELLING</CardTitle>
                      <Badge variant="secondary" className="mt-1">Leandro Aguiari Style</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Mini-roteiros com storytelling para conexão emocional profunda
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-card transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-white">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">VIRAL</CardTitle>
                      <Badge variant="secondary" className="mt-1">Camilo Coutinho Style</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Conteúdo tipo Reels com timing perfeito para viralizar
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-card transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">INTERAÇÃO</CardTitle>
                      <Badge variant="secondary" className="mt-1">Rafael Bem Style</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Stories provocativos com enquetes, perguntas e swipes
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-card transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">CONEXÃO</CardTitle>
                      <Badge variant="secondary" className="mt-1">Bastidores Autênticos</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Stories de bastidores que humanizam e criam vínculo emocional
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-card transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">BANNER</CardTitle>
                      <Badge variant="secondary" className="mt-1">Design Profissional</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Banners profissionais com copy + prompt para geração de imagem
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Link to="/agentes">
                <Button variant="gradient" size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Explorar Todos os Agentes
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Plataforma Completa
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Mais que agentes IA - uma experiência completa para criadores e negócios locais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Treinamentos</h3>
                <p className="text-muted-foreground">
                  Cursos completos sobre marketing digital, criação de conteúdo e uso dos agentes IA.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Comunidade</h3>
                <p className="text-muted-foreground">
                  Feed colaborativo para compartilhar criações, dicas e inspirações com outros criadores.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Promptoteca</h3>
                <p className="text-muted-foreground">
                  Biblioteca com centenas de prompts organizados por categoria: Marketing, Criativo, Técnico, Vídeo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Transforme sua criatividade em resultados
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Junte-se a milhares de criadores e negócios que já estão usando IA 
              para criar conteúdo profissional e viral.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/agentes">
                <Button variant="creative" size="xl">
                  <Zap className="w-6 h-6 mr-3" />
                  Começar Gratuitamente
                </Button>
              </Link>
              <Link to="/comunidade">
                <Button variant="outline" size="xl">
                  <Users className="w-6 h-6 mr-3" />
                  Ver Comunidade
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
