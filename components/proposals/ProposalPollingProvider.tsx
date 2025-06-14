'use client';

import { createContext, useContext, useEffect, ReactNode, useRef } from 'react';
import { useStartProposalPolling, checkAllActiveProposals } from '@/hooks/useProposalPolling';

interface ProposalPollingContextType {
  startPolling: (proposalId: string) => void;
  stopPolling: (proposalId: string) => void;
  clearAllPolling: () => void;
  isPollingActive: (proposalId: string) => boolean;
}

const ProposalPollingContext = createContext<ProposalPollingContextType | undefined>(undefined);

interface ProposalPollingProviderProps {
  children: ReactNode;
}

export function ProposalPollingProvider({ children }: ProposalPollingProviderProps) {
  const startPolling = useStartProposalPolling();
  const activePollingRef = useRef<Set<string>>(new Set());

  // 🔥 FUNÇÃO PARA PARAR POLLING ESPECÍFICO
  const stopPolling = (proposalId: string) => {
    console.log(`🛑 [GLOBAL_POLLING] Parando polling para proposta ${proposalId}`);
    activePollingRef.current.delete(proposalId);
    
    // Limpar localStorage específico
    localStorage.removeItem(`proposal_status_${proposalId}`);
    localStorage.removeItem(`proposal_polling_${proposalId}`);
  };

  // 🔥 FUNÇÃO PARA LIMPAR TODO O POLLING
  const clearAllPolling = () => {
    console.log('🧹 [GLOBAL_POLLING] Limpando todo o polling ativo');
    
    // Parar todos os pollings ativos
    activePollingRef.current.forEach(proposalId => {
      stopPolling(proposalId);
    });
    
    activePollingRef.current.clear();
    
    // Limpar todo o localStorage relacionado a propostas
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('proposal_status_') || key.startsWith('proposal_polling_'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ [GLOBAL_POLLING] Removido do localStorage: ${key}`);
    });
  };

  // 🔥 FUNÇÃO PARA VERIFICAR SE POLLING ESTÁ ATIVO
  const isPollingActive = (proposalId: string) => {
    return activePollingRef.current.has(proposalId);
  };

  // 🔥 WRAPPER PARA STARTPOLLING COM CONTROLE GLOBAL
  const startPollingWithControl = (proposalId: string) => {
    // Se já está fazendo polling desta proposta, parar o anterior primeiro
    if (activePollingRef.current.has(proposalId)) {
      console.log(`⚠️ [GLOBAL_POLLING] Polling já ativo para proposta ${proposalId}, parando anterior...`);
      stopPolling(proposalId);
    }
    
    console.log(`🚀 [GLOBAL_POLLING] Iniciando polling para proposta ${proposalId}`);
    activePollingRef.current.add(proposalId);
    startPolling(proposalId);
  };

  useEffect(() => {
    // Verificar propostas ativas no localStorage ao carregar a página
    checkAllActiveProposals();

    // Solicitar permissão para notificações
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // 🔥 LIMPEZA GLOBAL AO DESMONTAR
    return () => {
      console.log('🧹 [GLOBAL_POLLING] Desmontando provider, limpando todo o polling');
      clearAllPolling();
    };
  }, []);

  // 🔥 LIMPEZA AUTOMÁTICA A CADA 5 MINUTOS
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      console.log('🧹 [GLOBAL_POLLING] Limpeza automática de polling antigo');
      
      // Verificar propostas que não estão mais sendo monitoradas
      const currentTime = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutos
      
      activePollingRef.current.forEach(proposalId => {
        const lastActivity = localStorage.getItem(`proposal_polling_${proposalId}`);
        if (lastActivity) {
          const lastTime = parseInt(lastActivity);
          if (currentTime - lastTime > staleThreshold) {
            console.log(`🗑️ [GLOBAL_POLLING] Removendo polling antigo para proposta ${proposalId}`);
            stopPolling(proposalId);
          }
        }
      });
    }, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <ProposalPollingContext.Provider value={{ 
      startPolling: startPollingWithControl, 
      stopPolling, 
      clearAllPolling, 
      isPollingActive 
    }}>
      {children}
    </ProposalPollingContext.Provider>
  );
}

export function useProposalPollingContext() {
  const context = useContext(ProposalPollingContext);
  if (context === undefined) {
    throw new Error('useProposalPollingContext must be used within a ProposalPollingProvider');
  }
  return context;
} 