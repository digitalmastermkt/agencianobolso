import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  TrendingUp,
  Heart,
  Zap,
  MessageCircle,
  Link as LinkIcon,
  Image,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ProfileDialog } from "./ProfileDialog";

const agentItems = [
  {
    title: "VENDAS",
    url: "/agentes/vendas",
    icon: TrendingUp,
    color: "text-emerald-600"
  },
  {
    title: "STORYTELLING",
    url: "/agentes/storytelling",
    icon: Heart,
    color: "text-pink-600"
  },
  {
    title: "VIRAL",
    url: "/agentes/viral",
    icon: Zap,
    color: "text-purple-600"
  },
  {
    title: "INTERAÇÃO",
    url: "/agentes/interacao",
    icon: MessageCircle,
    color: "text-blue-600"
  },
  {
    title: "CONEXÃO",
    url: "/agentes/conexao",
    icon: LinkIcon,
    color: "text-orange-600"
  },
  {
    title: "BANNER",
    url: "/agentes/banner",
    icon: Image,
    color: "text-red-600"
  }
];

const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard
  }
];

export function AppSidebar() {
  const sidebar = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  const getUserInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      toast({
        title: "Erro no logout",
        description: "Erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Sidebar className="w-64" collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">SparkAgen</h2>
              <p className="text-xs text-muted-foreground">AI Agents</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Agents Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Agentes IA</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {agentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
                        <span>{item.title}</span>
                        {isActive(item.url) && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <div className="p-4 space-y-2">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.email ? getUserInitials(user.email) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Usuário</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfileOpen(true)}
                className="flex-1"
              >
                <User className="h-4 w-4" />
                <span className="ml-2">Perfil</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}