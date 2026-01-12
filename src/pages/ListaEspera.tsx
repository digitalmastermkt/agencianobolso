import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Users, 
  Rocket, 
  Gift, 
  CheckCircle2,
  Loader2,
  MessageCircle
} from 'lucide-react';

export default function ListaEspera() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Sanitização de input
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .slice(0, 500);
  };

  // Formatar WhatsApp
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar WhatsApp brasileiro
  const isValidWhatsApp = (whatsapp: string): boolean => {
    const numbers = whatsapp.replace(/\D/g, '');
    return numbers.length === 10 || numbers.length === 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check - se preenchido, é bot
    if (honeypot) {
      toast({
        title: "Erro de validação",
        description: "Falha na verificação de segurança.",
        variant: "destructive",
      });
      return;
    }

    // Validações
    const sanitizedNome = sanitizeInput(nome);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedWhatsapp = whatsapp.replace(/\D/g, '');

    if (!sanitizedNome || sanitizedNome.length < 2) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidWhatsApp(whatsapp)) {
      toast({
        title: "WhatsApp inválido",
        description: "Por favor, insira um número de WhatsApp válido com DDD.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar rate limit
      const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_leads_rate_limit', {
        max_per_hour: 3
      });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
      }

      if (rateLimitOk === false) {
        toast({
          title: "Muitas tentativas",
          description: "Você atingiu o limite de cadastros. Tente novamente mais tarde.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Inserir lead
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          nome: sanitizedNome,
          email: sanitizedEmail,
          whatsapp: sanitizedWhatsapp,
          campanha: 'lista-espera',
          origem: 'landing-page'
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast({
          title: "Erro ao cadastrar",
          description: "Ocorreu um erro ao processar seu cadastro. Tente novamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Log de segurança
      await supabase.rpc('log_security_event', {
        p_action: 'lead_created',
        p_table_name: 'leads',
        p_new_values: { campanha: 'lista-espera', origem: 'landing-page' }
      });

      // Sucesso - redirecionar para página de obrigado
      toast({
        title: "Cadastro realizado!",
        description: "Você foi adicionado à lista de espera.",
      });

      navigate('/obrigado-lista');

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const beneficios = [
    {
      icon: Rocket,
      title: "Acesso Antecipado",
      description: "Seja o primeiro a conhecer as novidades e lançamentos exclusivos."
    },
    {
      icon: Gift,
      title: "Benefícios Exclusivos",
      description: "Condições especiais e bônus apenas para quem está na lista."
    },
    {
      icon: Users,
      title: "Comunidade VIP",
      description: "Faça parte de um grupo seleto de empreendedores visionários."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.08),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Lista de Espera Exclusiva
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Garanta Seu Lugar na{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Revolução do Marketing Digital
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Entre para a lista de espera e seja o primeiro a ter acesso às ferramentas 
            de IA que vão transformar seu negócio. Vagas limitadas!
          </p>

          {/* Formulário */}
          <Card className="max-w-md mx-auto border-primary/20 shadow-xl shadow-primary/5">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot - escondido */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="absolute -left-[9999px] opacity-0"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="space-y-2 text-left">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                    required
                    className="h-12"
                    maxLength={16}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Quero Entrar na Lista
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  🔒 Seus dados estão seguros. Não enviamos spam.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="px-4 py-16 md:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Por que entrar na lista de espera?
          </h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {beneficios.map((beneficio, index) => (
              <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                    <beneficio.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {beneficio.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {beneficio.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 mb-8">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">+500 pessoas já estão na lista</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Junte-se a centenas de empreendedores
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Profissionais de marketing, agências e empreendedores que já estão 
            preparados para o futuro do marketing digital com IA.
          </p>

          {/* Depoimentos estilo WhatsApp */}
          <div className="space-y-4 max-w-md mx-auto">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl rounded-tl-sm p-4 text-left">
              <p className="text-foreground text-sm">
                "Estou ansioso para ter acesso! O que já vi da plataforma é incrível. 🚀"
              </p>
              <span className="text-xs text-muted-foreground mt-2 block">— @marketingpro</span>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl rounded-tl-sm p-4 text-left">
              <p className="text-foreground text-sm">
                "Finalmente uma ferramenta que vai automatizar meu trabalho de criação! 💪"
              </p>
              <span className="text-xs text-muted-foreground mt-2 block">— @agenciadigital</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 py-16 md:py-20 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Não fique de fora!
          </h2>
          <p className="text-muted-foreground mb-8">
            As vagas são limitadas. Garanta seu lugar agora e seja avisado em primeira mão 
            quando abrirmos as inscrições.
          </p>
          <Button 
            size="lg" 
            className="h-14 px-8 text-base font-semibold"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Quero Garantir Minha Vaga
          </Button>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="px-4 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Agência no Bolso. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
