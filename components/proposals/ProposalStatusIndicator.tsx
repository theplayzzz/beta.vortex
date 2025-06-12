'use client';

import { useEffect, useState } from 'react';
import { useProposalPolling, type ProposalStatus } from '@/hooks/useProposalPolling';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface ProposalStatusIndicatorProps {
  proposalId: string;
  onStatusChange?: (status: ProposalStatus) => void;
  onComplete?: (status: ProposalStatus) => void;
  showDetails?: boolean;
  autoRefresh?: boolean;
}

export function ProposalStatusIndicator({
  proposalId,
  onStatusChange,
  onComplete,
  showDetails = false,
  autoRefresh = true
}: ProposalStatusIndicatorProps) {
  const [status, setStatus] = useState<ProposalStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { forceRefresh } = useProposalPolling({
    proposalId,
    enabled: autoRefresh,
    onStatusChange: (newStatus) => {
      setStatus(newStatus);
      setLastUpdate(new Date());
      onStatusChange?.(newStatus);
    },
    onComplete: (newStatus) => {
      setStatus(newStatus);
      setLastUpdate(new Date());
      onComplete?.(newStatus);
    }
  });

  const getStatusIcon = () => {
    if (!status) return <Clock className="h-4 w-4" />;

    switch (status.statusInfo.status) {
      case 'generating':
      case 'retrying':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'connection_error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (!status) return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Carregando...</span>;

    switch (status.statusInfo.status) {
      case 'generating':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Gerando...</span>;
      case 'retrying':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Tentando novamente...</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Concluída</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Erro</span>;
      case 'connection_error':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Erro de Conexão</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Rascunho</span>;
    }
  };

  const getTimeAgo = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  };

  if (!status) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Carregando status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusBadge()}
          <span className="text-sm font-medium">{status.statusInfo.message}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{getTimeAgo()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={forceRefresh}
            disabled={status.statusInfo.isProcessing}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Barra de progresso */}
      {status.statusInfo.isProcessing && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.statusInfo.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Progresso: {status.statusInfo.progress}%
          </p>
        </div>
      )}

      {/* Detalhes expandidos */}
      {showDetails && (
        <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium">ID:</span> {status.id}
            </div>
            <div>
              <span className="font-medium">Cliente:</span> {status.clientName}
            </div>
            <div>
              <span className="font-medium">Status BD:</span> {status.dbStatus}
            </div>
            <div>
              <span className="font-medium">Conteúdo:</span> {status.hasContent ? 'Sim' : 'Não'}
            </div>
          </div>

          {status.statusInfo.hasError && status.statusInfo.errorDetails && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <div className="font-medium text-red-800">Detalhes do erro:</div>
              <div className="text-red-600">{status.statusInfo.errorDetails.error}</div>
              {status.statusInfo.errorDetails.retryCount > 0 && (
                <div className="text-red-500">
                  Tentativas: {status.statusInfo.errorDetails.retryCount}
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <div>Criada: {new Date(status.createdAt).toLocaleString('pt-BR')}</div>
            <div>Atualizada: {new Date(status.updatedAt).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      )}

      {/* Ações */}
      {status.statusInfo.isComplete && (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => window.location.href = `/proposals/${proposalId}`}
          >
            Ver Proposta
          </Button>
        </div>
      )}

      {status.statusInfo.hasError && (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={forceRefresh}
          >
            Tentar Novamente
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = `/proposals/${proposalId}`}
          >
            Ver Detalhes
          </Button>
        </div>
      )}
    </div>
  );
} 