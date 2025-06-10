"use client"

import { useUser } from '@clerk/nextjs'
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface DynamicLayoutProps {
  children: React.ReactNode;
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
  const { isLoaded, isSignedIn } = useUser()

  // Mostrar layout simples enquanto carrega
  if (!isLoaded) {
    return <>{children}</>
  }

  // Layout do Dashboard para usuários autenticados
  if (isSignedIn) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // Layout simples para páginas de autenticação
  return <>{children}</>
} 