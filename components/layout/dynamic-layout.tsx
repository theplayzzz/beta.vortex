"use client"

import { useUser } from '@clerk/nextjs'
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TopHeader from "@/components/layout/TopHeader";
import Overlay from "@/components/layout/Overlay";
import { SidebarProvider } from "../../contexts/SidebarContext";

interface DynamicLayoutProps {
  children: React.ReactNode;
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
  const { isLoaded, isSignedIn } = useUser()

  // Se ainda está carregando, mostra o layout com header mas só sidebar após auth
  if (!isLoaded) {
    return (
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <TopHeader />
          <main className="flex-1 flex flex-col" style={{ paddingTop: "70px" }}>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  // Layout do Dashboard para usuários autenticados
  if (isSignedIn) {
    return (
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <TopHeader />
          <Overlay />
          <Sidebar />
          <main className="flex-1 flex flex-col" style={{ paddingTop: "70px" }}>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  // Layout simples para páginas de autenticação
  return <>{children}</>
} 