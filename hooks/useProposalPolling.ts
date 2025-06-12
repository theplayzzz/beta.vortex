import { useEffect, useRef, useCallback } from 'react';

export interface ProposalStatus {
  id: string;
  title: string;
  clientName: string;
  updatedAt: string;
  createdAt: string;
  dbStatus: string;
  statusInfo: {
    status: string;
    message: string;
    isProcessing: boolean;
    isComplete: boolean;
    hasError: boolean;
    errorDetails?: any;
    progress: number;
  };
  hasContent: boolean;
  contentLength: number;
}

interface PollingConfig {
  proposalId: string;
  onStatusChange?: (status: ProposalStatus) => void;
  onComplete?: (status: ProposalStatus) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

// Gerenciador global de polling para evitar múltiplas instâncias
class ProposalPollingManager {
  private activePolls: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, Set<(status: ProposalStatus) => void>> = new Map();
  private lastStatus: Map<string, ProposalStatus> = new Map();

  startPolling(proposalId: string, callback: (status: ProposalStatus) => void) {
    // Adicionar callback
    if (!this.callbacks.has(proposalId)) {
      this.callbacks.set(proposalId, new Set());
    }
    this.callbacks.get(proposalId)!.add(callback);

    // Se já existe polling para esta proposta, não criar outro
    if (this.activePolls.has(proposalId)) {
      // Enviar último status conhecido se existir
      const lastStatus = this.lastStatus.get(proposalId);
      if (lastStatus) {
        callback(lastStatus);
      }
      return;
    }

    console.log(`🔄 [Polling] Iniciando polling para proposta ${proposalId}`);

    const poll = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}/status`);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Usuário não autenticado, parar polling
            this.stopPolling(proposalId);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const status: ProposalStatus = await response.json();
        
        // Salvar último status
        this.lastStatus.set(proposalId, status);

        // Notificar todos os callbacks
        const callbacks = this.callbacks.get(proposalId);
        if (callbacks) {
          callbacks.forEach(cb => cb(status));
        }

        // Salvar no localStorage para comunicação entre abas
        localStorage.setItem(`proposal_status_${proposalId}`, JSON.stringify({
          status,
          timestamp: Date.now()
        }));

        // Disparar evento personalizado para outras abas
        window.dispatchEvent(new CustomEvent('proposalStatusUpdate', {
          detail: { proposalId, status }
        }));

        // Parar polling se completou ou deu erro
        if (status.statusInfo.isComplete || status.statusInfo.hasError) {
          console.log(`✅ [Polling] Finalizando polling para proposta ${proposalId} - Status: ${status.statusInfo.status}`);
          
                     // Mostrar notificação usando Notification API
           if (status.statusInfo.isComplete) {
             if (Notification.permission === 'granted') {
               new Notification(`Proposta "${status.title}" foi gerada com sucesso!`, {
                 body: 'Clique para visualizar a proposta',
                 icon: '/favicon.ico'
               });
             }
           } else if (status.statusInfo.hasError) {
             if (Notification.permission === 'granted') {
               new Notification(`Erro na proposta "${status.title}"`, {
                 body: status.statusInfo.message,
                 icon: '/favicon.ico'
               });
             }
           }

          this.stopPolling(proposalId);
        }

      } catch (error) {
        console.error(`❌ [Polling] Erro no polling da proposta ${proposalId}:`, error);
        
        // Em caso de erro, continuar tentando por um tempo
        const callbacks = this.callbacks.get(proposalId);
        if (callbacks) {
          callbacks.forEach(cb => {
            // Simular status de erro de conexão
            cb({
              id: proposalId,
              title: 'Proposta',
              clientName: 'Cliente',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              dbStatus: 'DRAFT',
              statusInfo: {
                status: 'connection_error',
                message: 'Erro de conexão ao verificar status',
                isProcessing: false,
                isComplete: false,
                hasError: true,
                progress: 0
              },
              hasContent: false,
              contentLength: 0
            });
          });
        }
      }
    };

    // Fazer primeira verificação imediatamente
    poll();

    // Configurar polling a cada 3 segundos
    const intervalId = setInterval(poll, 3000);
    this.activePolls.set(proposalId, intervalId);
  }

  stopPolling(proposalId: string) {
    const intervalId = this.activePolls.get(proposalId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activePolls.delete(proposalId);
      console.log(`🛑 [Polling] Polling parado para proposta ${proposalId}`);
    }
  }

  removeCallback(proposalId: string, callback: (status: ProposalStatus) => void) {
    const callbacks = this.callbacks.get(proposalId);
    if (callbacks) {
      callbacks.delete(callback);
      
      // Se não há mais callbacks, parar polling
      if (callbacks.size === 0) {
        this.stopPolling(proposalId);
        this.callbacks.delete(proposalId);
        this.lastStatus.delete(proposalId);
      }
    }
  }

  getLastStatus(proposalId: string): ProposalStatus | null {
    return this.lastStatus.get(proposalId) || null;
  }
}

// Instância global
const pollingManager = new ProposalPollingManager();

export function useProposalPolling({
  proposalId,
  onStatusChange,
  onComplete,
  onError,
  enabled = true
}: PollingConfig) {
  const callbackRef = useRef<(status: ProposalStatus) => void>(
    () => {} // Valor inicial padrão
  );

  // Callback memoizado
  const handleStatusChange = useCallback((status: ProposalStatus) => {
    onStatusChange?.(status);

    if (status.statusInfo.isComplete) {
      onComplete?.(status);
    }

    if (status.statusInfo.hasError) {
      onError?.(status.statusInfo.errorDetails);
    }
  }, [onStatusChange, onComplete, onError]);

  useEffect(() => {
    if (!enabled || !proposalId) return;

    callbackRef.current = handleStatusChange;

    // Iniciar polling
    pollingManager.startPolling(proposalId, handleStatusChange);

    // Listener para atualizações de outras abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `proposal_status_${proposalId}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handleStatusChange(data.status);
        } catch (error) {
          console.error('Erro ao processar status do localStorage:', error);
        }
      }
    };

    // Listener para eventos customizados
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.proposalId === proposalId) {
        handleStatusChange(e.detail.status);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('proposalStatusUpdate', handleCustomEvent as EventListener);

    // Cleanup
    return () => {
      pollingManager.removeCallback(proposalId, handleStatusChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('proposalStatusUpdate', handleCustomEvent as EventListener);
    };
  }, [proposalId, enabled, handleStatusChange]);

  // Função para forçar atualização
  const forceRefresh = useCallback(() => {
    if (proposalId && enabled) {
      pollingManager.stopPolling(proposalId);
      pollingManager.startPolling(proposalId, handleStatusChange);
    }
  }, [proposalId, enabled, handleStatusChange]);

  // Função para obter último status conhecido
  const getLastStatus = useCallback(() => {
    return pollingManager.getLastStatus(proposalId);
  }, [proposalId]);

  return {
    forceRefresh,
    getLastStatus
  };
}

