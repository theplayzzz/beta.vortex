import "./globals.css";
import cx from "classnames";
import { sfPro, inter } from "./fonts";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@/lib/auth/auth-wrapper";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";

export const metadata = {
  title: "Vortex Vault - Sistema de Planejamento e Gestão com IA",
  description:
    "Plataforma integrada para criar, gerenciar e otimizar planejamentos estratégicos com inteligência artificial.",
  metadataBase: new URL("https://vortex-vault.com"),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="pt-BR">
        <body className={cx(sfPro.variable, inter.variable, "bg-night text-seasalt")}>
          <QueryProvider>
            <ToastProvider>
              {userId ? (
                // Layout do Dashboard para usuários autenticados
                <div className="flex h-screen overflow-hidden bg-background">
                  <Sidebar />
                  <main className="flex-1 flex flex-col">
                    <Header />
                    <div className="flex-1 overflow-auto">
                      {children}
                    </div>
                  </main>
                </div>
              ) : (
                // Layout simples para páginas de autenticação
                children
              )}
            </ToastProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
