interface ProposalStatusBadgeProps {
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATION' | 'ARCHIVED';
  size?: 'sm' | 'md';
}

export function ProposalStatusBadge({ status, size = 'md' }: ProposalStatusBadgeProps) {
  const statusConfig = {
    DRAFT: {
      label: 'Rascunho',
      classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    SENT: {
      label: 'Enviada',
      classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    VIEWED: {
      label: 'Visualizada',
      classes: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    ACCEPTED: {
      label: 'Aprovada',
      classes: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    REJECTED: {
      label: 'Rejeitada',
      classes: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    NEGOTIATION: {
      label: 'Negociação',
      classes: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
    ARCHIVED: {
      label: 'Arquivada',
      classes: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  };

  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`${config.classes} ${sizeClasses} rounded-full font-medium border inline-block`}>
      {config.label}
    </span>
  );
} 