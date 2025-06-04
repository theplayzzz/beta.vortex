import { useState } from 'react';
import { Target, Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSpecificObjectivesPolling } from '@/lib/react-query/hooks/useSpecificObjectivesPolling';
import { TaskRefinementInterface } from './TaskRefinementInterface';
import type { PlanningWithClient } from '@/lib/react-query/hooks/usePlannings';

interface ObjectivesTabProps {
  planning: PlanningWithClient;
}

function LoadingState({ timeLeft, planning }: { timeLeft: number; planning: PlanningWithClient }) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className="text-center py-12">
      <div className="relative inline-block mb-6">
        <Loader2 className="h-12 w-12 animate-spin text-sgbus-green" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-sgbus-green/20 animate-pulse"></div>
      </div>
      
      <h3 className="text-xl font-semibold text-seasalt mb-3">
        Gerando Objetivos Específicos...
      </h3>
      
      <p className="text-seasalt/70 mb-4 max-w-md mx-auto">
        Nossa IA está analisando os dados do formulário para criar objetivos específicos 
        personalizados para <strong className="text-seasalt">{planning.Client.name}</strong>.
      </p>
      
      <div className="bg-eerie-black/50 rounded-lg p-4 inline-block">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
          <span className="text-seasalt/70">Tempo restante:</span>
          <span className="text-sgbus-green font-mono">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <div className="mt-6 text-xs text-seasalt/50">
        Este processo pode levar até 90 segundos
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  actions: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

function ErrorState({ message, actions }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-red-400 mb-3">
        Problema na Geração dos Objetivos
      </h3>
      
      <p className="text-seasalt/70 mb-8 max-w-md mx-auto">
        {message}
      </p>
      
      <div className="flex items-center justify-center gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              action.variant === 'primary' 
                ? 'bg-sgbus-green hover:bg-sgbus-green/90 text-night'
                : 'bg-eerie-black hover:bg-eerie-black/80 text-seasalt border border-accent/20'
            }`}
          >
            {action.variant === 'primary' ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ObjectivesContentProps {
  data: string;
  planning: PlanningWithClient;
}

function ObjectivesContent({ data, planning }: ObjectivesContentProps) {
  // Tentar parsear como JSON estruturado primeiro
  let structuredData;
  try {
    structuredData = JSON.parse(data);
  } catch {
    // Se não for JSON, tratar como texto simples
    structuredData = null;
  }

  if (structuredData && structuredData.tarefas && Array.isArray(structuredData.tarefas)) {
    // ✅ DADOS ESTRUTURADOS: Usar interface completa de refinamento
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-6 w-6 text-sgbus-green" />
          <h3 className="text-xl font-semibold text-seasalt">
            Objetivos Específicos Gerados pela IA
          </h3>
          <div className="px-2 py-1 bg-sgbus-green/20 text-sgbus-green text-xs rounded-full">
            ✨ Processado
          </div>
        </div>
        
        {/* Interface completa com edição, prioridades e seleção */}
        <TaskRefinementInterface 
          planning={{
            ...planning,
            specificObjectives: planning.specificObjectives || undefined, // Converter null para undefined
          }} 
          onUpdate={(updatedPlanning) => {
            // Atualizar o planning se necessário
            console.log('Planning atualizado:', updatedPlanning);
          }}
          onCreateRefinedTab={() => {
            // Callback para criar aba refinada se necessário
            console.log('Solicitação para criar aba refinada');
          }}
        />
      </div>
    );
  }

  // ✅ FALLBACK: Para dados em texto simples/HTML
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Target className="h-6 w-6 text-sgbus-green" />
        <h3 className="text-xl font-semibold text-seasalt">
          Objetivos Específicos Gerados pela IA
        </h3>
        <div className="px-2 py-1 bg-sgbus-green/20 text-sgbus-green text-xs rounded-full">
          ✨ Processado
        </div>
      </div>
      
      <div className="bg-night rounded-lg p-6 border border-accent/20">
        <div 
          className="text-seasalt/90 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: data }}
        />
      </div>
    </div>
  );
}

export function ObjectivesTab({ planning }: ObjectivesTabProps) {
  const router = useRouter();
  
  // Hook de polling condicional
  const { 
    data: pollingData, 
    isPolling, 
    hasTimedOut, 
    timeLeft 
  } = useSpecificObjectivesPolling(planning.id, planning);

  // Usar dados do polling se disponíveis, senão usar dados iniciais
  const currentData = pollingData || planning;
  
  // Determinar o estado atual
  if (currentData.specificObjectives) {
    // Dados disponíveis - mostrar conteúdo
    return <ObjectivesContent data={currentData.specificObjectives} planning={currentData} />;
  }
  
  if (hasTimedOut) {
    // Timeout - mostrar estado de erro
    return (
      <ErrorState 
        message="O processamento dos objetivos específicos não foi concluído no tempo esperado. Isso pode acontecer durante períodos de alta demanda."
        actions={[
          { 
            label: "Atualizar Página", 
            action: () => window.location.reload(),
            variant: 'primary'
          },
          { 
            label: "Criar Novo Planejamento", 
            action: () => router.push('/planejamentos/novo'),
            variant: 'secondary'
          }
        ]}
      />
    );
  }
  
  if (isPolling) {
    // Polling ativo - mostrar loading
    return <LoadingState timeLeft={timeLeft} planning={planning} />;
  }
  
  // Estado inicial - não há dados e não iniciou polling ainda
  return (
    <div className="text-center py-12">
      <Target className="h-12 w-12 mx-auto mb-4 text-seasalt/40" />
      <h3 className="text-lg font-semibold text-seasalt/70 mb-2">
        Objetivos Específicos Não Disponíveis
      </h3>
      <p className="text-seasalt/50">
        Esta funcionalidade estará disponível após o processamento do webhook.
      </p>
    </div>
  );
} 