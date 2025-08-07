"use client";

import React, { useState } from 'react';
import { 
  Mic, 
  MonitorSpeaker, 
  Calendar,
  ChevronDown,
  Eye,
  Trash2,
  Play,
  BarChart3,
  Menu,
  Bell,
  User,
  Settings,
  Activity,
  Clock,
  Brain,
  MessageSquare,
  Target,
  TrendingUp,
  List
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--chart-1)'; // Verde
      case 'processing': return '#fbbf24'; // Amarelo
      case 'error': return 'var(--chart-3)'; // Rosa/Vermelho
      default: return 'var(--muted-foreground)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '🟢';
      case 'processing': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const handleStartSession = () => {
    // Aqui implementar navegação para a página de transcrição
    window.location.href = '/coach/capture/daily-co';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="border-b px-6 py-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg transition-colors hover:bg-muted" style={{ color: 'var(--foreground)' }}>
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold" style={{ 
              fontFamily: 'var(--font-sans)', 
              letterSpacing: 'var(--tracking-normal)',
              color: 'var(--foreground)'
            }}>
              TranscriptAI Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg transition-colors hover:bg-muted relative" style={{ color: 'var(--foreground)' }}>
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></span>
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-muted" style={{ color: 'var(--foreground)' }}>
              <User size={16} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-muted" style={{ color: 'var(--foreground)' }}>
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">

      {/* Métricas Principais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ 
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: 'var(--tracking-normal)'
          }}>
            📊 Métricas Principais
          </h2>
          
          {/* Seletor de Período */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center space-x-2 px-4 py-2 transition-all duration-200"
              style={{
                backgroundColor: 'var(--card)',
                border: 'var(--border-width-thin) solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <Calendar size={16} />
              <span>{selectedPeriodLabel}</span>
              <ChevronDown size={16} />
            </button>

            {showPeriodDropdown && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 z-50"
                style={{
                  backgroundColor: 'var(--popover)',
                  border: 'var(--border-width-thin) solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      setShowPeriodDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 transition-colors"
                    style={{
                      color: selectedPeriod === option.value ? 'var(--primary-foreground)' : 'var(--popover-foreground)',
                      backgroundColor: selectedPeriod === option.value ? 'var(--primary)' : 'transparent',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: 'var(--tracking-normal)',
                      borderRadius: option === periodOptions[0] ? 'var(--radius-lg) var(--radius-lg) 0 0' : 
                                   option === periodOptions[periodOptions.length - 1] ? '0 0 var(--radius-lg) var(--radius-lg)' : '0'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPeriod !== option.value) {
                        e.currentTarget.style.backgroundColor = 'var(--muted)';
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total Sessões */}
          <div 
            className="p-6 transition-all duration-200"
            style={{
              backgroundColor: 'var(--card)',
              border: 'var(--border-width-thin) solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                📊 Total Sessões
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold" style={{ 
                color: 'var(--foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                {currentMetrics.totalSessions}
              </div>
              <div className="text-xs" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                +3 vs anterior
              </div>
            </div>
          </div>

          {/* Tempo Transcrição */}
          <div 
            className="p-6 transition-all duration-200"
            style={{
              backgroundColor: 'var(--card)',
              border: 'var(--border-width-thin) solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                ⏱️ Tempo Transcrição
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold" style={{ 
                color: 'var(--foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                {currentMetrics.transcriptionTime}
              </div>
              <div className="text-xs" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                +23min vs ant.
              </div>
            </div>
          </div>

          {/* Análises Efetuadas */}
          <div 
            className="p-6 transition-all duration-200"
            style={{
              backgroundColor: 'var(--card)',
              border: 'var(--border-width-thin) solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                🤖 Análises Efetuadas
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold" style={{ 
                color: 'var(--foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                {currentMetrics.analysesCompleted}
              </div>
              <div className="text-xs" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                +5 vs anterior
              </div>
            </div>
          </div>

          {/* Créditos Gastos */}
          <div 
            className="p-6 transition-all duration-200"
            style={{
              backgroundColor: 'var(--card)',
              border: 'var(--border-width-thin) solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                💳 Créditos Gastos
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold" style={{ 
                color: 'var(--foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                {currentMetrics.creditsSpent}
              </div>
              <div className="text-xs" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                +120 vs ant.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inicialização de Sessão */}
        <div 
          className="p-6 space-y-4"
          style={{
            backgroundColor: 'var(--card)',
            border: 'var(--border-width-thin) solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3 className="text-lg font-semibold" style={{ 
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: 'var(--tracking-normal)'
          }}>
            ⚡ Inicialização de Sessão
          </h3>

          {/* Botão Principal */}
          <div 
            className="p-6 space-y-4"
            style={{
              backgroundColor: 'var(--card)',
              border: 'var(--border-width-medium) solid var(--primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="text-center space-y-3">
              <h4 className="text-xl font-bold" style={{ 
                color: 'var(--foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
              }}>
                🚀 INICIAR NOVA SESSÃO
              </h4>
              <div style={{ 
                borderTop: 'var(--border-width-thin) solid var(--border)' 
              }}></div>
              <button
                onClick={handleStartSession}
                className="w-full py-4 px-6 font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'var(--border-width-none)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: 'var(--tracking-normal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(110%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(100%)';
                }}
              >
                <Play size={24} />
                <span>🎯 COMEÇAR TRANSCRIÇÃO</span>
              </button>
              <div className="flex items-center justify-center space-x-3 text-sm" style={{ 
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: 'var(--tracking-normal)'
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
          <div 
            className="p-4 space-y-4"
            style={{
              backgroundColor: 'var(--muted)',
              border: 'var(--border-width-thin) solid var(--border)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <h5 className="font-medium" style={{ 
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: 'var(--tracking-normal)'
            }}>
              ⚙️ Configurações Rápidas
            </h5>
            <div style={{ 
              borderTop: 'var(--border-width-thin) solid var(--border)' 
            }}></div>
            
            <div className="space-y-3">
              {/* Idioma */}
              <div className="relative">
                <label className="block text-sm font-medium mb-1" style={{ 
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: 'var(--tracking-normal)'
                }}>
                  🌐 Idioma:
                </label>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--input)',
                    border: 'var(--border-width-thin) solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: 'var(--tracking-normal)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = 'var(--border-width-medium) solid var(--ring)';
                    e.currentTarget.style.outlineOffset = '2px';
                    e.currentTarget.style.borderColor = 'var(--ring)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <span>{languages.find(l => l.value === selectedLanguage)?.label}</span>
                  <ChevronDown size={16} />
                </button>

                {showLanguageDropdown && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-1 z-40"
                    style={{
                      backgroundColor: 'var(--popover)',
                      border: 'var(--border-width-thin) solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => {
                          setSelectedLanguage(lang.value);
                          setShowLanguageDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 transition-colors"
                        style={{
                          color: selectedLanguage === lang.value ? 'var(--primary-foreground)' : 'var(--popover-foreground)',
                          backgroundColor: selectedLanguage === lang.value ? 'var(--primary)' : 'transparent',
                          fontFamily: 'var(--font-sans)',
                          letterSpacing: 'var(--tracking-normal)',
                          borderRadius: lang === languages[0] ? 'var(--radius-md) var(--radius-md) 0 0' : 
                                       lang === languages[languages.length - 1] ? '0 0 var(--radius-md) var(--radius-md)' : '0'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLanguage !== lang.value) {
                            e.currentTarget.style.backgroundColor = 'var(--muted)';
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
              <div className="relative">
                <label className="block text-sm font-medium mb-1" style={{ 
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: 'var(--tracking-normal)'
                }}>
                  📝 Tipo:
                </label>
                <button
                  onClick={() => setShowSessionTypeDropdown(!showSessionTypeDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--input)',
                    border: 'var(--border-width-thin) solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: 'var(--tracking-normal)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = 'var(--border-width-medium) solid var(--ring)';
                    e.currentTarget.style.outlineOffset = '2px';
                    e.currentTarget.style.borderColor = 'var(--ring)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <span>{sessionTypes.find(t => t.value === selectedSessionType)?.label}</span>
                  <ChevronDown size={16} />
                </button>

                {showSessionTypeDropdown && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-1 z-40"
                    style={{
                      backgroundColor: 'var(--popover)',
                      border: 'var(--border-width-thin) solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    {sessionTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setSelectedSessionType(type.value);
                          setShowSessionTypeDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 transition-colors"
                        style={{
                          color: selectedSessionType === type.value ? 'var(--primary-foreground)' : 'var(--popover-foreground)',
                          backgroundColor: selectedSessionType === type.value ? 'var(--primary)' : 'transparent',
                          fontFamily: 'var(--font-sans)',
                          letterSpacing: 'var(--tracking-normal)',
                          borderRadius: type === sessionTypes[0] ? 'var(--radius-md) var(--radius-md) 0 0' : 
                                       type === sessionTypes[sessionTypes.length - 1] ? '0 0 var(--radius-md) var(--radius-md)' : '0'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSessionType !== type.value) {
                            e.currentTarget.style.backgroundColor = 'var(--muted)';
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
        <div 
          className="p-6"
          style={{
            backgroundColor: 'var(--card)',
            border: 'var(--border-width-thin) solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ 
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: 'var(--tracking-normal)'
          }}>
            📜 Histórico de Sessões
          </h3>

          {/* Lista com Scroll */}
          <div 
            className="space-y-3 overflow-y-auto pr-2 custom-scrollbar"
            style={{ height: '400px' }}
          >
            {mockSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 transition-all duration-200 group"
                style={{
                  backgroundColor: 'var(--card)',
                  border: 'var(--border-width-thin) solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>{getStatusIcon(session.status)}</span>
                      <h4 className="font-medium" style={{ 
                        color: 'var(--foreground)',
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: 'var(--tracking-normal)'
                      }}>
                        {session.title}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm mb-2" style={{ 
                      color: 'var(--muted-foreground)',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: 'var(--tracking-normal)'
                    }}>
                      <span>⏱️ {session.duration}</span>
                      <span>💬 {session.words} palavras</span>
                      <span>🤖 {session.analyses} análises</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs" style={{ 
                      color: 'var(--muted-foreground)',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: 'var(--tracking-normal)'
                    }}>
                      <span>💳 {session.credits} créditos</span>
                      <span>🕐 {session.timeAgo}</span>
                    </div>
                    
                    <div className="mt-2 text-xs" style={{ 
                      color: 'var(--muted-foreground)',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: 'var(--tracking-normal)'
                    }}>
                      📊 Confiança: {session.confidence}% | 🎙️ Mic + 🖥️ Tela
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 transition-all duration-200"
                      style={{
                        border: 'var(--border-width-thin) solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--muted-foreground)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--primary)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--muted-foreground)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                      title="Visualizar sessão"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="p-1.5 transition-all duration-200"
                      style={{
                        border: 'var(--border-width-thin) solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--muted-foreground)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--destructive)';
                        e.currentTarget.style.borderColor = 'var(--destructive)';
                        e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--muted-foreground)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Deletar sessão"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de Atividade */}
      <div 
        className="p-6"
        style={{
          backgroundColor: 'var(--card)',
          border: 'var(--border-width-thin) solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold" style={{ 
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: 'var(--tracking-normal)'
          }}>
            📊 Atividade dos Últimos 7 Dias
          </h3>
          <div className="flex space-x-2">
            {['7 dias', '30 dias', '3 meses'].map((period) => (
              <button
                key={period}
                className="px-3 py-1 text-sm transition-all duration-200"
                style={{
                  backgroundColor: period === '7 dias' ? 'var(--primary)' : 'var(--muted)',
                  color: period === '7 dias' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  border: 'var(--border-width-thin) solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: 'var(--tracking-normal)'
                }}
                onMouseEnter={(e) => {
                  if (period !== '7 dias') {
                    e.currentTarget.style.backgroundColor = 'var(--secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (period !== '7 dias') {
                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                  }
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico Simples com ASCII Art */}
        <div className="space-y-4">
          <div style={{ 
            borderTop: 'var(--border-width-thin) solid var(--border)' 
          }}></div>
          <div 
            className="p-4 text-sm overflow-x-auto"
            style={{
              backgroundColor: 'var(--muted)',
              color: 'var(--foreground)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div className="space-y-1">
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

      {/* Estilos para scrollbar customizada */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--muted);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--primary);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(140, 92, 255, 0.8);
        }
      `}</style>
    </div>
  );
}
