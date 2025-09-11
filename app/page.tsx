"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth/client-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientFlowModal from "@/components/shared/client-flow-modal";
import { useClientFlow } from "../hooks/use-client-flow";
import { useClientsCount, usePlanningsCount } from "@/lib/react-query";
import { useProposalStats } from "@/hooks/use-proposals";
import type { Client } from "@/lib/react-query";
import { useUser } from "@clerk/nextjs";
import { getPermissionsForStatus } from "@/types/permissions";
import { 
  ClipboardList, 
  CheckCircle, 
  Users, 
  FileText, 
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

      {/* Grid de Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Widget Planejamentos */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Planejamentos</h3>
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-sgbus-green" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">{planningsCount}</div>
            <div className="text-sm text-seasalt/70">Planejamentos ativos</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <Link href="/planejamentos" className="text-sgbus-green text-sm hover:underline">
              Ver todos →
            </Link>
          </div>
        </div>

        {/* Widget Propostas */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Propostas</h3>
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-sgbus-green" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">{proposalStats?.total || 0}</div>
            <div className="text-sm text-seasalt/70">Propostas criadas</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <Link href="/propostas" className="text-sgbus-green text-sm hover:underline">
              Ver todas →
            </Link>
          </div>
        </div>

        {/* Widget Clientes */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Clientes</h3>
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-sgbus-green" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">{clientsCount}</div>
            <div className="text-sm text-seasalt/70">Clientes cadastrados</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <Link href="/clientes" className="text-sgbus-green text-sm hover:underline">
              Gerenciar →
            </Link>
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20 mb-8">
        <h3 className="text-lg font-semibold text-seasalt mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            href="/propostas"
            className="p-4 bg-sgbus-green/10 hover:bg-sgbus-green/20 rounded-lg border border-sgbus-green/20 transition-colors group text-center"
          >
            <div className="flex items-center justify-center w-8 h-8 text-sgbus-green mb-2 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-seasalt font-medium">Propostas</div>
            <div className="text-seasalt/70 text-sm mt-1">Gerenciar propostas</div>
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
      </div>

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
