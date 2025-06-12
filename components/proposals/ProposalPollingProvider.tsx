'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useStartProposalPolling, checkAllActiveProposals } from '@/hooks/useProposalPolling';

interface ProposalPollingContextType {
  startPolling: (proposalId: string) => void;
}

const ProposalPollingContext = createContext<ProposalPollingContextType | undefined>(undefined);

interface ProposalPollingProviderProps {
  children: ReactNode;
}

export function ProposalPollingProvider({ children }: ProposalPollingProviderProps) {
  const startPolling = useStartProposalPolling();

  useEffect(() => {
    // Verificar propostas ativas no localStorage ao carregar a página
    checkAllActiveProposals();

    // Solicitar permissão para notificações
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  return (
    <ProposalPollingContext.Provider value={{ startPolling }}>
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