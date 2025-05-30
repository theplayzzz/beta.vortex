'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  MessageCircle, 
  CheckCircle, 
  Copy, 
  Download, 
  Edit, 
  Trash2,
  MoreHorizontal 
} from 'lucide-react';
import { useUpdateProposal, useDeleteProposal, Proposal } from '@/hooks/use-proposals';
import { useToast, toast } from '@/components/ui/toast';

interface ProposalActionsProps {
  proposalId: string;
  proposal: Proposal;
}

export function ProposalActions({ proposalId, proposal }: ProposalActionsProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  
  const updateProposal = useUpdateProposal(proposalId);
  const deleteProposal = useDeleteProposal();

  const handleStatusUpdate = async (newStatus: Proposal['status']) => {
    try {
      await updateProposal.mutateAsync({ status: newStatus });
      addToast(toast.success(
        'Status atualizado',
        `Proposta marcada como ${getStatusLabel(newStatus)}`
      ));
    } catch (error: any) {
      addToast(toast.error(
        'Erro ao atualizar status',
        error.message
      ));
    }
  };

  const handleDuplicate = () => {
    // TODO: Implementar duplicação
    addToast(toast.info(
      'Funcionalidade em desenvolvimento',
      'A duplicação de propostas será implementada em breve'
    ));
  };

  const handleExportPDF = () => {
    // TODO: Implementar export PDF
    addToast(toast.info(
      'Funcionalidade em desenvolvimento',
      'O export para PDF será implementado em breve'
    ));
  };

  const handleEdit = () => {
    router.push(`/propostas/${proposalId}/editar`);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja arquivar esta proposta?')) {
      return;
    }

    try {
      await deleteProposal.mutateAsync({ id: proposalId, hardDelete: false });
      addToast(toast.success(
        'Proposta arquivada',
        'A proposta foi movida para o arquivo'
      ));
      router.push('/propostas');
    } catch (error: any) {
      addToast(toast.error(
        'Erro ao arquivar proposta',
        error.message
      ));
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'DRAFT': 'rascunho',
      'SENT': 'enviada',
      'VIEWED': 'visualizada',
      'ACCEPTED': 'aceita',
      'REJECTED': 'rejeitada',
      'NEGOTIATION': 'em negociação',
      'ARCHIVED': 'arquivada'
    };
    return labels[status] || status;
  };

  const statusActions = [
    {
      label: 'Marcar como Visualizada',
      icon: Eye,
      status: 'VIEWED' as const,
      show: proposal.status === 'SENT',
      color: 'text-blue-400'
    },
    {
      label: 'Mover para Negociação',
      icon: MessageCircle,
      status: 'NEGOTIATION' as const,
      show: ['VIEWED', 'SENT'].includes(proposal.status),
      color: 'text-yellow-400'
    },
    {
      label: 'Marcar como Aprovada',
      icon: CheckCircle,
      status: 'ACCEPTED' as const,
      show: ['NEGOTIATION', 'VIEWED'].includes(proposal.status),
      color: 'text-green-400'
    }
  ];

  const generalActions = [
    {
      label: 'Duplicar Proposta',
      icon: Copy,
      onClick: handleDuplicate,
      show: true,
      color: 'text-seasalt'
    },
    {
      label: 'Exportar PDF',
      icon: Download,
      onClick: handleExportPDF,
      show: !!proposal.proposalHtml,
      color: 'text-seasalt'
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: handleEdit,
      show: ['DRAFT', 'VIEWED'].includes(proposal.status),
      color: 'text-seasalt'
    },
    {
      label: 'Arquivar',
      icon: Trash2,
      onClick: handleDelete,
      show: proposal.status !== 'ARCHIVED',
      color: 'text-red-400'
    }
  ];

  return (
    <div className="mt-8 pt-6 border-t border-accent/20">
      <div className="flex flex-wrap gap-3">
        {/* Ações de Status */}
        {statusActions.filter(action => action.show).map((action, index) => (
          <button
            key={index}
            onClick={() => handleStatusUpdate(action.status)}
            disabled={updateProposal.isPending}
            className={`flex items-center gap-2 px-4 py-2 bg-eerie-black border border-accent/20 rounded-lg hover:border-sgbus-green/50 transition-colors ${action.color} hover:text-sgbus-green disabled:opacity-50`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}

        {/* Ações Gerais */}
        {generalActions.filter(action => action.show).map((action, index) => (
          <button
            key={`general-${index}`}
            onClick={action.onClick}
            className={`flex items-center gap-2 px-4 py-2 bg-eerie-black border border-accent/20 rounded-lg hover:border-sgbus-green/50 transition-colors ${action.color} hover:text-sgbus-green`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}

        {/* Menu Mais Opções */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-eerie-black border border-accent/20 rounded-lg hover:border-sgbus-green/50 transition-colors text-seasalt hover:text-sgbus-green"
          >
            <MoreHorizontal className="h-4 w-4" />
            Mais
          </button>

          {showMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-eerie-black border border-accent/20 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    addToast(toast.success('Link copiado', 'Link da proposta copiado para a área de transferência'));
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-seasalt hover:bg-night rounded-md transition-colors"
                >
                  Copiar Link
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-seasalt hover:bg-night rounded-md transition-colors"
                >
                  Imprimir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {(updateProposal.isPending || deleteProposal.isPending) && (
        <div className="mt-4 p-3 bg-night rounded-lg border border-accent/20">
          <div className="flex items-center gap-2 text-seasalt/70">
            <div className="w-4 h-4 border-2 border-sgbus-green border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Processando...</span>
          </div>
        </div>
      )}
    </div>
  );
} 