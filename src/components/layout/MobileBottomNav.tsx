import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Palette, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ProfileDialog } from "@/components/ProfileDialog";

const navItems = [
  { label: "Início", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Criar", icon: Palette, path: "/agentes/diretor-arte" },
  { label: "Favoritos", icon: Star, path: "/favoritos" },
  { label: "Perfil", icon: User, path: "__profile__" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {navItems.map((item) => {
            if (item.path === "__profile__") {
              return (
                <button
                  key={item.label}
                  onClick={() => setProfileOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] rounded-lg transition-colors",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }

            const isActive = location.pathname === item.path || 
              (item.path === "/agentes/diretor-arte" && location.pathname.startsWith("/agentes"));

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_hsl(197,100%,50%)]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
