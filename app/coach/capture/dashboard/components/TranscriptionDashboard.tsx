"use client";

import { useState } from 'react';
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

// Design System Colors - seguindo regras-design-moderno-v1.mdc
const designColors = {
  background: '#1a1b1e',
  foreground: '#f0f0f0', 
  card: '#222327',
  cardForeground: '#f0f0f0',
  primary: '#8c5cff',
  primaryForeground: '#dadada',
  secondary: '#262626',
  secondaryForeground: '#dadada',
  muted: '#2a2c33',
  mutedForeground: '#a0a0a0',
  border: '#33353a',
  input: '#33353a',
  destructive: '#f87171',
};

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
  },
  'last7Days': {
    totalSessions: 21,
    transcriptionTime: '2h 31m',
    analysesCompleted: 16,
    creditsSpent: 780
  },
  'last30Days': {
    totalSessions: 89,
    transcriptionTime: '13h 8m',
    analysesCompleted: 68,
    creditsSpent: 3450
  },
  'last3Months': {
    totalSessions: 234,
    transcriptionTime: '34h 52m',
    analysesCompleted: 189,
    creditsSpent: 8960
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
  },
  {
    id: '4',
    title: 'Workshop IA',
    duration: '89min',
    words: '6.7k',
    analyses: 8,
    credits: 125,
    timeAgo: '1 semana atrás',
    status: 'completed',
    confidence: 96
  },
  {
    id: '5',
    title: 'Reunião Semanal',
    duration: '34min',
    words: '1.8k',
    analyses: 2,
    credits: 35,
    timeAgo: '1 semana atrás',
    status: 'completed',
    confidence: 88
  },
  {
    id: '6',
    title: 'Apresentação Produto',
    duration: '125min',
    words: '9.1k',
    analyses: 12,
    credits: 180,
    timeAgo: '2 semanas atrás',
    status: 'completed',
    confidence: 91
  }
];

const periodOptions = [
  { value: 'today', label: 'Hoje' },
  { value: 'thisWeek', label: 'Esta Semana' },
  { value: 'thisMonth', label: 'Este Mês' },
  { value: 'last7Days', label: 'Últimos 7 dias' },
  { value: 'last30Days', label: 'Últimos 30 dias' },
  { value: 'last3Months', label: 'Últimos 3 meses' }
];

const sessionTypes = [
  { value: 'live', label: 'Reunião ao Vivo' },
  { value: 'recorded', label: 'Reunião Gravada' }
];

const languages = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' }
];

