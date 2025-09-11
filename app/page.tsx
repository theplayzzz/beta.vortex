"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth/client-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientFlowModal from "@/components/shared/client-flow-modal";
import { useClientFlow } from "../hooks/use-client-flow";
import { useClientsCount, usePlanningsCount } from "@/lib/react-query";
import { useProposalStats } from "@/hooks/use-proposals";
import { useSessionStats } from "@/hooks/use-session-stats";
import { useUsageStats } from "@/hooks/use-usage-stats";
import { UsageWidget, SimpleWidget, WidgetSkeleton } from "@/components/dashboard/usage-widget";
import { PlanInfo } from "@/components/dashboard/plan-info";
import type { Client } from "@/lib/react-query";
import { useUser } from "@clerk/nextjs";
import { getPermissionsForStatus } from "@/types/permissions";
import { 
  ClipboardList, 
  CheckCircle, 
  Users, 
  FileText, 
  Clock,
  Bot, 
  PenTool 
} from "lucide-react";

export default function HomePage() {
  const { user, isLoading, isSignedIn } = useCurrentUser();
  const { user: clerkUser } = useUser();
  
  // TanStack Query hooks para contagem de clientes e planejamentos
  const { data: clientsCount = 0, refetch: refetchClientsCount } = useClientsCount();
  const { data: planningsCount = 0, refetch: refetchPlanningsCount } = usePlanningsCount();
  
  // Hook para estatísticas de propostas
  const { data: proposalStats } = useProposalStats();
  
  // Hook para estatísticas de sessões
  const { data: sessionStats } = useSessionStats();
  
  // Hook para estatísticas de uso e limites
  const { data: usageStats, isLoading: isUsageLoading, error: usageError } = useUsageStats();
  
  // Get user permissions
  const publicMetadata = clerkUser?.publicMetadata as any;
  const userStatus = publicMetadata?.approvalStatus || 'PENDING';
  const userRole = publicMetadata?.role || 'USER';
  const permissions = getPermissionsForStatus(userStatus, userRole);

  const clientFlow = useClientFlow({
    title: "Novo Cliente",
    description: "Crie um novo cliente rapidamente",
    onClientSelected: (client: Client) => {
      // Atualizar contagem após criação
      refetchClientsCount();
      // Também atualizar planejamentos caso sejam criados junto
      refetchPlanningsCount();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-seasalt">Carregando...</div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header da Página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-seasalt">
          Dashboard - Bem-vindo, {user.firstName || "Usuário"}!
        </h1>
        <p className="text-periwinkle mt-2">
          Aqui está um resumo das suas atividades no Vortex Vault
        </p>
      </div>

      {/* Grid de Widgets e Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
        {isUsageLoading ? (
          <>
            <WidgetSkeleton delay={0} />
            <WidgetSkeleton delay={0.1} />
            <WidgetSkeleton delay={0.2} />
            <WidgetSkeleton delay={0.3} />
          </>
        ) : usageError || !usageStats ? (
          <>
            {/* Fallback to simple widgets if usage data fails */}
            <SimpleWidget
              title="Planejamentos"
              icon={ClipboardList}
              value={planningsCount}
              subtitle="Planejamentos ativos"
              href="/planejamentos"
              linkText="Ver todos →"
              iconColor="sgbus-green"
              delay={0}
            />
            <SimpleWidget
              title="Clientes"
              icon={Users}
              value={clientsCount}
              subtitle="Clientes cadastrados"
              href="/clientes"
              linkText="Gerenciar →"
              iconColor="periwinkle"
              delay={0.1}
            />
            <SimpleWidget
              title="Propostas"
              icon={FileText}
              value={proposalStats?.total || 0}
              subtitle="Propostas criadas"
              href="/propostas"
              linkText="Ver todas →"
              iconColor="sgbus-green"
              delay={0.2}
            />
            <SimpleWidget
              title="Sessões"
              icon={Clock}
              value={sessionStats?.transcriptionTime || '0min'}
              subtitle="Horas em sessões"
              href="/coach/capture/pre-session"
              linkText="Ver todas →"
              iconColor="periwinkle"
              delay={0.3}
            />
          </>
        ) : (
          <>
            {/* Widget Planejamentos com limites */}
            <UsageWidget
              title="Planejamentos"
              icon={ClipboardList}
              used={usageStats.plannings.used}
              limit={usageStats.plannings.limit}
              href="/planejamentos"
              linkText="Ver todos →"
              iconColor="sgbus-green"
              delay={0}
            />

            {/* Widget Propostas com limites */}
            <UsageWidget
              title="Propostas"
              icon={FileText}
              used={usageStats.proposals.used}
              limit={usageStats.proposals.limit}
              href="/propostas"
              linkText="Ver todas →"
              iconColor="sgbus-green"
              delay={0.1}
            />

            {/* Widget Transcrições com limites */}
            <UsageWidget
              title="Transcrições"
              icon={Clock}
              used={usageStats.transcriptionMinutes.used}
              limit={usageStats.transcriptionMinutes.limit}
              href="/coach/capture/pre-session"
              linkText="Nova sessão →"
              isTranscription={true}
              iconColor="periwinkle"
              delay={0.2}
            />

            {/* Widget Clientes (simples, sem limite) */}
            <SimpleWidget
              title="Clientes"
              icon={Users}
              value={usageStats.clients.total}
              subtitle="Clientes cadastrados"
              href="/clientes"
              linkText="Gerenciar →"
              iconColor="periwinkle"
              delay={0.3}
            />
          </>
        )}

        {/* Título das Ações Rápidas - ocupa largura total */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-seasalt mb-4">Ações Rápidas</h3>
        </div>

        {/* Ações Rápidas - Integradas na mesma grid */}
        {permissions.canAccessPlanning ? (
          <Link href="/planejamentos/novo" className="p-4 bg-sgbus-green/10 hover:bg-sgbus-green/20 rounded-lg border border-sgbus-green/20 transition-colors group text-center">
            <div className="flex items-center justify-center w-8 h-8 text-sgbus-green mb-2 mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="text-seasalt font-medium">Novo Planejamento</div>
            <div className="text-seasalt/70 text-sm mt-1">Criar estratégia com IA</div>
          </Link>
        ) : (
          <button disabled className="p-4 bg-sgbus-green/10 rounded-lg border border-sgbus-green/20 transition-colors group opacity-50 cursor-not-allowed text-center">
            <div className="flex items-center justify-center w-8 h-8 text-sgbus-green mb-2 mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="text-seasalt font-medium">Novo Planejamento</div>
            <div className="text-seasalt/70 text-sm mt-1">Criar estratégia com IA</div>
          </button>
        )}
        
        {permissions.canAccessClients ? (
          <button 
            onClick={clientFlow.openModal}
            className="p-4 bg-periwinkle/10 hover:bg-periwinkle/20 rounded-lg border border-periwinkle/20 transition-colors group text-center"
          >
            <div className="flex items-center justify-center w-8 h-8 text-periwinkle mb-2 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-seasalt font-medium">Novo Cliente</div>
            <div className="text-seasalt/70 text-sm mt-1">Cadastrar cliente</div>
          </button>
        ) : (
          <button 
            disabled
            className="p-4 bg-periwinkle/10 rounded-lg border border-periwinkle/20 transition-colors group opacity-50 cursor-not-allowed text-center"
          >
            <div className="flex items-center justify-center w-8 h-8 text-periwinkle mb-2 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-seasalt font-medium">Novo Cliente</div>
            <div className="text-seasalt/70 text-sm mt-1">Cadastrar cliente</div>
          </button>
        )}
        
        <Link 
          href="/propostas/nova"
          className="p-4 bg-sgbus-green/10 hover:bg-sgbus-green/20 rounded-lg border border-sgbus-green/20 transition-colors group text-center"
        >
          <div className="flex items-center justify-center w-8 h-8 text-sgbus-green mb-2 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="text-seasalt font-medium">Nova Proposta</div>
          <div className="text-seasalt/70 text-sm mt-1">Criar proposta comercial</div>
        </Link>
        
        {/* PLAN-010: Sales button enabled for PENDING users */}
        {permissions.canAccessSales ? (
          <Link 
            href="/coach/capture/pre-session"
            className="block p-4 bg-periwinkle/10 hover:bg-periwinkle/20 rounded-lg border border-periwinkle/20 transition-colors group text-center"
          >
            <div className="flex items-center justify-center w-8 h-8 text-periwinkle mb-2 mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-seasalt font-medium">Copiloto Spalla</div>
            <div className="text-seasalt/70 text-sm mt-1">Copiloto de vendas</div>
          </Link>
        ) : (
          <button 
            disabled
            className="p-4 bg-periwinkle/10 rounded-lg border border-periwinkle/20 transition-colors group opacity-50 cursor-not-allowed text-center"
          >
            <div className="flex items-center justify-center w-8 h-8 text-periwinkle mb-2 mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-seasalt font-medium">Copiloto Spalla</div>
            <div className="text-seasalt/70 text-sm mt-1">Em breve</div>
          </button>
        )}
      </div>

      {/* Informações do Plano */}
      {usageStats && (
        <div className="mb-8">
          <PlanInfo usageStats={usageStats} />
        </div>
      )}

      {/* Atividade Recente */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        <h3 className="text-lg font-semibold text-seasalt mb-4">Atividade Recente</h3>
        <div className="text-center py-8">
          <div className="flex items-center justify-center text-seasalt/50 mb-4">
            <PenTool className="w-12 h-12" />
          </div>
          <div className="text-seasalt/70">Nenhuma atividade ainda</div>
          <div className="text-seasalt/50 text-sm mt-2">
            Suas ações aparecerão aqui conforme você usa a plataforma
          </div>
        </div>
      </div>

      {/* Modal de criação de cliente */}
      <ClientFlowModal {...clientFlow.modalProps} />
    </div>
  );
}
