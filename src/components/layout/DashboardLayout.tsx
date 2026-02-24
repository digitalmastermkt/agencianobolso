import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "@/components/ui/toaster";
import { CreditsBalanceDisplay } from "@/components/CreditsBalanceDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/agentes': 'Agentes IA',
  '/agentes/diretor-arte': 'Diretor de Arte',
  '/agentes/vendas': 'Vendas',
  '/agentes/storytelling': 'Storytelling',
  '/agentes/viral': 'Viral',
  '/agentes/interacao': 'Interação',
  '/agentes/conexao': 'Conexão',
  '/favoritos': 'Favoritos',
  '/treinamentos': 'Treinamentos',
  '/prompts': 'Prompts',
  '/comunidade': 'Comunidade',
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || '';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          <header className="h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              {pageTitle && (
                <h1 className="text-sm font-semibold truncate">{pageTitle}</h1>
              )}
            </div>
            <div className="flex items-center">
              <CreditsBalanceDisplay compact />
            </div>
          </header>
          
          <div className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
            {children}
          </div>
        </main>
      </div>
      {isMobile && <MobileBottomNav />}
      <Toaster />
    </SidebarProvider>
  );
}