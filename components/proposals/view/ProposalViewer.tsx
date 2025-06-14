'use client';

import { ArrowLeft, Loader2, FileText, Bot, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useProposal } from '@/hooks/use-proposals';
import { ProposalHeader } from './ProposalHeader';
import { ContentRenderer } from './ContentRenderer';
import { AIInsightsPanel } from './AIInsightsPanel';
import { ProposalActions } from './ProposalActions';
import { ProposalEmptyState } from './ProposalEmptyState';
import { FormDataPanel } from './FormDataPanel';

interface ProposalViewerProps {
  proposalId: string;
}

export function ProposalViewer({ proposalId }: ProposalViewerProps) {
  // 🔥 SEMPRE BUSCAR DADOS FRESCOS DO BANCO DE DADOS
  const { data: proposal, isLoading, error, refetch } = useProposal(proposalId, { alwaysFresh: true });
  const [activeTab, setActiveTab] = useState('proposal'); // 'proposal' ou 'form'
  
  // Estados para o sistema de polling inteligente
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [pollingElapsedTime, setPollingElapsedTime] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [aiProcessingError, setAiProcessingError] = useState<string | null>(null);

  // Constantes do sistema de polling
  const POLLING_INTERVAL_MS = 2000; // 🔥 REDUZIDO: Verifica a cada 2 segundos (era 3s)
  const MAX_POLLING_TIME_MS = 60000; // 🔥 REDUZIDO: 60 segundos máximo (era 90s)
  const RECENT_PROPOSAL_THRESHOLD_MS = 180000; // 🔥 AUMENTADO: Considera "recente" se criada há menos de 3 minutos (era 2min)

  // Função para verificar se a proposta é recente e ainda pode estar sendo processada
  const isRecentProposal = (proposal: any) => {
    if (!proposal?.createdAt) return false;
    const createdAt = new Date(proposal.createdAt).getTime();
    const now = Date.now();
    return (now - createdAt) < RECENT_PROPOSAL_THRESHOLD_MS;
  };

  // Função para verificar se precisa aguardar processamento da IA
  const needsAIProcessing = useCallback((proposal: any) => {
    if (!proposal) return false;
    
    // 🔥 VERIFICAÇÃO MELHORADA: Múltiplos campos para detectar conteúdo da IA
    const hasMarkdown = !!(proposal.proposalMarkdown && proposal.proposalMarkdown.trim().length > 0);
    const hasHtml = !!(proposal.proposalHtml && proposal.proposalHtml.trim().length > 0);
    const hasAIContent = !!(proposal.aiGeneratedContent && Object.keys(proposal.aiGeneratedContent).length > 0);
    const isProposalSent = proposal.status === 'SENT';
    
    // Se tem qualquer conteúdo da IA, não precisa aguardar
    if (hasMarkdown || hasHtml || hasAIContent) {
      console.log(`✅ Conteúdo da IA detectado para proposta ${proposal.id}:`, {
        hasMarkdown,
        hasHtml,
        hasAIContent,
        markdownLength: proposal.proposalMarkdown?.length || 0,
        htmlLength: proposal.proposalHtml?.length || 0
      });
      return false;
    }
    
    // Se não tem conteúdo, verificar se é recente e pode estar processando
    const isRecent = isRecentProposal(proposal);
    const needsProcessing = !hasMarkdown && !hasHtml && !hasAIContent && isRecent;
    
    console.log(`🔍 Verificação de processamento para proposta ${proposal.id}:`, {
      hasMarkdown,
      hasHtml,
      hasAIContent,
      isProposalSent,
      isRecent,
      needsProcessing,
      createdAt: proposal.createdAt
    });
    
    return needsProcessing;
  }, []);

  // Iniciar sistema de polling quando necessário
  useEffect(() => {
    if (!proposal || isLoading) return;

    // Se precisa aguardar processamento da IA e ainda não está fazendo polling
    if (needsAIProcessing(proposal) && !isWaitingForAI) {
      console.log('🤖 Iniciando sistema de polling para aguardar resposta da IA...');
      setIsWaitingForAI(true);
      setPollingElapsedTime(0);

      // Configura o intervalo de polling
      const interval = setInterval(async () => {
        console.log(`🔄 [${new Date().toLocaleTimeString()}] Verificando se a IA processou a proposta ${proposal.id}...`);
        try {
          const result = await refetch();
          
          if (result.data) {
            const hasMarkdown = !!(result.data.proposalMarkdown && result.data.proposalMarkdown.trim().length > 0);
            const hasHtml = !!(result.data.proposalHtml && result.data.proposalHtml.trim().length > 0);
            const hasAIContent = !!(result.data.aiGeneratedContent && Object.keys(result.data.aiGeneratedContent).length > 0);
            
            console.log(`📊 Status da proposta ${proposal.id}:`, {
              hasMarkdown,
              hasHtml,
              hasAIContent,
              status: result.data.status,
              markdownLength: result.data.proposalMarkdown?.length || 0,
              htmlLength: result.data.proposalHtml?.length || 0
            });
            
            if (hasMarkdown || hasHtml || hasAIContent) {
              console.log(`✅ [${new Date().toLocaleTimeString()}] Proposta ${proposal.id} processada pela IA! Parando polling.`);
              clearInterval(interval);
              setIsWaitingForAI(false);
              setPollingElapsedTime(0);
              setAiProcessingError(null);
            }
          }
        } catch (error) {
          console.error(`❌ [${new Date().toLocaleTimeString()}] Erro ao verificar status da proposta ${proposal.id}:`, error);
        }
      }, POLLING_INTERVAL_MS);

      setPollingInterval(interval);

      // Configura timeout máximo
      const timeout = setTimeout(async () => {
        console.log('⏰ Timeout atingido. Parando polling após 60 segundos.');
        clearInterval(interval);
        setIsWaitingForAI(false);
        setPollingElapsedTime(0);
        
        // Força um refetch final para garantir que temos os dados mais recentes
        try {
          console.log(`🔍 [${new Date().toLocaleTimeString()}] Verificação final após timeout para proposta ${proposal.id}...`);
          const finalResult = await refetch();
          
          if (finalResult.data) {
            const hasMarkdown = !!(finalResult.data.proposalMarkdown && finalResult.data.proposalMarkdown.trim().length > 0);
            const hasHtml = !!(finalResult.data.proposalHtml && finalResult.data.proposalHtml.trim().length > 0);
            const hasAIContent = !!(finalResult.data.aiGeneratedContent && Object.keys(finalResult.data.aiGeneratedContent).length > 0);
            
            console.log(`📊 Status final da proposta ${proposal.id}:`, {
              hasMarkdown,
              hasHtml,
              hasAIContent,
              status: finalResult.data.status,
              markdownLength: finalResult.data.proposalMarkdown?.length || 0,
              htmlLength: finalResult.data.proposalHtml?.length || 0
            });
            
            if (!hasMarkdown && !hasHtml && !hasAIContent) {
              setAiProcessingError('A IA não conseguiu processar sua proposta dentro do tempo limite de 60 segundos. Você pode tentar recarregar a página ou entrar em contato com o suporte.');
            } else {
              console.log(`✅ [${new Date().toLocaleTimeString()}] Proposta ${proposal.id} foi processada durante o timeout!`);
              setAiProcessingError(null);
            }
          }
        } catch (error) {
          console.error(`❌ [${new Date().toLocaleTimeString()}] Erro no refetch final da proposta ${proposal.id}:`, error);
          setAiProcessingError('Erro ao verificar o status final da proposta. Tente recarregar a página.');
        }
      }, MAX_POLLING_TIME_MS);

      setTimeoutId(timeout);

      // Contador de tempo decorrido
      const timeCounter = setInterval(() => {
        setPollingElapsedTime(prev => prev + 1000);
      }, 1000);

      // Cleanup function
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        clearInterval(timeCounter);
        setPollingInterval(null);
        setTimeoutId(null);
      };
    }

    // Se já tem conteúdo da IA, garantir que polling está parado
    if (proposal && (proposal.proposalHtml || proposal.proposalMarkdown || proposal.aiGeneratedContent) && isWaitingForAI) {
      console.log(`✅ [${new Date().toLocaleTimeString()}] Conteúdo da IA detectado para proposta ${proposal.id}. Parando polling.`);
      console.log(`📊 Conteúdo detectado:`, {
        hasMarkdown: !!(proposal.proposalMarkdown && proposal.proposalMarkdown.trim().length > 0),
        hasHtml: !!(proposal.proposalHtml && proposal.proposalHtml.trim().length > 0),
        hasAIContent: !!(proposal.aiGeneratedContent && Object.keys(proposal.aiGeneratedContent).length > 0),
        markdownLength: proposal.proposalMarkdown?.length || 0,
        htmlLength: proposal.proposalHtml?.length || 0
      });
      
      if (pollingInterval) clearInterval(pollingInterval);
      if (timeoutId) clearTimeout(timeoutId);
      setIsWaitingForAI(false);
      setPollingElapsedTime(0);
      setAiProcessingError(null); // Limpar qualquer erro anterior
    }
  }, [proposal, isLoading, isWaitingForAI, pollingInterval, timeoutId, refetch, needsAIProcessing]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pollingInterval, timeoutId]);

  // Loading state padrão
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-sgbus-green mx-auto mb-4" />
            <p className="text-seasalt/70">Carregando proposta...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-seasalt mb-2">Erro ao carregar proposta</h3>
          <p className="text-seasalt/70 mb-6">{error.message}</p>
          <Link 
            href="/propostas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Propostas
          </Link>
        </div>
      </div>
    );
  }

  // Proposta não encontrada
  if (!proposal) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-seasalt mb-2">Proposta não encontrada</h3>
          <p className="text-seasalt/70 mb-6">A proposta que você está procurando não existe ou foi removida.</p>
          <Link 
            href="/propostas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Propostas
          </Link>
        </div>
      </div>
    );
  }

  // Estado: Aguardando processamento da IA (sistema de polling ativo)
  if (isWaitingForAI) {
    const progressPercentage = Math.min((pollingElapsedTime / MAX_POLLING_TIME_MS) * 100, 100);
    const remainingTime = Math.max(0, Math.ceil((MAX_POLLING_TIME_MS - pollingElapsedTime) / 1000));

    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/propostas"
            className="flex items-center gap-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Propostas
          </Link>
          <span className="text-seasalt/50">/</span>
          <span className="text-seasalt">{proposal.title}</span>
        </div>

        <ProposalHeader proposal={proposal} />
        
        {/* Card de Loading da IA - DESTAQUE VISUAL */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-sgbus-green/20 to-sgbus-green/5 border-2 border-sgbus-green/30 rounded-xl p-8">
            <div className="text-center">
              {/* Ícone animado */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-sgbus-green/20 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="h-10 w-10 text-sgbus-green animate-pulse" />
                </div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-sgbus-green/30 border-t-sgbus-green rounded-full animate-spin mx-auto"></div>
              </div>

              {/* Título principal */}
              <h2 className="text-2xl font-bold text-seasalt mb-2">
                🤖 IA Gerando Sua Proposta
              </h2>
              
              <p className="text-seasalt/80 mb-6 text-lg">
                Nossa inteligência artificial está analisando os dados e criando uma proposta personalizada para você
              </p>

              {/* Barra de progresso */}
              <div className="max-w-md mx-auto mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-seasalt/70">Progresso</span>
                  <span className="text-sm text-sgbus-green font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-night rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-sgbus-green to-sgbus-green/80 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Informações de tempo */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-seasalt/70">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Tempo restante: ~{remainingTime}s</span>
                </div>
                <div className="flex items-center gap-2 text-sgbus-green">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Processamento em tempo real</span>
                </div>
              </div>

              {/* Indicadores de processo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-night/50 rounded-lg p-4">
                  <div className="text-sgbus-green mb-2">✓</div>
                  <div className="text-sm text-seasalt">Dados Analisados</div>
                </div>
                <div className="bg-night/50 rounded-lg p-4">
                  <div className="text-sgbus-green mb-2">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                  <div className="text-sm text-seasalt">Gerando Conteúdo</div>
                </div>
                <div className="bg-night/50 rounded-lg p-4 opacity-50">
                  <div className="text-seasalt/50 mb-2">⏳</div>
                  <div className="text-sm text-seasalt/50">Finalizando</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações adicionais - menos destaque */}
        {proposal.formDataJSON && (
          <div className="mt-8">
            <div className="bg-night/30 rounded-lg p-6 border border-seasalt/10">
              <h3 className="text-seasalt/70 text-sm font-medium mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dados do Formulário (Referência)
              </h3>
              <FormDataPanel 
                formData={proposal.formDataJSON}
                clientSnapshot={proposal.clientSnapshot}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Estado: Erro no processamento da IA (timeout ou falha)
  if (aiProcessingError) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/propostas"
            className="flex items-center gap-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Propostas
          </Link>
          <span className="text-seasalt/50">/</span>
          <span className="text-seasalt">{proposal.title}</span>
        </div>

        <ProposalHeader proposal={proposal} />
        
        {/* Card de Erro da IA */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-2 border-red-500/30 rounded-xl p-8">
            <div className="text-center">
              {/* Ícone de erro */}
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="h-10 w-10 text-red-400" />
              </div>

              {/* Título principal */}
              <h2 className="text-2xl font-bold text-seasalt mb-2">
                ⏰ Tempo Limite Atingido
              </h2>
              
              <p className="text-seasalt/80 mb-6 text-lg max-w-2xl mx-auto">
                {aiProcessingError}
              </p>

              {/* Ações */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setAiProcessingError(null);
                    window.location.reload();
                  }}
                  className="px-6 py-3 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors font-medium"
                >
                  Recarregar Página
                </button>
                <Link
                  href="/propostas"
                  className="px-6 py-3 border border-seasalt/20 text-seasalt rounded-lg hover:bg-seasalt/10 transition-colors font-medium"
                >
                  Voltar às Propostas
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Informações adicionais - dados do formulário se disponíveis */}
        {proposal.formDataJSON && (
          <div className="mt-8">
            <div className="bg-night/30 rounded-lg p-6 border border-seasalt/10">
              <h3 className="text-seasalt/70 text-sm font-medium mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dados do Formulário (Salvos)
              </h3>
              <FormDataPanel 
                formData={proposal.formDataJSON}
                clientSnapshot={proposal.clientSnapshot}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Estado: Proposta sem conteúdo da IA (não é recente, não precisa aguardar)
  if (!proposal.aiGeneratedContent && !proposal.proposalHtml) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/propostas"
            className="flex items-center gap-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Propostas
          </Link>
          <span className="text-seasalt/50">/</span>
          <span className="text-seasalt">{proposal.title}</span>
        </div>

        <ProposalHeader proposal={proposal} />
        
        {/* Se há dados do formulário, mostra eles mesmo sem IA */}
        {proposal.formDataJSON ? (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-seasalt mb-4">Dados do Formulário</h2>
            <FormDataPanel 
              formData={proposal.formDataJSON}
              clientSnapshot={proposal.clientSnapshot}
            />
          </div>
        ) : (
          <ProposalEmptyState proposal={proposal} />
        )}
      </div>
    );
  }

  // Estado: Proposta com conteúdo da IA - EXIBIÇÃO PRINCIPAL
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link 
          href="/propostas"
          className="flex items-center gap-2 text-seasalt/70 hover:text-seasalt transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Propostas
        </Link>
        <span className="text-seasalt/50">/</span>
        <span className="text-seasalt">{proposal.title}</span>
      </div>

      <ProposalHeader proposal={proposal} />
      
      {/* Abas - FOCO NA PROPOSTA GERADA PELA IA */}
      <div className="mt-6">
        <div className="flex space-x-1 bg-night/50 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('proposal')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md text-base font-medium transition-colors ${
              activeTab === 'proposal'
                ? 'bg-sgbus-green text-night shadow-lg'
                : 'text-seasalt/70 hover:text-seasalt hover:bg-night/30'
            }`}
          >
            <Bot className="h-5 w-5" />
            🤖 Proposta Gerada pela IA
            {activeTab === 'proposal' && (
              <span className="ml-2 bg-night/20 text-night text-xs px-2 py-1 rounded-full font-semibold">
                PRINCIPAL
              </span>
            )}
          </button>
          
          {proposal.formDataJSON && (
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'form'
                  ? 'bg-seasalt/10 text-seasalt border border-seasalt/20'
                  : 'text-seasalt/50 hover:text-seasalt/70'
              }`}
            >
              <FileText className="h-4 w-4" />
              Dados do Formulário
            </button>
          )}
        </div>
        
        {activeTab === 'proposal' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Conteúdo Principal - DESTAQUE MÁXIMO */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl p-8 shadow-2xl border border-sgbus-green/20">
                <ContentRenderer 
                  htmlContent={proposal.proposalHtml}
                  markdownContent={proposal.proposalMarkdown}
                />
              </div>
            </div>
            
            {/* Sidebar com Insights */}
            <div className="lg:col-span-1">
              <AIInsightsPanel 
                insights={proposal.aiGeneratedContent?.ai_insights}
                metadata={proposal.aiGeneratedContent?.metadata}
                extraData={proposal.aiGeneratedContent?.dados_extras}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'form' && proposal.formDataJSON && (
          <div className="max-w-4xl">
            <FormDataPanel 
              formData={proposal.formDataJSON}
              clientSnapshot={proposal.clientSnapshot}
            />
          </div>
        )}
      </div>
      
      <ProposalActions proposalId={proposalId} proposal={proposal} />
    </div>
  );
} 