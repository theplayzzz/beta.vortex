'use client';

import { Brain, Clock, Zap } from 'lucide-react';
import { Proposal } from '@/hooks/use-proposals';

interface ProposalEmptyStateProps {
  proposal: Proposal;
}

export function ProposalEmptyState({ proposal }: ProposalEmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (proposal.status) {
      case 'DRAFT':
        return {
          icon: Clock,
          title: 'Proposta em Rascunho',
          description: 'Esta proposta ainda não foi enviada para geração pela IA.',
          action: 'A proposta precisa ser finalizada e enviada para que o conteúdo seja gerado.',
          color: 'text-yellow-400'
        };
      
      case 'SENT':
        return {
          icon: Brain,
          title: 'IA Processando Proposta',
          description: 'Nossa IA está analisando os dados e gerando uma proposta personalizada.',
          action: 'O conteúdo aparecerá aqui assim que a geração for concluída.',
          color: 'text-sgbus-green'
        };
      
      default:
        return {
          icon: Zap,
          title: 'Conteúdo Não Disponível',
          description: 'Esta proposta não possui conteúdo gerado pela IA.',
          action: 'Entre em contato com o suporte se acredita que isso é um erro.',
          color: 'text-seasalt/50'
        };
    }
  };

  const content = getEmptyStateContent();
  const IconComponent = content.icon;

  return (
    <div className="mt-6">
      <div className="bg-eerie-black rounded-lg p-8 border border-accent/20 text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-night mb-6 ${content.color}`}>
          <IconComponent className="h-8 w-8" />
        </div>
        
        <h3 className="text-xl font-semibold text-seasalt mb-3">
          {content.title}
        </h3>
        
        <p className="text-seasalt/70 mb-4 max-w-md mx-auto">
          {content.description}
        </p>
        
        <p className="text-seasalt/50 text-sm">
          {content.action}
        </p>

        {/* Indicador de progresso para status SENT */}
        {proposal.status === 'SENT' && (
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-sgbus-green rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-sgbus-green/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-sgbus-green/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-sgbus-green text-sm font-medium">
              Processando...
            </p>
          </div>
        )}

        {/* Informações sobre o processo */}
        <div className="mt-8 p-4 bg-night rounded-lg">
          <h4 className="text-seasalt font-medium mb-3">Como funciona a geração?</h4>
          <div className="space-y-2 text-sm text-seasalt/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-sgbus-green/20 rounded-full flex items-center justify-center text-sgbus-green text-xs font-bold">1</span>
              <span>Análise dos dados do cliente e requisitos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-sgbus-green/20 rounded-full flex items-center justify-center text-sgbus-green text-xs font-bold">2</span>
              <span>Geração de conteúdo personalizado pela IA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-sgbus-green/20 rounded-full flex items-center justify-center text-sgbus-green text-xs font-bold">3</span>
              <span>Formatação e insights comerciais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 