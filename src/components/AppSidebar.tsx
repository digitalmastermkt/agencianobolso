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
  Sparkles,
  GraduationCap,
  FileText,
  Users,
  CreditCard,
  Calendar,
  Shield,
  Star
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
import { useUserRole } from "@/hooks/useUserRole";
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
    title: "DIRETOR DE ARTE",
    url: "/agentes/diretor-arte",
    icon: Image,
    color: "text-red-600"
  }
];

const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Favoritos",
    url: "/favoritos",
    icon: Star
  }
];

const learningItems = [
  {
    title: "Treinamentos",
    url: "/treinamentos",
    icon: User
  },
  {
    title: "Prompts",
    url: "/prompts", 
    icon: Sparkles
  },
  {
    title: "Comunidade",
    url: "/comunidade",
    icon: MessageCircle
  }
];

const adminItems = [
  {
    title: "Treinamentos",
    url: "/admin/trainings",
    icon: GraduationCap,
    color: "text-blue-600"
  },
  {
    title: "Prompts",
    url: "/admin/prompts",
    icon: FileText,
    color: "text-green-600"
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: Users,
    color: "text-purple-600"
  },
  {
    title: "Planos",
    url: "/admin/plans",
    icon: CreditCard,
    color: "text-indigo-600"
  },
  {
    title: "Eventos",
    url: "/admin/events",
    icon: Calendar,
    color: "text-cyan-600"
  },
  {
    title: "Stripe",
    url: "/admin/stripe",
    icon: Settings,
    color: "text-orange-600"
  },
  {
    title: "Logs de Auditoria",
    url: "/admin/audit-logs",
    icon: Shield,
    color: "text-red-600"
  }
];

export function AppSidebar() {
  const sidebar = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, role } = useUserRole();
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
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
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
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Learning Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Aprendizado</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {learningItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.title}</span>
                        {isActive(item.url) && (
                          <ChevronRight className="ml-auto h-5 w-5" />
                        )}
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
                        <item.icon className={`mr-2 h-5 w-5 ${item.color}`} />
                        <span>{item.title}</span>
                        {isActive(item.url) && (
                          <ChevronRight className="ml-auto h-5 w-5" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Admin Navigation - Only for Admins */}
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavClass}>
                          <item.icon className={`mr-2 h-5 w-5 ${item.color}`} />
                          <span>{item.title}</span>
                          {currentPath.startsWith(item.url) && (
                            <ChevronRight className="ml-auto h-5 w-5" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t">
          <div className="p-4 space-y-2">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.email ? getUserInitials(user.email) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="default"
                onClick={() => setProfileOpen(true)}
                className="flex-1 min-h-[44px]"
              >
                <User className="h-5 w-5" />
                <span className="ml-2">Perfil</span>
              </Button>
              <Button
                variant="ghost"
                size="default"
                onClick={handleSignOut}
                className="flex-1 min-h-[44px]"
              >
                <LogOut className="h-5 w-5" />
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