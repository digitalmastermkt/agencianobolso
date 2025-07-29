import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Route path="/agentes" element={<Agentes />} />
          <Route path="/agentes/vendas" element={<AgenteVendas />} />
          <Route path="/agentes/storytelling" element={<AgenteStorytelling />} />
          <Route path="/agentes/viral" element={<AgenteViral />} />
          <Route path="/agentes/interacao" element={<AgenteInteracao />} />
          <Route path="/agentes/conexao" element={<AgenteConexao />} />
          <Route path="/agentes/banner" element={<AgenteBanner />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
