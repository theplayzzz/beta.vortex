'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Edit3, 
  MoreVertical,
  Clock,
  Target,
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react';
import { FormDataDisplay } from './FormDataDisplay';
import { RichnessScoreBadge } from './RichnessScoreBadge';
import { TaskRefinementInterface } from './TaskRefinementInterface';
import { RefinedTaskList } from './RefinedTaskList';
import { TaskDetailModal } from './TaskDetailModal';
import type { Planning, TarefaRefinada } from '@/types/planning';

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  businessDetails?: string;
  contactEmail?: string;
  website?: string;
}

interface PlanningDetailsProps {
  planning: Planning;
  isLoading?: boolean;
}

const statusConfig = {
  DRAFT: {
    label: 'Rascunho',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: '📝'
  },
  ACTIVE: {
    label: 'Ativo',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '🚀'
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: '✅'
  },
  ARCHIVED: {
    label: 'Arquivado',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: '📦'
  },
  PENDING_AI_BACKLOG_GENERATION: {
    label: 'Aguardando IA',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: '🤖'
  },
  AI_BACKLOG_VISIBLE: {
    label: 'Backlog IA Gerado',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    icon: '🎯'
  },
  PENDING_AI_REFINED_LIST: {
    label: 'Aguardando Lista Refinada',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: '⚙️'
  }
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays < 7) return `${diffInDays} dias atrás`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
  return `${Math.floor(diffInDays / 30)} meses atrás`;
}

// Função para verificar se specificObjectives contém tarefas estruturadas
function hasStructuredTasks(specificObjectives?: string): boolean {
  if (!specificObjectives) return false;
  
  try {
    const parsed = JSON.parse(specificObjectives);
    return parsed.tarefas && Array.isArray(parsed.tarefas) && parsed.tarefas.length > 0;
  } catch {
    return false;
  }
}

// Função para verificar se scope contém tarefas refinadas
function hasRefinedTasks(scope?: string): boolean {
  if (!scope) return false;
  
  try {
    const parsed = JSON.parse(scope);
    return parsed.tarefas_refinadas && Array.isArray(parsed.tarefas_refinadas) && parsed.tarefas_refinadas.length > 0;
  } catch {
    return false;
  }
}