// Hook para iniciar polling após criação de proposta
export function useStartProposalPolling() {
  return useCallback((proposalId: string) => {
    console.log(`🚀 [Polling] Iniciando polling automático para proposta ${proposalId}`);
    
    pollingManager.startPolling(proposalId, (status) => {
      // Callback mínimo apenas para manter o polling ativo
      console.log(`📊 [Polling] Status da proposta ${proposalId}:`, status.statusInfo.status);
    });
  }, []);
}

// Função utilitária para verificar status de todas as propostas em processamento
export function checkAllActiveProposals() {
  if (typeof window === 'undefined') return;
  
  // Verificar localStorage para propostas em processamento
  const keys = Object.keys(localStorage);
  const proposalKeys = keys.filter(key => key.startsWith('proposal_status_'));
  
  proposalKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const proposalId = key.replace('proposal_status_', '');
      
      if (data.status && data.status.statusInfo.isProcessing) {
        // Verificar se é recente (menos de 1 hora)
        const age = Date.now() - (data.timestamp || 0);
        if (age < 60 * 60 * 1000) { // 1 hora
          console.log(`🔄 [Polling] Retomando polling para proposta ${proposalId}`);
          pollingManager.startPolling(proposalId, (status) => {
            console.log(`📊 [Polling] Status da proposta ${proposalId}:`, status.statusInfo.status);
          });
        } else {
          // Remover dados antigos
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar proposta no localStorage:', error);
      localStorage.removeItem(key);
    }
  });
} 