export default function TranscriptionDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisWeek');
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [selectedSessionType, setSelectedSessionType] = useState('live');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showSessionTypeDropdown, setShowSessionTypeDropdown] = useState(false);

  const currentMetrics = mockMetrics[selectedPeriod as keyof typeof mockMetrics];
  const selectedPeriodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} style={{ color: '#4ade80' }} />;
      case 'processing': return <AlertCircle size={14} style={{ color: '#facc15' }} />;
      case 'error': return <AlertCircle size={14} style={{ color: designColors.destructive }} />;
      default: return <AlertCircle size={14} style={{ color: designColors.mutedForeground }} />;
    }
  };

  const handleStartSession = () => {
    window.location.href = '/coach/capture/daily-co';
  };

  return (
    <div style={{
      padding: '1.5rem',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: designColors.background,
      color: designColors.foreground,
      fontFamily: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
      letterSpacing: '-0.025em',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: '700',
          color: designColors.foreground,
          letterSpacing: '-0.025em',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Target size={32} style={{ color: designColors.primary }} />
          Dashboard Transcrição
        </h1>
      </div>

      {/* Métricas Principais */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: designColors.foreground,
            letterSpacing: '-0.025em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={20} style={{ color: designColors.primary }} />
            Métricas Principais
          </h2>
          
          {/* Seletor de Período */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: designColors.card,
                color: designColors.cardForeground,
                border: `1px solid ${designColors.border}`,
                borderRadius: '1.3rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
                fontWeight: '500',
                letterSpacing: '-0.025em',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              <Calendar size={16} />
              <span>{selectedPeriodLabel}</span>
              <ChevronDown size={16} />
            </button>

            {showPeriodDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.5rem',
                width: '12rem',
                zIndex: 50,
                backgroundColor: designColors.card,
                color: designColors.cardForeground,
                border: `1px solid ${designColors.border}`,
                borderRadius: '1.4rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              }}>
                {periodOptions.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      setShowPeriodDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      transition: 'colors 0.2s',
                      fontFamily: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                      letterSpacing: '-0.025em',
                      color: selectedPeriod === option.value ? designColors.primaryForeground : designColors.cardForeground,
                      backgroundColor: selectedPeriod === option.value ? designColors.primary : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: index === 0 ? '1.4rem 1.4rem 0 0' : 
                               index === periodOptions.length - 1 ? '0 0 1.4rem 1.4rem' : '0'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPeriod !== option.value) {
                        e.currentTarget.style.backgroundColor = designColors.muted;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPeriod !== option.value) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cards de Métricas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* Total Sessões */}
          <div style={{
            backgroundColor: designColors.card,
            color: designColors.cardForeground,
            border: `1px solid ${designColors.border}`,
            borderRadius: '1.4rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <BarChart3 size={16} />
                Total Sessões
              </span>
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: designColors.foreground,
                letterSpacing: '-0.025em',
                marginBottom: '0.25rem'
              }}>
                {currentMetrics.totalSessions}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em'
              }}>
                +3 vs anterior
              </div>
            </div>
          </div>

          {/* Tempo Transcrição */}
          <div style={{
            backgroundColor: designColors.card,
            color: designColors.cardForeground,
            border: `1px solid ${designColors.border}`,
            borderRadius: '1.4rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={16} />
                Tempo Transcrição
              </span>
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: designColors.foreground,
                letterSpacing: '-0.025em',
                marginBottom: '0.25rem'
              }}>
                {currentMetrics.transcriptionTime}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em'
              }}>
                +23min vs ant.
              </div>
            </div>
          </div>

          {/* Análises Efetuadas */}
          <div style={{
            backgroundColor: designColors.card,
            color: designColors.cardForeground,
            border: `1px solid ${designColors.border}`,
            borderRadius: '1.4rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Bot size={16} />
                Análises Efetuadas
              </span>
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: designColors.foreground,
                letterSpacing: '-0.025em',
                marginBottom: '0.25rem'
              }}>
                {currentMetrics.analysesCompleted}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em'
              }}>
                +5 vs anterior
              </div>
            </div>
          </div>

          {/* Créditos Gastos */}
          <div style={{
            backgroundColor: designColors.card,
            color: designColors.cardForeground,
            border: `1px solid ${designColors.border}`,
            borderRadius: '1.4rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CreditCard size={16} />
                Créditos Gastos
              </span>
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: designColors.foreground,
                letterSpacing: '-0.025em',
                marginBottom: '0.25rem'
              }}>
                {currentMetrics.creditsSpent}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em'
              }}>
                +120 vs ant.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Inicialização de Sessão */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: designColors.foreground,
            letterSpacing: '-0.025em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={20} style={{ color: designColors.primary }} />
            Inicialização de Sessão
          </h3>

          {/* Botão Principal */}
          <div style={{
            backgroundColor: designColors.card,
            color: designColors.cardForeground,
            border: `2px solid ${designColors.primary}`,
            borderRadius: '1.4rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            padding: '2rem'
          }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: designColors.foreground,
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Rocket size={24} style={{ color: designColors.primary }} />
                INICIAR NOVA SESSÃO
              </h4>
              <div style={{ borderTop: `1px solid ${designColors.border}` }}></div>
              <button
                onClick={handleStartSession}
                style={{
                  width: '100%',
                  backgroundColor: designColors.primary,
                  color: designColors.primaryForeground,
                  fontWeight: '600',
                  fontSize: '1.125rem',
                  padding: '1rem 1.5rem',
                  borderRadius: '1.3rem',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7c4ce6';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = designColors.primary;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
              >
                <Play size={24} />
                <Target size={20} />
                <span>COMEÇAR TRANSCRIÇÃO</span>
              </button>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem', 
                fontSize: '0.875rem', 
                color: designColors.mutedForeground,
                letterSpacing: '-0.025em'
              }}>
                <Mic size={16} />
                <span>Microfone</span>
                <span>+</span>
                <MonitorSpeaker size={16} />
                <span>Áudio Tela</span>
              </div>
            </div>
          </div>

          {/* Configurações Rápidas */}
          <div style={{
            backgroundColor: designColors.muted,
            borderRadius: '1.4rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h5 style={{
              fontWeight: '600',
              color: designColors.foreground,
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Settings size={16} />
              Configurações Rápidas
            </h5>
            <div style={{ borderTop: `1px solid ${designColors.border}` }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Idioma */}
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: designColors.foreground,
                  letterSpacing: '-0.025em',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Globe size={14} />
                  Idioma:
                </label>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: designColors.input,
                    color: designColors.foreground,
                    border: `1px solid ${designColors.border}`,
                    borderRadius: '1.3rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  <span>{languages.find(l => l.value === selectedLanguage)?.label}</span>
                  <ChevronDown size={16} />
                </button>

                {showLanguageDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    zIndex: 40,
                    backgroundColor: designColors.card,
                    color: designColors.cardForeground,
                    border: `1px solid ${designColors.border}`,
                    borderRadius: '1.4rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}>
                    {languages.map((lang, index) => (
                      <button
                        key={lang.value}
                        onClick={() => {
                          setSelectedLanguage(lang.value);
                          setShowLanguageDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          transition: 'colors 0.2s',
                          fontFamily: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                          letterSpacing: '-0.025em',
                          color: selectedLanguage === lang.value ? designColors.primaryForeground : designColors.cardForeground,
                          backgroundColor: selectedLanguage === lang.value ? designColors.primary : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: index === 0 ? '1.4rem 1.4rem 0 0' : 
                                       index === languages.length - 1 ? '0 0 1.4rem 1.4rem' : '0'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLanguage !== lang.value) {
                            e.currentTarget.style.backgroundColor = designColors.muted;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLanguage !== lang.value) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tipo de Sessão */}
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: designColors.foreground,
                  letterSpacing: '-0.025em',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FileText size={14} />
                  Tipo:
                </label>
                <button
                  onClick={() => setShowSessionTypeDropdown(!showSessionTypeDropdown)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: designColors.input,
                    color: designColors.foreground,
                    border: `1px solid ${designColors.border}`,
                    borderRadius: '1.3rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  <span>{sessionTypes.find(t => t.value === selectedSessionType)?.label}</span>
                  <ChevronDown size={16} />
                </button>

                {showSessionTypeDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    zIndex: 40,
                    backgroundColor: designColors.card,
                    color: designColors.cardForeground,
                    border: `1px solid ${designColors.border}`,
                    borderRadius: '1.4rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}>
                    {sessionTypes.map((type, index) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setSelectedSessionType(type.value);
                          setShowSessionTypeDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          transition: 'colors 0.2s',
                          fontFamily: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                          letterSpacing: '-0.025em',
                          color: selectedSessionType === type.value ? designColors.primaryForeground : designColors.cardForeground,
                          backgroundColor: selectedSessionType === type.value ? designColors.primary : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: index === 0 ? '1.4rem 1.4rem 0 0' : 
                                       index === sessionTypes.length - 1 ? '0 0 1.4rem 1.4rem' : '0'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSessionType !== type.value) {
                            e.currentTarget.style.backgroundColor = designColors.muted;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSessionType !== type.value) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
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

        {/* Histórico de Sessões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: designColors.foreground,
            letterSpacing: '-0.025em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ScrollText size={20} style={{ color: designColors.primary }} />
            Histórico de Sessões
          </h3>

          {/* Lista com Scroll */}
          <div style={{
            height: '24rem',
            overflowY: 'auto',
            paddingRight: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {mockSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  backgroundColor: designColors.card,
                  color: designColors.cardForeground,
                  border: `1px solid ${designColors.border}`,
                  borderRadius: '1.4rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                  padding: '1rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = designColors.primary + '80';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = designColors.border;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span>{getStatusIcon(session.status)}</span>
                      <h4 style={{
                        fontWeight: '600',
                        color: designColors.foreground,
                        letterSpacing: '-0.025em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {session.title}
                      </h4>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: designColors.mutedForeground,
                      letterSpacing: '-0.025em',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock3 size={12} />
                        {session.duration}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={12} />
                        {session.words} palavras
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Bot size={12} />
                        {session.analyses} análises
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.75rem',
                      color: designColors.mutedForeground,
                      letterSpacing: '-0.025em',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CreditCard size={10} />
                        {session.credits} créditos
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock3 size={10} />
                        {session.timeAgo}
                      </span>
                    </div>
                    
                    <div style={{
                      fontSize: '0.75rem',
                      color: designColors.mutedForeground,
                      letterSpacing: '-0.025em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <TrendingUp size={10} />
                        Confiança: {session.confidence}%
                      </span>
                      <span>|</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mic size={10} />
                        Mic
                      </span>
                      <span>+</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MonitorSpeaker size={10} />
                        Tela
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    opacity: 0.6,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.6';
                  }}>
                    <button
                      style={{
                        padding: '0.5rem',
                        border: `1px solid ${designColors.border}`,
                        borderRadius: '1.2rem',
                        color: designColors.mutedForeground,
                        backgroundColor: 'transparent',
                        transition: 'colors 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = designColors.primary;
                        e.currentTarget.style.borderColor = designColors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = designColors.mutedForeground;
                        e.currentTarget.style.borderColor = designColors.border;
                      }}
                      title="Visualizar sessão"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      style={{
                        padding: '0.5rem',
                        border: `1px solid ${designColors.border}`,
                        borderRadius: '1.2rem',
                        color: designColors.mutedForeground,
                        backgroundColor: 'transparent',
                        transition: 'colors 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = designColors.destructive;
                        e.currentTarget.style.borderColor = designColors.destructive;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = designColors.mutedForeground;
                        e.currentTarget.style.borderColor = designColors.border;
                      }}
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

      {/* Gráfico de Atividade */}
      <div style={{
        backgroundColor: designColors.card,
        color: designColors.cardForeground,
        border: `1px solid ${designColors.border}`,
        borderRadius: '1.4rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: designColors.foreground,
            letterSpacing: '-0.025em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={20} style={{ color: designColors.primary }} />
            Atividade dos Últimos 7 Dias
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['7 dias', '30 dias', '3 meses'].map((period) => (
              <button
                key={period}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '1.2rem',
                  transition: 'colors 0.2s',
                  letterSpacing: '-0.025em',
                  backgroundColor: period === '7 dias' ? designColors.primary : designColors.muted,
                  color: period === '7 dias' ? designColors.primaryForeground : designColors.mutedForeground,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (period !== '7 dias') {
                    e.currentTarget.style.backgroundColor = designColors.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (period !== '7 dias') {
                    e.currentTarget.style.backgroundColor = designColors.muted;
                  }
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico Simples com ASCII Art */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderTop: `1px solid ${designColors.border}` }}></div>
          <div style={{
            backgroundColor: designColors.muted,
            borderRadius: '1.4rem',
            padding: '1rem',
            fontSize: '0.875rem',
            overflowX: 'auto',
            fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
            color: designColors.foreground
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <div>     ▲</div>
              <div>   6 │     ██                    ██</div>
              <div>     │    ████                  ████</div>
              <div>   5 │   ██████                ██████              ██</div>
              <div>     │  ████████              ████████            ████</div>
              <div>   4 │ ██████████            ██████████          ██████</div>
              <div>     │████████████          ████████████        ████████</div>
              <div>   3 │████████████         █████████████       ██████████         ██</div>
              <div>     │████████████        ███████████████     ████████████       ████</div>
              <div>   2 │████████████       █████████████████   ██████████████     ██████</div>
              <div>     │████████████      ███████████████████ ████████████████   ████████</div>
              <div>   1 │████████████     █████████████████████████████████████████████████</div>
              <div>     │████████████    ███████████████████████████████████████████████████</div>
              <div>   0 └────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────▶</div>
              <div>        Jun24  Jun25  Jun26  Jun27  Jun28  Jun29  Jun30  Jul01  Jul02  Jul03</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}