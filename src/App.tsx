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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/agentes" element={
            <ProtectedRoute>
              <Agentes />
            </ProtectedRoute>
          } />
          <Route path="/agentes/vendas" element={
            <ProtectedRoute>
              <AgenteVendas />
            </ProtectedRoute>
          } />
          <Route path="/agentes/storytelling" element={
            <ProtectedRoute>
              <AgenteStorytelling />
            </ProtectedRoute>
          } />
          <Route path="/agentes/viral" element={
            <ProtectedRoute>
              <AgenteViral />
            </ProtectedRoute>
          } />
          <Route path="/agentes/interacao" element={
            <ProtectedRoute>
              <AgenteInteracao />
            </ProtectedRoute>
          } />
          <Route path="/agentes/conexao" element={
            <ProtectedRoute>
              <AgenteConexao />
            </ProtectedRoute>
          } />
          <Route path="/agentes/banner" element={
            <ProtectedRoute>
              <AgenteBanner />
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
              <Prompts />
            </ProtectedRoute>
          } />
          <Route path="/comunidade" element={
            <ProtectedRoute>
              <Comunidade />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <Admin />
              </AdminRoute>
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
