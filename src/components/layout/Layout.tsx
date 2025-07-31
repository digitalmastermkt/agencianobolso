import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <PWAInstallPrompt />
    </div>
  );
}