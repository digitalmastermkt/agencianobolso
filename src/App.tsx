import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { PlanGuard } from "@/components/PlanGuard";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { Loader2 } from "lucide-react";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load all other pages
const Install = lazy(() => import("./pages/Install"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Agentes = lazy(() => import("./pages/Agentes"));
const AgenteVendas = lazy(() => import("./pages/agents/AgenteVendas"));
const AgenteStorytelling = lazy(() => import("./pages/agents/AgenteStorytelling"));
const AgenteViral = lazy(() => import("./pages/agents/AgenteViral"));
const AgenteInteracao = lazy(() => import("./pages/agents/AgenteInteracao"));
const AgenteConexao = lazy(() => import("./pages/agents/AgenteConexao"));
const AgenteDiretorArte = lazy(() => import("./pages/agents/AgenteDiretorArte"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Treinamentos = lazy(() => import("./pages/Treinamentos"));
const CourseView = lazy(() => import("./pages/CourseView"));
const Prompts = lazy(() => import("./pages/Prompts"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
const AdminTrainings = lazy(() => import("./pages/admin/AdminTrainings"));
const AdminPrompts = lazy(() => import("./pages/admin/AdminPrompts"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminStripe = lazy(() => import("./pages/admin/AdminStripe"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const Vendas = lazy(() => import("./pages/Vendas"));
const CapturaEvento = lazy(() => import("./pages/CapturaEvento"));
const Obrigado = lazy(() => import("./pages/Obrigado"));
const ListaEspera = lazy(() => import("./pages/ListaEspera"));
const ObrigadoListaEspera = lazy(() => import("./pages/ObrigadoListaEspera"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAUpdatePrompt />
      <PWAInstallPrompt />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/install" element={<Install />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/evento" element={<CapturaEvento />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="/lista-espera" element={<ListaEspera />} />
          <Route path="/obrigado-lista" element={<ObrigadoListaEspera />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/agentes" element={
            <ProtectedRoute>
              <Agentes />
            </ProtectedRoute>
          } />
          <Route path="/agentes/vendas" element={
            <ProtectedRoute>
              <PlanGuard agentKey="vendas">
                <AgenteVendas />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/agentes/storytelling" element={
            <ProtectedRoute>
              <PlanGuard agentKey="storytelling">
                <AgenteStorytelling />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/agentes/viral" element={
            <ProtectedRoute>
              <PlanGuard agentKey="viral">
                <AgenteViral />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/agentes/interacao" element={
            <ProtectedRoute>
              <PlanGuard agentKey="interacao">
                <AgenteInteracao />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/agentes/conexao" element={
            <ProtectedRoute>
              <PlanGuard agentKey="conexao">
                <AgenteConexao />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/agentes/banner" element={<Navigate to="/agentes/diretor-arte" replace />} />
          <Route path="/agentes/diretor-arte" element={
            <ProtectedRoute>
              <PlanGuard agentKey="diretor-arte">
                <AgenteDiretorArte />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/treinamentos" element={
            <ProtectedRoute>
              <Treinamentos />
            </ProtectedRoute>
          } />
          <Route path="/curso/:courseId" element={
            <ProtectedRoute>
              <CourseView />
            </ProtectedRoute>
          } />
          <Route path="/prompts" element={
            <ProtectedRoute>
              <PlanGuard requiredPlan="Essencial">
                <Prompts />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/comunidade" element={
            <ProtectedRoute>
              <PlanGuard requiredPlan="Essencial">
                <Comunidade />
              </PlanGuard>
            </ProtectedRoute>
          } />
          <Route path="/favoritos" element={
            <ProtectedRoute>
              <Favoritos />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={<Navigate to="/admin/trainings" replace />} />
          <Route path="/admin/trainings" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminTrainings />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/prompts" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPrompts />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/plans" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPlans />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminEvents />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/stripe" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminStripe />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminAuditLogs />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/success" element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          } />
          <Route path="/cancel" element={
            <ProtectedRoute>
              <PaymentCanceled />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
