import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionPanel } from "@/components/subscriptions/SubscriptionPanel";
import { Link } from "react-router-dom";
import hero from "@/assets/sparkagen-hero.jpg";
import {
  Sparkles,
  Crown,
  Star,
  ShieldCheck,
  Timer,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

const canonicalUrl = () => `${window.location.origin}/vendas`;

const Vendas = () => {
  // Basic SEO (title, description, canonical, structured data)
  useEffect(() => {
    const title = "Planos Agência no Bolso AI – Essencial, Premium e Elite";
    const description =
      "Conheça os planos Essencial, Premium e Elite da Agência no Bolso AI. Veja tudo incluso e assine agora para liberar agentes de IA, treinamentos e comunidade.";

    document.title = title;

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("description", description);

    // Canonical
    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.rel = "canonical";
      document.head.appendChild(linkEl);
    }
    linkEl.href = canonicalUrl();

    // Structured data
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Planos Agência no Bolso AI",
      itemListElement: [
        {
          "@type": "Product",
          name: "Plano Essencial",
          description:
            "Agentes Conexão, Interação e Banner + acesso à plataforma e recursos fundamentais.",
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: "29.00",
            availability: "https://schema.org/InStock",
          },
        },
        {
          "@type": "Product",
          name: "Plano Premium",
          description:
            "Tudo do Essencial + agentes Vendas e Storytelling, mais recursos para crescimento.",
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: "59.00",
            availability: "https://schema.org/InStock",
          },
        },
        {
          "@type": "Product",
          name: "Plano Elite",
          description:
            "Tudo do Premium + agente Viral e acesso antecipado a novos agentes.",
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: "97.00",
            availability: "https://schema.org/InStock",
          },
        },
      ],
    });
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <Layout>
      <header>
        {/* Hero - A de AIDA (Atenção) */}
        <section className="relative overflow-hidden bg-gradient-creative">
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
          <img
            src={hero}
            alt="Crie conteúdos que vendem com IA – Agência no Bolso AI"
            className="w-full h-[460px] object-cover opacity-60"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl text-white">
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  Transforme seguidores em clientes com agentes de IA sob medida
                </h1>
                <p className="mt-4 text-lg md:text-xl text-white/90">
                  Crie roteiros, banners e conteúdos que convertem em minutos. Sem bloqueio criativo.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="#planos">
                    <Button size="lg" variant="creative">
                      <Sparkles className="w-5 h-5 mr-2" /> Escolher meu plano
                    </Button>
                  </Link>
                  <Link to="/agentes">
                    <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                      Ver agentes em ação
                    </Button>
                  </Link>
                </div>
                <div className="mt-6 flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Garantia de satisfação
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5" /> Resultados em minutos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </header>

      <main>
        {/* I de AIDA (Interesse) */}
        <section className="py-16 bg-gradient-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Agentes que entendem seu nicho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  Conte com 6 especialistas IA: Vendas, Storytelling, Viral, Interação, Conexão e Banner.
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" /> Roteiros e criativos prontos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  Receba textos, scripts e ideias estruturadas com ganchos, CTA e variações.
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Feito para vender
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  Aplique gatilhos mentais, AIDA e copy de alta conversão nos seus conteúdos.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* D de AIDA (Desejo) - Comparativo de Planos */}
        <section id="planos" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Escolha o plano ideal</h2>
              <p className="text-muted-foreground mt-2">Veja tudo que está incluso em cada plano</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Essencial */}
              <Card className="relative border-0">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">Comece agora</Badge>
                  <CardTitle className="mt-2 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" /> Essencial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Agentes: Conexão, Interação e Banner",
                      "Promptoteca básica",
                      "Treinamentos introdutórios",
                      "Comunidade (leitura)",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Premium */}
              <Card className="relative border-0 ring-2 ring-primary/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs bg-primary text-primary-foreground">Mais popular</span>
                </div>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">Cresça com consistência</Badge>
                  <CardTitle className="mt-2 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" /> Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Tudo do Essencial",
                      "Agentes: Vendas e Storytelling",
                      "Promptoteca completa",
                      "Treinamentos intermediários",
                      "Comunidade (postar e interagir)",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Elite */}
              <Card className="relative border-0">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">Para quem quer liderar</Badge>
                  <CardTitle className="mt-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Elite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Tudo do Premium",
                      "Agente Viral",
                      "Acesso antecipado a novos agentes",
                      "Treinamentos avançados",
                      "Suporte prioritário",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-10">
              <Link to="#assinatura">
                <Button size="lg" variant="gradient">Quero assinar agora</Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">Sem fidelidade. Cancele quando quiser.</p>
            </div>
          </div>
        </section>

        {/* A de AIDA (Ação) - Painel de Assinatura */}
        <section id="assinatura" className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SubscriptionPanel />
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Vendas;