export function PlanningDetails({ planning, isLoading = false }: PlanningDetailsProps) {
  const [currentTab, setCurrentTab] = useState<'form_data' | 'objectives' | 'planejamento-refinado'>('form_data');
  const [currentPlanning, setCurrentPlanning] = useState(planning);
  const [isPolling, setIsPolling] = useState(false);
  
  // Estados para modal de detalhes da tarefa
  const [selectedTask, setSelectedTask] = useState<TarefaRefinada | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Sistema de polling para atualização automática
  useEffect(() => {
    const isWaitingForWebhook = currentPlanning.status === 'PENDING_AI_REFINED_LIST';
    const alreadyHasRefinedTasks = hasRefinedTasks(currentPlanning.scope);
    
    // Se não está aguardando webhook OU já tem dados refinados, não fazer polling
    if (!isWaitingForWebhook || alreadyHasRefinedTasks) {
      setIsPolling(false);
      
      // Se já tem dados refinados mas status ainda é PENDING, ativar aba automaticamente
      if (alreadyHasRefinedTasks && isWaitingForWebhook) {
        console.log('🎯 Dados refinados já existem! Ativando aba automaticamente...');
        setCurrentTab('planejamento-refinado');
      }
      
      return;
    }

    setIsPolling(true);
    console.log('🔄 Iniciando polling para verificar atualização do webhook...', {
      planningId: currentPlanning.id,
      currentStatus: currentPlanning.status,
      hasScope: !!currentPlanning.scope,
      hasParsedTasks: alreadyHasRefinedTasks
    });
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔍 Verificando atualizações...');
        const response = await fetch(`/api/plannings/${currentPlanning.id}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const updatedPlanning = await response.json();
          
          // Verificar se o status mudou ou se dados foram adicionados/atualizados
          const statusChanged = updatedPlanning.status !== currentPlanning.status;
          const scopeAdded = updatedPlanning.scope && !currentPlanning.scope;
          const scopeUpdated = updatedPlanning.scope !== currentPlanning.scope;
          const hasNewRefinedTasks = hasRefinedTasks(updatedPlanning.scope);
          
          if (statusChanged || scopeAdded || scopeUpdated || hasNewRefinedTasks) {
            console.log('✅ Dados atualizados detectados! Atualizando interface...', {
              statusChanged,
              scopeAdded,
              scopeUpdated,
              hasNewRefinedTasks,
              oldStatus: currentPlanning.status,
              newStatus: updatedPlanning.status,
              hasScope: !!updatedPlanning.scope,
              scopeLength: updatedPlanning.scope?.length || 0
            });
            
            setCurrentPlanning(updatedPlanning);
            setIsPolling(false);
            
            // Se foi criado/atualizado o planejamento refinado, ativar a aba automaticamente
            if (hasNewRefinedTasks) {
              console.log('🎯 Ativando aba "Planejamento Refinado" automaticamente');
              setCurrentTab('planejamento-refinado');
            }
          } else {
            console.log('⏳ Ainda aguardando dados refinados...');
          }
        } else {
          console.error('❌ Erro na resposta do polling:', response.status);
        }
      } catch (error) {
        console.error('❌ Erro no polling:', error);
      }
    }, 10000); // Verificar a cada 10 segundos conforme solicitado

    // Cleanup do intervalo
    return () => {
      console.log('🛑 Parando polling...');
      setIsPolling(false);
      clearInterval(pollInterval);
    };
  }, [currentPlanning.status, currentPlanning.id, currentPlanning.scope]);

  // Atualizar estado quando prop planning mudar
  useEffect(() => {
    setCurrentPlanning(planning);
  }, [planning]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-eerie-black rounded w-1/3"></div>
          <div className="h-4 bg-eerie-black rounded w-2/3"></div>
          <div className="h-32 bg-eerie-black rounded"></div>
        </div>
      </div>
    );
  }

  const status = statusConfig[currentPlanning.status as keyof typeof statusConfig] || statusConfig.DRAFT;
  
  // Verificar estados das abas
  const hasSpecificObjectives = currentPlanning.specificObjectives && currentPlanning.specificObjectives.trim().length > 0;
  const hasTasksForRefinement = hasStructuredTasks(currentPlanning.specificObjectives);
  const isObjectivesProcessing = currentPlanning.status === 'PENDING_AI_BACKLOG_GENERATION';
  
  // Estados da nova aba de Planejamento Refinado
  const hasRefinedPlanningTasks = hasRefinedTasks(currentPlanning.scope);
  const isRefinedListProcessing = currentPlanning.status === 'PENDING_AI_REFINED_LIST' && !hasRefinedPlanningTasks;
  const showRefinedPlanningTab = isRefinedListProcessing || hasRefinedPlanningTasks;

  const handlePlanningUpdate = (updatedPlanning: Planning) => {
    setCurrentPlanning(updatedPlanning);
  };

  // Callback para ativar automaticamente a aba "Planejamento Refinado"
  const handleCreateRefinedTab = () => {
    setCurrentTab('planejamento-refinado');
  };

  // Handler para abrir modal de detalhes da tarefa
  const handleTaskClick = (task: TarefaRefinada, index: number) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Handler para fechar modal de detalhes
  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  // Função para parsear tarefas refinadas do campo scope
  const getRefinedTasks = (): TarefaRefinada[] => {
    if (!currentPlanning.scope) return [];
    
    try {
      const parsed = JSON.parse(currentPlanning.scope);
      return parsed.tarefas_refinadas || [];
    } catch {
      return [];
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Simplificado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/planejamentos"
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-eerie-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">{currentPlanning.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${status.color}`}>
                <span className="mr-1">{status.icon}</span>
                {status.label}
              </div>
              <span className="text-seasalt/70 text-sm">
                Cliente: {currentPlanning.Client.name}
              </span>
              <RichnessScoreBadge score={currentPlanning.Client.richnessScore} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/planejamentos/${currentPlanning.id}/editar`}
            className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Link>
          <button className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-eerie-black">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Metadados Compactos */}
      <div className="bg-eerie-black rounded-lg border border-accent/20 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-seasalt/70">Criado:</span>
              <span className="text-seasalt">{formatDate(currentPlanning.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-seasalt/70">Atualizado:</span>
              <span className="text-seasalt">{formatDate(currentPlanning.updatedAt)}</span>
            </div>
          </div>
          {currentPlanning.description && (
            <div className="text-seasalt/70 max-w-md truncate">
              {currentPlanning.description}
            </div>
          )}
        </div>
      </div>

      {/* Sistema de Abas */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
        {/* Navigation Tabs */}
        <nav className="flex border-b border-seasalt/20 p-4">
          <button
            onClick={() => setCurrentTab('form_data')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors mr-8 ${
              currentTab === 'form_data'
                ? 'border-sgbus-green text-sgbus-green'
                : 'border-transparent text-periwinkle hover:text-seasalt hover:border-seasalt/40'
            }`}
          >
            <span className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Dados do Formulário</span>
            </span>
          </button>
          
          <button
            onClick={() => (hasSpecificObjectives || hasTasksForRefinement) && setCurrentTab('objectives')}
            disabled={!hasSpecificObjectives && !hasTasksForRefinement && !isObjectivesProcessing}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors mr-8 ${
              currentTab === 'objectives'
                ? 'border-sgbus-green text-sgbus-green'
                : (hasSpecificObjectives || hasTasksForRefinement)
                  ? 'border-transparent text-periwinkle hover:text-seasalt hover:border-seasalt/40'
                  : 'border-transparent text-seasalt/40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center space-x-2">
              {isObjectivesProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
              <span>Objetivos Específicos</span>
              {!hasSpecificObjectives && !hasTasksForRefinement && !isObjectivesProcessing && (
                <span className="text-xs bg-seasalt/20 px-2 py-1 rounded">Aguardando IA</span>
              )}
            </span>
          </button>

          {/* Nova Aba "Planejamento Refinado" */}
          {showRefinedPlanningTab && (
            <button
              onClick={() => setCurrentTab('planejamento-refinado')}
              className={`pb-3 border-b-2 font-medium text-sm transition-colors relative ${
                currentTab === 'planejamento-refinado'
                  ? 'border-sgbus-green text-sgbus-green'
                  : 'border-transparent text-periwinkle hover:text-seasalt hover:border-seasalt/40'
              } ${isRefinedListProcessing || isPolling ? 'animate-pulse' : ''}`}
            >
              <span className="flex items-center space-x-2">
                {isRefinedListProcessing || isPolling ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sgbus-green" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Planejamento Refinado</span>
                {isRefinedListProcessing && !isPolling && (
                  <span className="text-xs bg-sgbus-green/20 text-sgbus-green px-2 py-1 rounded animate-pulse">
                    IA Gerando...
                  </span>
                )}
                {isPolling && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded animate-pulse">
                    Verificando...
                  </span>
                )}
                {hasRefinedPlanningTasks && !isRefinedListProcessing && !isPolling && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Pronto
                  </span>
                )}
              </span>
              
              {/* Destaque visual para nova aba */}
              {(isRefinedListProcessing || isPolling || hasRefinedPlanningTasks) && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-sgbus-green rounded-full animate-ping"></div>
              )}
            </button>
          )}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {currentTab === 'form_data' ? (
            <FormDataDisplay formData={currentPlanning.formDataJSON} />
          ) : currentTab === 'objectives' ? (
            <div className="space-y-4">
              {isObjectivesProcessing ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-sgbus-green" />
                  <h3 className="text-lg font-semibold text-seasalt mb-2">
                    Processando Objetivos Específicos
                  </h3>
                  <p className="text-seasalt/70">
                    Nossa IA está analisando os dados do formulário para gerar objetivos específicos personalizados.
                    Isso pode levar alguns minutos.
                  </p>
                </div>
              ) : hasTasksForRefinement ? (
                // Interface de refinamento de tarefas
                <TaskRefinementInterface 
                  planning={currentPlanning} 
                  onUpdate={handlePlanningUpdate}
                  onCreateRefinedTab={handleCreateRefinedTab}
                />
              ) : hasSpecificObjectives ? (
                // Exibição simples (fallback para objetivos não estruturados)
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-6 w-6 text-sgbus-green" />
                    <h3 className="text-xl font-semibold text-seasalt">
                      Objetivos Específicos Gerados pela IA
                    </h3>
                  </div>
                  <div className="bg-night rounded-lg p-6 border border-accent/20">
                    <div 
                      className="text-seasalt/90 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentPlanning.specificObjectives || '' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="h-8 w-8 mx-auto mb-4 text-seasalt/40" />
                  <h3 className="text-lg font-semibold text-seasalt/70 mb-2">
                    Objetivos Específicos Não Disponíveis
                  </h3>
                  <p className="text-seasalt/50">
                    Esta funcionalidade estará disponível após o processamento do webhook.
                  </p>
                </div>
              )}
            </div>
          ) : currentTab === 'planejamento-refinado' ? (
            <div className="space-y-4">
              {isRefinedListProcessing ? (
                <div className="text-center py-12">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-sgbus-green" />
                    <div className="absolute -inset-4 bg-sgbus-green/20 rounded-full animate-ping"></div>
                  </div>
                  <div className="bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg p-4 mb-4 inline-block">
                    <h3 className="text-lg font-semibold text-sgbus-green mb-2">
                      IA está gerando...
                    </h3>
                    <p className="text-sgbus-green/80 text-sm">
                      Aguarde enquanto nossa IA processa as tarefas aprovadas e cria o planejamento refinado.
                    </p>
                  </div>
                </div>
              ) : hasRefinedPlanningTasks ? (
                // Lista de tarefas refinadas estilo ClickUp
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-6 w-6 text-sgbus-green" />
                    <h3 className="text-xl font-semibold text-seasalt">
                      Planejamento Refinado
                    </h3>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Planejamento refinado pronto
                    </span>
                  </div>
                  
                  {/* Lista de tarefas refinadas */}
                  <RefinedTaskList
                    tasks={getRefinedTasks()}
                    onTaskClick={handleTaskClick}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-8 w-8 mx-auto mb-4 text-seasalt/40" />
                  <h3 className="text-lg font-semibold text-seasalt/70 mb-2">
                    Planejamento Refinado Não Disponível
                  </h3>
                  <p className="text-seasalt/50">
                    Esta aba será ativada após a aprovação de tarefas.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal de Detalhes da Tarefa */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
      />
    </div>
  );
} 