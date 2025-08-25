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
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Treinamentos from "./pages/Treinamentos";
import Prompts from "./pages/Prompts";
import Comunidade from "./pages/Comunidade";
import Admin from "./pages/Admin";
import Vendas from "./pages/Vendas";
import CapturaEvento from "./pages/CapturaEvento";
import NotFound from "./pages/NotFound";
import { PlanGuard } from "@/components/PlanGuard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";

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
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <Admin />
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
