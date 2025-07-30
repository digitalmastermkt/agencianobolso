import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Users, FileText, Menu, X, LogIn, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
const navigation = [{
  name: "Agentes",
  href: "/agentes",
  icon: Sparkles
}, {
  name: "Treinamentos",
  href: "/treinamentos",
  icon: BookOpen
}, {
  name: "Comunidade",
  href: "/comunidade",
  icon: Users
}, {
  name: "Prompts",
  href: "/prompts",
  icon: FileText
}];
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  return <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">AgênciaNoBolso AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map(item => {
            const isActive = location.pathname === item.href;
            return <Link key={item.name} to={item.href} className={cn("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>;
          })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {user.email}
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sair
                </Button>
              </div> : <Link to="/auth">
                <Button variant="gradient">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map(item => {
          const isActive = location.pathname === item.href;
          return <Link key={item.name} to={item.href} className={cn("flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent")} onClick={() => setIsOpen(false)}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>;
        })}
            
            <div className="pt-4 border-t border-border">
              {user ? <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={signOut}>
                    Sair
                  </Button>
                </div> : <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="gradient" className="w-full justify-start">
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </Link>}
            </div>
          </div>
        </div>}
    </nav>;
}