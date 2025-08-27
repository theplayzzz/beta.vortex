"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth/client-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientFlowModal from "@/components/shared/client-flow-modal";
import { useClientFlow } from "../hooks/use-client-flow";
import { useClientsCount } from "@/lib/react-query";
import type { Client } from "@/lib/react-query";
import { useUser } from "@clerk/nextjs";
import { useFirstVisitHighlight } from "@/hooks/useFirstVisitHighlight";
import { HighlightBadge } from "@/components/ui/highlight-badge";
import { getPermissionsForStatus } from "@/types/permissions";

export default function HomePage() {
  const { user, isLoading, isSignedIn } = useCurrentUser();
  const { user: clerkUser } = useUser();
  const { shouldHighlight, markAsInteracted } = useFirstVisitHighlight();
  
  // TanStack Query hook para contagem de clientes
  const { data: clientsCount = 0, refetch: refetchClientsCount } = useClientsCount();
  
  // Get user permissions
  const publicMetadata = clerkUser?.publicMetadata as any;
  const userStatus = publicMetadata?.approvalStatus || 'PENDING';
  const userRole = publicMetadata?.role || 'USER';
  const permissions = getPermissionsForStatus(userStatus, userRole);
  const isPendingUser = userStatus === 'PENDING';

  const clientFlow = useClientFlow({
    title: "Novo Cliente",
    description: "Crie um novo cliente rapidamente",
    onClientSelected: (client: Client) => {
      // Atualizar contagem após criação
      refetchClientsCount();
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-seasalt">
            Dashboard - Bem-vindo, {user.firstName || "Usuário"}!
          </h1>
          <p className="text-periwinkle mt-2">
            Aqui está um resumo das suas atividades no Vortex Vault
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-seasalt/70">Créditos:</span>
          <span className="text-lg font-semibold text-sgbus-green">
            {user.creditBalance}
          </span>
        </div>
      </div>

      {/* Grid de Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Widget Planejamentos */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Planejamentos</h3>
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <span className="text-sgbus-green text-sm font-bold">📋</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">0</div>
            <div className="text-sm text-seasalt/70">Planejamentos ativos</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <Link href="/planejamentos" className="text-sgbus-green text-sm hover:underline">
              Ver todos →
            </Link>
          </div>
        </div>

        {/* Widget Tarefas */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Tarefas</h3>
            <div className="w-8 h-8 bg-periwinkle/20 rounded-lg flex items-center justify-center">
              <span className="text-periwinkle text-sm font-bold">✓</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">0</div>
            <div className="text-sm text-seasalt/70">Tarefas pendentes</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <span
              aria-disabled="true"
              className="text-periwinkle text-sm opacity-50 cursor-not-allowed"
            >
              Ver lista →
            </span>
          </div>
        </div>

        {/* Widget Clientes */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Clientes</h3>
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <span className="text-sgbus-green text-sm font-bold">👥</span>
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
            <Link href="/planejamentos/novo" className="p-4 bg-sgbus-green/10 hover:bg-sgbus-green/20 rounded-lg border border-sgbus-green/20 transition-colors group">
              <div className="text-sgbus-green text-2xl mb-2">📋</div>
              <div className="text-seasalt font-medium">Novo Planejamento</div>
              <div className="text-seasalt/70 text-sm mt-1">Criar estratégia com IA</div>
            </Link>
          ) : (
            <button disabled className="p-4 bg-sgbus-green/10 rounded-lg border border-sgbus-green/20 transition-colors group opacity-50 cursor-not-allowed">
              <div className="text-sgbus-green text-2xl mb-2">📋</div>
              <div className="text-seasalt font-medium">Novo Planejamento</div>
              <div className="text-seasalt/70 text-sm mt-1">Criar estratégia com IA</div>
            </button>
          )}
          
          {permissions.canAccessClients ? (
            <button 
              onClick={clientFlow.openModal}
              className="p-4 bg-periwinkle/10 hover:bg-periwinkle/20 rounded-lg border border-periwinkle/20 transition-colors group"
            >
              <div className="text-periwinkle text-2xl mb-2">👥</div>
              <div className="text-seasalt font-medium">Novo Cliente</div>
              <div className="text-seasalt/70 text-sm mt-1">Cadastrar cliente</div>
            </button>
          ) : (
            <button 
              disabled
              className="p-4 bg-periwinkle/10 rounded-lg border border-periwinkle/20 transition-colors group opacity-50 cursor-not-allowed"
            >
              <div className="text-periwinkle text-2xl mb-2">👥</div>
              <div className="text-seasalt font-medium">Novo Cliente</div>
              <div className="text-seasalt/70 text-sm mt-1">Cadastrar cliente</div>
            </button>
          )}
          
          <button 
            disabled 
            aria-disabled="true"
            className="p-4 bg-sgbus-green/10 rounded-lg border border-sgbus-green/20 transition-colors group opacity-50 cursor-not-allowed"
          >
            <div className="text-sgbus-green text-2xl mb-2">💬</div>
            <div className="text-seasalt font-medium">Chat IA</div>
            <div className="text-seasalt/70 text-sm mt-1">Conversar com assistente</div>
          </button>
          
          {/* PLAN-010: Sales button enabled for PENDING users with highlight */}
          <HighlightBadge
            isHighlighted={isPendingUser && shouldHighlight}
            onInteraction={markAsInteracted}
            badgeText="LIBERADO"
          >
            {permissions.canAccessSales ? (
              <Link 
                href="/coach/capture/pre-session"
                className="block p-4 bg-periwinkle/10 hover:bg-periwinkle/20 rounded-lg border border-periwinkle/20 transition-colors group"
              >
                <div className="text-periwinkle text-2xl mb-2">📊</div>
                <div className="text-seasalt font-medium">Vendas</div>
                <div className="text-seasalt/70 text-sm mt-1">Módulo de coaching</div>
              </Link>
            ) : (
              <button 
                disabled
                className="p-4 bg-periwinkle/10 rounded-lg border border-periwinkle/20 transition-colors group opacity-50 cursor-not-allowed"
              >
                <div className="text-periwinkle text-2xl mb-2">📊</div>
                <div className="text-seasalt font-medium">Vendas</div>
                <div className="text-seasalt/70 text-sm mt-1">Em breve</div>
              </button>
            )}
          </HighlightBadge>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        <h3 className="text-lg font-semibold text-seasalt mb-4">Atividade Recente</h3>
        <div className="text-center py-8">
          <div className="text-seasalt/50 text-4xl mb-4">📝</div>
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
