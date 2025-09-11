"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import '../styles.css';
import SalesAgentConfigModal, { SalesAgentConfigData } from './SalesAgentConfigModal';
import { transformSessionData } from '../utils/sessionDataTransform';
import SessionSkeleton from './SessionSkeleton';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import MetricsSkeleton from './MetricsSkeleton';
import { 
  Mic, 
  MonitorSpeaker, 
  Calendar,
  ChevronDown,
  Trash2,
  Play,
  Target,
  BarChart3,
  Clock,
  Bot,
  Zap,
  Rocket,
  Settings,
  Globe,
  FileText,
  ScrollText,
  CheckCircle,
  AlertCircle,
  Clock3,
} from 'lucide-react';


const periodOptions = [
  { value: 'today', label: 'Hoje' },
  { value: 'thisWeek', label: 'Esta Semana' },
  { value: 'thisMonth', label: 'Este Mês' }
];

const sessionTypes = [
  { value: 'live', label: 'Reunião ao Vivo' },
  { value: 'recorded', label: 'Reunião Gravada' }
];

export default function PreSessionDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisWeek');
  const [selectedSessionType, setSelectedSessionType] = useState('live');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showSessionTypeDropdown, setShowSessionTypeDropdown] = useState(false);
  const [showSalesAgentModal, setShowSalesAgentModal] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Real data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Refs para detectar cliques fora dos dropdowns
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const sessionTypeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Function to fetch sessions from API
  const fetchSessions = useCallback(async (period = selectedPeriod) => {
    // Only show loading on first load or when changing period
    if (sessions.length === 0) {
      setIsLoading(true)
    }
    setError(null)
    
    try {
      const response = await fetch(`/api/transcription-sessions?period=${period}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar sessões')
      }
      
      const transformedSessions = data.sessions.map(transformSessionData)
      setSessions(transformedSessions)
      setMetrics(data.metrics)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod, sessions.length])

  // Handle Play button click
  const handlePlaySession = useCallback((sessionId: string) => {
    window.location.href = `/coach/capture/daily-co?sessionId=${sessionId}`
  }, [])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePlaySession(sessionId)
    }
  }, [handlePlaySession])

  // Handle Delete button click with animation
  const handleDeleteSession = useCallback(async (sessionId: string, sessionName: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a sessão "${sessionName}"?`
    )
    
    if (!confirmed) return
    
    setDeletingSessionId(sessionId)
    
    // Add fade-out animation
    const element = document.querySelector(`[data-session-id="${sessionId}"]`)
    if (element) {
      element.classList.add('animate-fade-out')
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    try {
      const response = await fetch(`/api/transcription-sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir sessão')
      }
      
      // Remove from local list optimistically
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      // Update metrics
      if (metrics) {
        const deletedSession = sessions.find(s => s.id === sessionId)
        if (deletedSession) {
          setMetrics((prev: any) => prev ? {
            ...prev,
            totalSessions: prev.totalSessions - 1,
            analysesCompleted: prev.analysesCompleted - (deletedSession.analyses || 0)
          } : null)
        }
      }
      
    } catch (error) {
      // Restore element and show error
      if (element) {
        element.classList.remove('animate-fade-out')
      }
      setError('Erro ao excluir sessão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setDeletingSessionId(null)
    }
  }, [sessions, metrics])

  // Effects
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])
  
  // Efeito para fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
      if (sessionTypeDropdownRef.current && !sessionTypeDropdownRef.current.contains(event.target as Node)) {
        setShowSessionTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedPeriodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-sgbus-green" />;
      case 'processing': return <AlertCircle size={14} className="text-periwinkle" />;
      case 'error': return <AlertCircle size={14} className="text-periwinkle opacity-70" />;
      default: return <AlertCircle size={14} className="text-periwinkle" />;
    }
  };

  const handleStartSession = () => {
    setShowSalesAgentModal(true);
  };

  const handleSalesAgentSubmit = async (data: SalesAgentConfigData) => {
    setIsCreatingSession(true);
    
    // Adicionar pequeno delay para garantir que a animação seja visível
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const sessionData = {
        sessionName: `Sessão ${data.companyName} - ${new Date().toLocaleDateString()}`,
        companyName: data.companyName,
        industry: data.industry,
        customIndustry: data.customIndustry,
        revenue: data.revenue,
        agentType: data.agentType,
        spinQuestions: {
          situation: data.situation,
          problem: data.problem,
          implication: data.implication,
          solutionNeed: data.solutionNeed
        }
      };

      const response = await fetch('/api/transcription-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sessão');
      }

      const result = await response.json();
      
      if (result.success && result.sessionId) {
        // Adicionar pequeno delay adicional para transição suave
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fazer fade out antes de redirecionar
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
          window.location.href = `/coach/capture/daily-co?sessionId=${result.sessionId}`;
        }, 300);
      } else {
        throw new Error('Erro ao obter ID da sessão');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      // Restaurar opacidade em caso de erro
      document.body.style.opacity = '1';
      alert(`Erro ao iniciar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="mx-auto px-6 py-6 bg-night text-seasalt max-w-[1280px]">
      {/* Métricas Rápidas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-seasalt flex items-center gap-3">
            <Target size={32} className="text-sgbus-green" />
            Copiloto Spalla
          </h1>
          
          {/* Seletor de Período */}
          <div className="relative" ref={periodDropdownRef}>
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-eerie-black text-seasalt border border-seasalt/10 rounded-lg hover:border-sgbus-green/50 transition-all duration-200"
            >
              <Calendar size={16} />
              <span>{selectedPeriodLabel}</span>
              <ChevronDown size={16} />
            </button>

            {showPeriodDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 z-50 bg-eerie-black border border-seasalt/10 rounded-lg shadow-xl">
                {periodOptions.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      setShowPeriodDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      selectedPeriod === option.value 
                        ? 'bg-sgbus-green text-night' 
                        : 'text-seasalt hover:bg-seasalt/10'
                    } ${
                      index === 0 ? 'rounded-t-lg' : 
                      index === periodOptions.length - 1 ? 'rounded-b-lg' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cards de Métricas */}
        {isLoading ? (
          <MetricsSkeleton />
        ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-6 hover:border-sgbus-green/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <span className="text-sm font-medium text-periwinkle flex items-center gap-2">
                  <BarChart3 size={16} />
                  Total Sessões
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold text-seasalt mb-1">
                  {metrics.totalSessions}
                </div>
                <div className="text-xs text-periwinkle">
                  período selecionado
                </div>
              </div>
            </div>

            <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-6 hover:border-sgbus-green/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <span className="text-sm font-medium text-periwinkle flex items-center gap-2">
                  <Clock size={16} />
                  Tempo Transcrição
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold text-seasalt mb-1">
                  {metrics.transcriptionTime}
                </div>
                <div className="text-xs text-periwinkle">
                  tempo total
                </div>
              </div>
            </div>

            <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-6 hover:border-sgbus-green/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <span className="text-sm font-medium text-periwinkle flex items-center gap-2">
                  <Bot size={16} />
                  Análises Efetuadas
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold text-seasalt mb-1">
                  {metrics.analysesCompleted}
                </div>
                <div className="text-xs text-periwinkle">
                  análises realizadas
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-6">
            <p className="text-periwinkle text-center">Carregue algumas sessões para ver as métricas</p>
          </div>
        )}
      </div>

      {/* Área Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Configuração da Nova Sessão */}
        <div className="flex flex-col h-full">

          {/* Container principal */}
          <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-2 flex-1 flex flex-col space-y-3">
            {/* Card Principal de Inicialização */}
            <div className="bg-night border-2 border-sgbus-green rounded-lg p-6 flex-shrink-0">
            <div className="text-center space-y-6">
              <h4 className="text-2xl font-bold text-seasalt flex items-center justify-center gap-3">
                <Rocket size={24} className="text-sgbus-green" />
                INICIAR NOVA SESSÃO
              </h4>
              
              <div className="border-t border-seasalt/10"></div>
              
              <button
                onClick={handleStartSession}
                className="w-full bg-sgbus-green hover:bg-sgbus-green/90 text-night font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
              >
                <Play size={24} />
                <span>CRIAR SESSÃO</span>
              </button>
              
              <div className="text-center text-sm text-periwinkle space-y-1">
                <p>Ao clicar em <span className="text-sgbus-green font-medium">Criar Sessão</span>, você:</p>
                <p>1. Preencherá um formulário de configuração</p>
                <p>2. Entrará na sala da sessão criada</p>
                <p>3. Poderá iniciar a transcrição em tempo real</p>
              </div>
            </div>
            </div>

            {/* Configurações Rápidas */}
            <div className="bg-night/50 rounded-lg p-4 space-y-4 flex-1">
            <h5 className="font-semibold text-seasalt flex items-center gap-2">
              <Settings size={16} />
              Configurações Rápidas
            </h5>
            
            <div className="border-t border-seasalt/10"></div>
            
            <div className="space-y-4">
              {/* Idioma */}
              <div>
                <label className="flex text-sm font-medium text-seasalt mb-2 items-center gap-2">
                  <Globe size={14} />
                  Idioma:
                </label>
                <div className="w-full flex items-center px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg">
                  <span>Português</span>
                </div>
              </div>

              {/* Tipo de Sessão */}
              <div className="relative" ref={sessionTypeDropdownRef}>
                <label className="flex text-sm font-medium text-seasalt mb-2 items-center gap-2">
                  <FileText size={14} />
                  Tipo de Sessão:
                </label>
                <button
                  onClick={() => setShowSessionTypeDropdown(!showSessionTypeDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg hover:border-sgbus-green/50 transition-all duration-200"
                >
                  <span>{sessionTypes.find(t => t.value === selectedSessionType)?.label}</span>
                  <ChevronDown size={16} />
                </button>

                {showSessionTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-eerie-black border border-seasalt/10 rounded-lg shadow-xl">
                    {sessionTypes.map((type, index) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setSelectedSessionType(type.value);
                          setShowSessionTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          selectedSessionType === type.value 
                            ? 'bg-sgbus-green text-night' 
                            : 'text-seasalt hover:bg-seasalt/10'
                        } ${
                          index === 0 ? 'rounded-t-lg' : 
                          index === sessionTypes.length - 1 ? 'rounded-b-lg' : ''
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Sessões Recentes */}
        <div className="flex flex-col h-full">

          {/* Container com scroll - altura controlada */}
          <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-2 flex-1 overflow-hidden">
            <div 
              className="space-y-3 max-h-[510px] overflow-y-auto thin-scrollbar" 
              data-testid="sessions-list"
              role="list" 
              aria-label="Lista de sessões de transcrição"
            >
              {isLoading ? (
                <SessionSkeleton />
              ) : error ? (
                <ErrorState error={error} onRetry={() => fetchSessions(selectedPeriod)} />
              ) : sessions.length === 0 ? (
                <EmptyState />
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    data-testid="session-item"
                    data-session-id={session.id}
                    role="listitem"
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, session.id)}
                    aria-label={`Sessão ${session.title}, ${session.duration}, ${session.timeAgo}`}
                    className="bg-night border border-seasalt/10 rounded-lg p-4 hover:border-sgbus-green/30 focus:border-sgbus-green/50 focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(session.status)}
                          <h4 className="font-semibold text-seasalt truncate" data-testid="session-title">
                            {session.title}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm text-periwinkle mb-2">
                          <span className="flex items-center gap-1" aria-label={`Duração: ${session.duration}`}>
                            <Clock3 size={12} aria-hidden="true" />
                            {session.duration}
                          </span>
                          <span className="flex items-center gap-1" aria-label={`Palavras: ${session.words}`}>
                            <FileText size={12} aria-hidden="true" />
                            {session.words}
                          </span>
                          <span className="flex items-center gap-1" aria-label={`Análises: ${session.analyses}`}>
                            <Bot size={12} aria-hidden="true" />
                            {session.analyses}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-periwinkle">
                          <span className="flex items-center gap-1" aria-label={`Criada: ${session.timeAgo}`}>
                            <Clock3 size={10} aria-hidden="true" />
                            {session.timeAgo}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePlaySession(session.id)}
                          className="p-2 border border-seasalt/20 rounded-lg text-periwinkle hover:text-sgbus-green hover:border-sgbus-green focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 transition-colors"
                          title="Reproduzir sessão"
                          aria-label={`Reproduzir sessão ${session.title}`}
                          data-testid="play-session-btn"
                        >
                          <Play size={16} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id, session.title)}
                          disabled={deletingSessionId === session.id}
                          className={`p-2 border border-seasalt/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-periwinkle/20 ${
                            deletingSessionId === session.id
                              ? 'text-periwinkle/50 border-seasalt/10 cursor-not-allowed'
                              : 'text-periwinkle hover:text-seasalt hover:border-seasalt/30 focus:border-seasalt/30'
                          }`}
                          title="Excluir sessão"
                          aria-label={`Excluir sessão ${session.title}`}
                          data-testid="delete-session-btn"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Sales Agent Configuration Modal */}
      <SalesAgentConfigModal
        isOpen={showSalesAgentModal}
        onClose={() => setShowSalesAgentModal(false)}
        onSubmit={handleSalesAgentSubmit}
        isLoading={isCreatingSession}
      />
    </div>
  );
}