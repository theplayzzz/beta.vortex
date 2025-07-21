import "./globals.css";
import cx from "classnames";
import { sfPro, inter } from "./fonts";
import { ClerkProvider } from "@clerk/nextjs";
import DynamicLayout from "@/components/layout/dynamic-layout";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ProposalPollingProvider } from "@/components/proposals/ProposalPollingProvider";
// import { GlobalRefinedPlanningListenerProvider } from "@/contexts/GlobalRefinedPlanningListener";

export const metadata = {
  title: "Vortex Vault - Sistema de Planejamento e Gestão com IA",
  description:
    "Plataforma integrada para criar, gerenciar e otimizar planejamentos estratégicos com inteligência artificial.",
  metadataBase: new URL("https://vortex-vault.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/clientes"
      signUpFallbackRedirectUrl="/clientes"
    >
      <html lang="pt-BR">
        <body className={cx(sfPro.variable, inter.variable, "bg-night text-seasalt")}>
          <QueryProvider>
            <ToastProvider>
              <ProposalPollingProvider>
                <DynamicLayout>
                  {children}
                </DynamicLayout>
              </ProposalPollingProvider>
            </ToastProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
