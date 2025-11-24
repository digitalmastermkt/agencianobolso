import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Agentes from "./pages/Agentes";
import AgenteVendas from "./pages/agents/AgenteVendas";
import AgenteStorytelling from "./pages/agents/AgenteStorytelling";
import AgenteViral from "./pages/agents/AgenteViral";
import AgenteInteracao from "./pages/agents/AgenteInteracao";
import AgenteConexao from "./pages/agents/AgenteConexao";
import AgenteBanner from "./pages/agents/AgenteBanner";
import Favoritos from "./pages/Favoritos";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Treinamentos from "./pages/Treinamentos";
import CourseView from "./pages/CourseView";
import Prompts from "./pages/Prompts";
import Comunidade from "./pages/Comunidade";
import Admin from "./pages/Admin";
import AdminTrainings from "./pages/admin/AdminTrainings";
import AdminPrompts from "./pages/admin/AdminPrompts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminStripe from "./pages/admin/AdminStripe";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import Vendas from "./pages/Vendas";
import CapturaEvento from "./pages/CapturaEvento";
import Obrigado from "./pages/Obrigado";
import NotFound from "./pages/NotFound";
import { PlanGuard } from "@/components/PlanGuard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/evento" element={<CapturaEvento />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="/auth" element={<Auth />} />
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
          <Route path="/agentes/banner" element={
            <ProtectedRoute>
              <PlanGuard agentKey="banner">
                <AgenteBanner />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
