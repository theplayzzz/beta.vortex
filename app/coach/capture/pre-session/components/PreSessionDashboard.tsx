"use client";

import { useState, useRef, useEffect } from 'react';
import SalesAgentConfigModal, { SalesAgentConfigData } from './SalesAgentConfigModal';
import { 
  Mic, 
  MonitorSpeaker, 
  Calendar,
  ChevronDown,
  Eye,
  Trash2,
  Play,
  Target,
  BarChart3,
  Clock,
  Bot,
  CreditCard,
  Zap,
  Rocket,
  Settings,
  Globe,
  FileText,
  ScrollText,
  CheckCircle,
  AlertCircle,
  Clock3,
  TrendingUp
} from 'lucide-react';

// Dados mock para demonstração
const mockMetrics = {
  'today': {
    totalSessions: 3,
    transcriptionTime: '45min',
    analysesCompleted: 2,
    creditsSpent: 65
  },
  'thisWeek': {
    totalSessions: 24,
    transcriptionTime: '2h 45m',
    analysesCompleted: 18,
    creditsSpent: 850
  },
  'thisMonth': {
    totalSessions: 87,
    transcriptionTime: '12h 23m',
    analysesCompleted: 65,
    creditsSpent: 3240
  }
};

const mockSessions = [
  {
    id: '1',
    title: 'Reunião Cliente ABC',
    duration: '45min',
    words: '2.3k',
    analyses: 3,
    credits: 45,
    timeAgo: '2h atrás',
    status: 'completed',
    confidence: 94
  },
  {
    id: '2',
    title: 'Sessão Planejamento',
    duration: '23min',
    words: '1.1k',
    analyses: 1,
    credits: 25,
    timeAgo: '1d atrás',
    status: 'completed',
    confidence: 89
  },
  {
    id: '3',
    title: 'Call Estratégico',
    duration: '67min',
    words: '4.2k',
    analyses: 5,
    credits: 85,
    timeAgo: '3d atrás',
    status: 'completed',
    confidence: 92
  }
];

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

  // Refs para detectar cliques fora dos dropdowns
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const sessionTypeDropdownRef = useRef<HTMLDivElement>(null);

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

  const currentMetrics = mockMetrics[selectedPeriod as keyof typeof mockMetrics];
  const selectedPeriodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-sgbus-green" />;
      case 'processing': return <AlertCircle size={14} className="text-yellow-400" />;
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      default: return <AlertCircle size={14} className="text-periwinkle" />;
    }
  };

  const handleStartSession = () => {
    setShowSalesAgentModal(true);
  };

  const handleSalesAgentSubmit = async (data: SalesAgentConfigData) => {
    setIsCreatingSession(true);
    
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
        window.location.href = `/coach/capture/daily-co?sessionId=${result.sessionId}`;
      } else {
        throw new Error('Erro ao obter ID da sessão');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert(`Erro ao iniciar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="mx-auto px-6 py-8 min-h-screen bg-night text-seasalt max-w-[1280px]">
      {/* Métricas Rápidas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-seasalt flex items-center gap-3">
            <Target size={32} className="text-sgbus-green" />
            Spalla AI
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-6 hover:border-sgbus-green/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <div className="mb-3">
              <span className="text-sm font-medium text-periwinkle flex items-center gap-2">
                <BarChart3 size={16} />
                Total Sessões
              </span>
            </div>
            <div>
              <div className="text-3xl font-bold text-seasalt mb-1">
                {currentMetrics.totalSessions}
              </div>
              <div className="text-xs text-periwinkle">
                +3 vs anterior
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
                {currentMetrics.transcriptionTime}
              </div>
              <div className="text-xs text-periwinkle">
                +23min vs ant.
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
                {currentMetrics.analysesCompleted}
              </div>
              <div className="text-xs text-periwinkle">
                +5 vs anterior
              </div>
            </div>
          </div>

          <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-6 hover:border-sgbus-green/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <div className="mb-3">
              <span className="text-sm font-medium text-periwinkle flex items-center gap-2">
                <CreditCard size={16} />
                Créditos Gastos
              </span>
            </div>
            <div>
              <div className="text-3xl font-bold text-seasalt mb-1">
                {currentMetrics.creditsSpent}
              </div>
              <div className="text-xs text-periwinkle">
                +120 vs ant.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Configuração da Nova Sessão */}
        <div className="flex flex-col h-full">
          <h3 className="text-xl font-semibold text-seasalt flex items-center gap-2 mb-3">
            <Zap size={20} className="text-sgbus-green" />
            Nova Sessão
          </h3>

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
                <Target size={20} />
                <span>COMEÇAR TRANSCRIÇÃO</span>
              </button>
              
              <div className="flex items-center justify-center gap-3 text-sm text-periwinkle">
                <Mic size={16} />
                <span>Microfone</span>
                <span>+</span>
                <MonitorSpeaker size={16} />
                <span>Áudio da Tela</span>
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
          <h3 className="text-xl font-semibold text-seasalt flex items-center gap-2 mb-3">
            <ScrollText size={20} className="text-sgbus-green" />
            Sessões Recentes
          </h3>

          {/* Container com scroll visível */}
          <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-2 flex-1">
            <div className="space-y-3 h-full overflow-y-auto thin-scrollbar">
            {mockSessions.map((session) => (
              <div
                key={session.id}
                className="bg-night border border-seasalt/10 rounded-lg p-4 hover:border-sgbus-green/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(session.status)}
                      <h4 className="font-semibold text-seasalt truncate">
                        {session.title}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm text-periwinkle mb-2">
                      <span className="flex items-center gap-1">
                        <Clock3 size={12} />
                        {session.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {session.words}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bot size={12} />
                        {session.analyses}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-periwinkle">
                      <span className="flex items-center gap-1">
                        <CreditCard size={10} />
                        {session.credits} créditos
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 size={10} />
                        {session.timeAgo}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 border border-seasalt/20 rounded-lg text-periwinkle hover:text-sgbus-green hover:border-sgbus-green transition-colors"
                      title="Visualizar sessão"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-2 border border-seasalt/20 rounded-lg text-periwinkle hover:text-red-400 hover:border-red-400 transition-colors"
                      title="Deletar sessão"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instruções da Sessão */}
      <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-seasalt mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-sgbus-green" />
          Instruções para Sessão
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-sgbus-green/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Mic className="text-sgbus-green" size={24} />
            </div>
            <h4 className="font-semibold text-seasalt mb-2">1. Prepare o Microfone</h4>
            <p className="text-sm text-periwinkle">
              Certifique-se de que seu microfone está funcionando e posicionado corretamente.
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-sgbus-green/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Settings className="text-sgbus-green" size={24} />
            </div>
            <h4 className="font-semibold text-seasalt mb-2">2. Configure as Opções</h4>
            <p className="text-sm text-periwinkle">
              Selecione o idioma e tipo de sessão nas configurações acima.
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-sgbus-green/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="text-sgbus-green" size={24} />
            </div>
            <h4 className="font-semibold text-seasalt mb-2">3. Inicie a Transcrição</h4>
            <p className="text-sm text-periwinkle">
              Clique no botão verde acima para começar sua sessão de transcrição.
            </p>
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