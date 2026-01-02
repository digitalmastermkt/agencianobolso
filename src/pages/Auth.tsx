import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, Mail, Lock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useFormSecurity } from "@/hooks/useFormSecurity";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { sanitizeInput, logSecurityEvent, validateInputSafety, logAuthAttempt, checkAuthSecurity } = useFormSecurity({
    formName: 'authentication',
    validateInputSafety: true
  });

  // Pega a rota de onde o usuário veio (se foi redirecionado)
  const from = location.state?.from || "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Erro ao fazer login com Google",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeInput(loginData.email);
    const sanitizedPassword = loginData.password; // Don't sanitize password too much
    
    if (!validateInputSafety(sanitizedEmail)) {
      toast({
        title: "Entrada inválida",
        description: "Email contém caracteres não permitidos.",
        variant: "destructive"
      });
      await logSecurityEvent('login_attempt_invalid_input', {
        email: sanitizedEmail
      });
      return;
    }

    // Check auth security (rate limiting and suspicious activity)
    const authSecurityPassed = await checkAuthSecurity(sanitizedEmail);
    if (!authSecurityPassed) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword
      });

      if (error) {
        // Log failed login attempt
        await logAuthAttempt(sanitizedEmail, false, error.message);
        throw error;
      }

      // Log successful login attempt
      await logAuthAttempt(sanitizedEmail, true);
      await logSecurityEvent('login_success', {
        email: sanitizedEmail
      });

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta à Agência no Bolso."
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      await logSecurityEvent('login_failure', {
        email: sanitizedEmail,
        error: error.message
      });
      
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = sanitizeInput(resetEmail);
    
    if (!validateInputSafety(sanitizedEmail)) {
      toast({
        title: "Entrada inválida",
        description: "Email contém caracteres não permitidos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      await logSecurityEvent('password_reset_requested', { email: sanitizedEmail });

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha."
      });
      
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar email de recuperação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeInput(signupData.email);
    const sanitizedPassword = signupData.password; // Don't sanitize password too much
    
    if (!validateInputSafety(sanitizedEmail)) {
      toast({
        title: "Entrada inválida",
        description: "Email contém caracteres não permitidos.",
        variant: "destructive"
      });
      await logSecurityEvent('signup_attempt_invalid_input', {
        email: sanitizedEmail
      });
      return;
    }
    
    if (sanitizedPassword !== signupData.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    // Enhanced password validation
    if (sanitizedPassword.length < 8) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive"
      });
      return;
    }

    // Check auth security (rate limiting and suspicious activity)
    const authSecurityPassed = await checkAuthSecurity(sanitizedEmail);
    if (!authSecurityPassed) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        // Log failed signup attempt
        await logAuthAttempt(sanitizedEmail, false, error.message);
        throw error;
      }

      // Log successful signup attempt
      await logAuthAttempt(sanitizedEmail, true);
      await logSecurityEvent('signup_success', {
        email: sanitizedEmail
      });

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta."
      });
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      await logSecurityEvent('signup_failure', {
        email: sanitizedEmail,
        error: error.message
      });
      
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-gradient-creative text-white shadow-glow">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Acesse Agência no Bolso
            </h1>
            <p className="text-muted-foreground">
              Sua plataforma de criação com IA
            </p>
            <Badge className="mt-2 bg-green-500/10 text-green-600 border-green-500/30">
              ✓ 1 Agente Disponível
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Faça seu login</CardTitle>
              <CardDescription>
                Acesse seus agentes e continue criando conteúdo viral
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google Login */}
              <div className="mb-6">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com email
                  </span>
                </div>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                          placeholder="seu@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                      variant="gradient"
                    >
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="w-full text-sm text-primary hover:underline mt-2"
                    >
                      Esqueci minha senha
                    </button>
                  </form>

                  {showResetPassword && (
                    <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                      <h3 className="font-medium mb-2">Recuperar senha</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Digite seu email para receber um link de recuperação.
                      </p>
                      <form onSubmit={handleResetPassword} className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="pl-10"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowResetPassword(false);
                              setResetEmail("");
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                          >
                            {loading ? "Enviando..." : "Enviar"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupData.email}
                          onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                          placeholder="seu@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          value={signupData.password}
                          onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                      variant="gradient"
                    >
                      {loading ? "Cadastrando..." : "Criar Conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}