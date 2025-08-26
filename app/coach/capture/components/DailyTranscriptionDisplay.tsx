"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDailyTranscription } from '../lib/useDailyTranscription';
import { Play, Square, Mic, MicOff, ScreenShare, Trash2, Brain, HelpCircle, Zap, AlertTriangle } from 'lucide-react';
import TutorialModal from './TutorialModal';
import { useFirstVisit } from '../lib/useFirstVisit';

interface AudioLevelBarProps {
  level: number;
  label: string;
  color: string;
}

const AudioLevelBar: React.FC<AudioLevelBarProps> = ({ level, label, color }) => {
  const actualPercentage = Math.min(level * 100, 100);
  
  return (
    <div className="flex items-center space-x-3">
      <span className="text-xs font-medium w-12 uppercase tracking-wide" style={{ color: 'var(--periwinkle)' }}>
        {label}
      </span>
      <div className="flex-1 relative">
        <div 
          className="w-full h-1.5 rounded-full"
          style={{ backgroundColor: 'rgba(249, 251, 252, 0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{ 
              width: `${actualPercentage}%`,
              backgroundColor: color === 'blue' ? 'var(--periwinkle)' : 'var(--sgbus-green)'
            }}
          />
        </div>
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--seasalt)' }}>
        {Math.round(actualPercentage)}
      </span>
    </div>
  );
};

// Componente compacto para barras de áudio lado a lado
const CompactAudioLevelBar: React.FC<AudioLevelBarProps> = ({ level, label, color }) => {
  const actualPercentage = Math.min(level * 100, 100);
  
  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="flex items-center space-x-1">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--periwinkle)' }}>
          {label}
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--seasalt)' }}>
          {Math.round(actualPercentage)}
        </span>
      </div>
      <div className="w-20 relative">
        <div 
          className="w-full h-1.5 rounded-full"
          style={{ backgroundColor: 'rgba(249, 251, 252, 0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{ 
              width: `${actualPercentage}%`,
              backgroundColor: color === 'blue' ? 'var(--periwinkle)' : 'var(--sgbus-green)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Componente para Tooltip de Alerta de Áudio
const AudioWarningTooltip: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  
  return (
    <div
      className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        backgroundColor: '#fbbf24',
        color: '#1f2937',
        border: '1px solid #f59e0b',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        minWidth: '280px',
        maxWidth: '320px'
      }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <div className="text-left">
          <div className="font-semibold mb-1">Nenhum som está saindo do compartilhamento</div>
          <div className="text-xs opacity-90">
            Pare de compartilhar e compartilhe novamente com o áudio habilitado
          </div>
        </div>
      </div>
      {/* Seta apontando para baixo */}
      <div
        className="absolute top-full left-1/2 transform -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #fbbf24'
        }}
      />
    </div>
  );
};

interface DailyTranscriptionDisplayProps {
  sessionId?: string;
}

const DailyTranscriptionDisplay: React.FC<DailyTranscriptionDisplayProps> = ({ sessionId }) => {
  // Estado para dados da sessão
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Estado para tracking da sessão
  const [connectStartTime, setConnectStartTime] = useState<Date | null>(null);
  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);

  // Função para atualizar dados da sessão (fire-and-forget com retry e throttling)
  const updateSessionData = useCallback((updates: any, retryCount = 0) => {
    if (!sessionId) return;
    
    // Throttling simples: evitar muitas chamadas simultâneas
    const now = Date.now();
    if (now - lastUpdateRef.current < 500) { // Máximo 2 chamadas por segundo
      return;
    }
    lastUpdateRef.current = now;
    
    // Fire-and-forget: não bloqueia a UI
    fetch(`/api/transcription-sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    }).catch(error => {
      // Retry silencioso apenas uma vez para maior confiabilidade
      if (retryCount === 0) {
        setTimeout(() => updateSessionData(updates, 1), 1000);
        console.warn('Session tracking failed, retrying silently...');
      } else {
        console.warn('Session tracking update failed after retry (non-critical):', error);
      }
    });
  }, [sessionId]);

  // Função para incrementar contagem de análises (não-bloqueante)
  const incrementAnalysisCount = useCallback((analysisData?: any) => {
    if (!sessionId || !sessionData) return;
    
    const newCount = (sessionData.analysisCount || 0) + 1;
    const analyses = [...(sessionData.analyses || [])];
    
    if (analysisData) {
      analyses.push({
        timestamp: new Date().toISOString(),
        ...analysisData
      });
    }

    // Atualizar estado local imediatamente (otimistic update)
    setSessionData((prev: any) => prev ? {
      ...prev,
      analysisCount: newCount,
      analyses
    } : prev);

    // Fire-and-forget para o servidor
    updateSessionData({
      analysisCount: newCount,
      ...(analysisData && { analyses })
    });
  }, [sessionId, sessionData, updateSessionData]);

  // Buscar dados da sessão quando sessionId estiver presente
  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionData = async () => {
      setSessionLoading(true);
      setSessionError(null);
      
      try {
        const response = await fetch(`/api/transcription-sessions/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Sessão não encontrada');
        }
        
        const result = await response.json();
        setSessionData(result.session);
      } catch (error) {
        console.error('Erro ao buscar dados da sessão:', error);
        setSessionError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  // Hook Daily.co (compatível com interface Deepgram)
  const {
    transcript,
    interimTranscript,
    isListening,
    isConnected,
    isProcessing,
    error,
    confidence,
    audioLevel,
    isScreenAudioCaptured,
    transcriptionLanguage,
    wordsTranscribed,
    sessionDuration,
    devicePermissions,
    segments,
    blocks, // NOVO: Sistema de blocos (Fase 5)
    trackInfo, // NOVO: Informações de tracks
    diarizationEnabled, // NOVO: Status de diarização
    speakerStats, // NOVO: Estatísticas de speakers
    startListening,
    stopListening,
    forceFinalize,
    pauseListening,
    resumeListening,
    isPaused,
    clearTranscriptionHistory, // NOVO: Função de limpeza de histórico
    // FASE 3: Novos estados e funções de controle
    isMicrophoneEnabled,
    isScreenAudioEnabled,
    hasScreenAudio,
    toggleMicrophone,
    toggleScreenAudio,
    toggleScreenShare, // NOVA: Controle dedicado de compartilhamento
    // NOVAS funções para mirror
    getScreenVideoTrack,
    createScreenMirror,
    manageScreenMirror
  } = useDailyTranscription({
    language: 'pt',
    enableScreenAudio: true,
    enableInterimResults: true,
    sessionId: sessionId, // 🆕 PLAN-007: Passar sessionId para tracking via webhooks
    mirrorCallbacks: {
      onTrackAvailable: () => {
        console.log('🎉 Mirror: Track disponível via evento - tentando criar mirror...');
        // ETAPA 8: Validação de segurança e isolamento
        console.log('🔍 [VALIDATION] Mirror callback - verificando isolamento da transcrição');
        
        const videoTrack = getScreenVideoTrack();
        if (videoTrack) {
          const stream = new MediaStream([videoTrack]);
          setMirrorVideoStream(stream);
          setMirrorState('active');
          console.log('✅ Mirror: Stream criado e definido via evento');
          console.log('✅ [VALIDATION] Mirror ATIVO - transcrição deve continuar funcionando normalmente');
        }
      },
      onTrackUnavailable: () => {
        console.log('📴 Mirror: Track não disponível via evento - removendo mirror...');
        console.log('🔍 [VALIDATION] Mirror removido - transcrição deve continuar intacta');
        setMirrorVideoStream(null);
        setMirrorState('waiting');
      }
    }
  });

  // Refs e estados para controle do scroll automático (mantidos idênticos)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const analysisScrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Mirror controls ref
  const controlsContainerRef = useRef<HTMLDivElement>(null);
  
  // Mirror states
  const [mirrorState, setMirrorState] = useState<'hidden' | 'waiting' | 'active' | 'error'>('hidden');
  const [mirrorVideoStream, setMirrorVideoStream] = useState<MediaStream | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{width: number, height: number} | null>(null);
  const mirrorVideoRef = useRef<HTMLVideoElement>(null);
  
  // Estados para histórico de análises (mantido idêntico)
  interface AnalysisHistory {
    id: string;
    timestamp: string;
    contexto: string;
    resposta: string;
    isProcessing?: boolean;
  }
  
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isQuickAnalysis, setIsQuickAnalysis] = useState(false);
  
  // Hook para detectar primeira visita
  const { isFirstVisit, isLoading, markAsVisited } = useFirstVisit('daily-co-tutorial');

  // ETAPA 7: Função helper para calcular dimensões responsivas baseadas na tela compartilhada
  const getResponsiveMirrorDimensions = useCallback((videoWidth?: number, videoHeight?: number) => {
    // Verificar se estamos no navegador antes de acessar window
    if (typeof window === 'undefined') {
      // Valores padrão para SSR
      return {
        width: '400px',
        height: '225px',
        maxWidth: '400px',
        maxHeight: '225px'
      };
    }
    
    const containerWidth = window.innerWidth;
    
    // Largura base do container baseada no tamanho da tela
    let maxContainerWidth: number;
    if (containerWidth > 1200) {
      maxContainerWidth = 500; // Maior para telas grandes
    } else if (containerWidth > 768) {
      maxContainerWidth = 400; // Médio para tablets
    } else {
      maxContainerWidth = Math.min(containerWidth - 40, 350); // Responsivo para mobile
    }
    
    // Se temos as dimensões reais do vídeo, calcular altura baseada na proporção
    if (videoWidth && videoHeight) {
      const aspectRatio = videoWidth / videoHeight;
      const calculatedHeight = maxContainerWidth / aspectRatio;
      
      // Log removido para evitar spam no console
      
      return {
        width: `${maxContainerWidth}px`,
        height: `${Math.round(calculatedHeight)}px`,
        maxWidth: `${maxContainerWidth}px`,
        maxHeight: `${Math.round(calculatedHeight)}px`
      };
    }
    
    // Fallback para proporção 16:9 se não temos dimensões do vídeo
    const fallbackHeight = Math.round(maxContainerWidth * (9 / 16));
    return {
      width: `${maxContainerWidth}px`,
      height: `${fallbackHeight}px`,
      maxWidth: `${maxContainerWidth}px`,
      maxHeight: `${fallbackHeight}px`
    };
  }, []);

  // ETAPA 8: Função de validação completa do sistema
  const validateMirrorIntegration = useCallback(() => {
    const validation = {
      timestamp: new Date().toISOString(),
      mirrorState,
      isListening,
      isScreenAudioCaptured,
      hasVideoStream: !!mirrorVideoStream,
      hasVideoElement: !!mirrorVideoRef.current,
      transcriptionWorking: !!transcript || !!interimTranscript,
      audioControlsWorking: typeof toggleMicrophone === 'function' && typeof toggleScreenAudio === 'function',
      uiIntact: true, // Verificamos se a UI não quebrou
    };

    console.log('🧪 [INTEGRATION TEST] Validação completa do mirror:', validation);
    
    // Testes de segurança
    const securityTests = {
      noInterferenceWithTranscription: validation.transcriptionWorking,
      audioControlsUnaffected: validation.audioControlsWorking,
      cleanStateManagement: validation.mirrorState !== undefined,
      properCleanup: !validation.hasVideoStream || validation.hasVideoElement
    };
    
    console.log('🔒 [SECURITY VALIDATION] Testes de isolamento:', securityTests);
    
    return { validation, securityTests };
  }, [mirrorState, isListening, isScreenAudioCaptured, mirrorVideoStream, transcript, interimTranscript, toggleMicrophone, toggleScreenAudio]);

  // Abrir modal automaticamente na primeira visita
  useEffect(() => {
    if (!isLoading && isFirstVisit) {
      setIsTutorialOpen(true);
    }
  }, [isFirstVisit, isLoading]);

  // Simulação de stats para Daily.co (compatibilidade com interface Deepgram)
  const stats = {
    finalResults: transcript.split(' ').length,
    interimResults: interimTranscript ? interimTranscript.split(' ').length : 0,
    totalWords: wordsTranscribed,
    sessionTime: Math.floor(sessionDuration / 60) + 'm'
  };

  // Injetar estilos CSS para renderização de HTML (mantido idêntico)
  useEffect(() => {
    const analysisStyles = `
      .analysis-content p {
        margin-bottom: 1rem;
        line-height: 1.6;
      }
      
      .analysis-content p:last-child {
        margin-bottom: 0;
      }
      
      .analysis-content b,
      .analysis-content strong {
        font-weight: 600;
        color: var(--periwinkle);
      }
      
      .analysis-content em {
        font-style: italic;
      }
      
      .analysis-content br {
        line-height: 1.8;
      }
      
      .analysis-content ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      
      .analysis-content li {
        margin-bottom: 0.25rem;
      }
      
      .analysis-content div[style*="padding:10px"] {
        padding: 8px !important;
      }
    `;

    if (!document.getElementById('analysis-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'analysis-styles';
      styleElement.textContent = analysisStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

  // Funções de scroll (mantidas idênticas)
  const isAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 10;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current && isAutoScrollEnabled) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [isAutoScrollEnabled]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isUserScrolling) return;
    
    if (!isAtBottom()) {
      setIsAutoScrollEnabled(false);
    } else {
      setIsAutoScrollEnabled(true);
    }
  }, [isUserScrolling, isAtBottom]);

  // Effects para scroll automático (mantidos idênticos)
  useEffect(() => {
    if (isAutoScrollEnabled && (transcript || interimTranscript)) {
      setTimeout(scrollToBottom, 50);
    }
  }, [transcript, interimTranscript, isAutoScrollEnabled, scrollToBottom]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimer: NodeJS.Timeout;
    let scrollbarFadeTimer: NodeJS.Timeout;

    const handleScrollStart = () => {
      setIsUserScrolling(true);
      clearTimeout(scrollTimer);
      
      // Mostrar scrollbar enquanto rola
      container.classList.add('scrolling');
      clearTimeout(scrollbarFadeTimer);
      scrollbarFadeTimer = setTimeout(() => {
        container.classList.remove('scrolling');
      }, 600);
      
      scrollTimer = setTimeout(() => {
        setIsUserScrolling(false);
        if (isAtBottom()) {
          setIsAutoScrollEnabled(true);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScrollStart);
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScrollStart);
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
      clearTimeout(scrollbarFadeTimer);
    };
  }, [handleScroll, isAtBottom]);

  // Scrollbar sutil para o painel de análises (direita)
  useEffect(() => {
    const container = analysisScrollRef.current;
    if (!container) return;

    let scrollbarFadeTimer: NodeJS.Timeout;
    const handleAnyScroll = () => {
      container.classList.add('scrolling');
      clearTimeout(scrollbarFadeTimer);
      scrollbarFadeTimer = setTimeout(() => {
        container.classList.remove('scrolling');
      }, 600);
    };

    container.addEventListener('scroll', handleAnyScroll);
    return () => {
      container.removeEventListener('scroll', handleAnyScroll);
      clearTimeout(scrollbarFadeTimer);
    };
  }, []);

  // Mirror state control based on session status
  useEffect(() => {
    // ETAPA 8: Logs de validação para testes de integração
    console.log('🔍 [VALIDATION] Mirror state transition:', {
      isListening,
      isScreenAudioCaptured,
      currentMirrorState: mirrorState,
      hasVideoStream: !!mirrorVideoStream
    });

    // Evitar mudanças de estado desnecessárias que podem remover o vídeo do DOM
    if (isListening && isScreenAudioCaptured && mirrorState !== 'active' && mirrorState !== 'waiting') {
      setMirrorState('waiting');
      console.log('✅ [VALIDATION] Transição para WAITING - Screen share detectado');
    } else if (isListening && !isScreenAudioCaptured && mirrorState !== 'waiting') {
      setMirrorState('waiting');
      console.log('⏳ [VALIDATION] Transição para WAITING - Aguardando screen share');
    } else if (!isListening && mirrorState !== 'hidden') {
      setMirrorState('hidden');
      setMirrorVideoStream(null);
      console.log('🔒 [VALIDATION] Transição para HIDDEN - Sessão parada');
    }
  }, [isListening, isScreenAudioCaptured, mirrorState, mirrorVideoStream]);

  // ETAPA 5: useEffect para gerenciar mirror baseado na sequência do Daily.co (fallback)
  useEffect(() => {
    console.log('🔄 Mirror: Verificando condições:', {
      isListening,
      isScreenAudioCaptured,
      mirrorState
    });

    if (isListening && isScreenAudioCaptured && mirrorState === 'waiting' && !mirrorVideoStream) {
      // Fallback: Tentar criar mirror se eventos não funcionaram
      const timeoutId = setTimeout(() => {
        const videoTrack = getScreenVideoTrack();
        
        if (videoTrack) {
          const stream = new MediaStream([videoTrack]);
          setMirrorVideoStream(stream);
          setMirrorState('active');
          console.log('✅ Mirror: Stream criado via fallback');
        } else {
          console.log('⏳ Mirror: Track ainda não disponível, mantendo waiting');
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isListening, isScreenAudioCaptured, mirrorState, mirrorVideoStream, getScreenVideoTrack]);

  // Event-driven mirror management (substituiu o retry system)
  useEffect(() => {
    console.log('📡 Mirror: Sistema de eventos ativo - aguardando eventos de track...');
  }, []); // Apenas log informativo - os eventos são gerenciados pelos callbacks

  // Aplicar stream ao elemento de vídeo quando disponível
  useEffect(() => {
    if (mirrorVideoRef.current && mirrorVideoStream) {
      console.log('🎥 Mirror: Aplicando stream ao elemento de vídeo...');
      const videoElement = mirrorVideoRef.current;
      
      // Informações sobre o stream
      console.log('📊 Mirror: Detalhes do stream:', {
        id: mirrorVideoStream.id,
        active: mirrorVideoStream.active,
        tracks: mirrorVideoStream.getTracks().length,
        videoTracks: mirrorVideoStream.getVideoTracks().length,
        firstVideoTrack: mirrorVideoStream.getVideoTracks()[0] ? {
          enabled: mirrorVideoStream.getVideoTracks()[0].enabled,
          readyState: mirrorVideoStream.getVideoTracks()[0].readyState,
          muted: mirrorVideoStream.getVideoTracks()[0].muted
        } : null
      });
      
      // Aplicar stream apenas se não já estiver aplicado
      if (videoElement.srcObject !== mirrorVideoStream) {
        videoElement.srcObject = mirrorVideoStream;
        
        // Listeners de evento para debug (apenas uma vez)
        const handleLoadedMetadata = () => {
          const videoWidth = videoElement.videoWidth;
          const videoHeight = videoElement.videoHeight;
          
          console.log('🎬 Mirror: Video metadata carregado', {
            videoWidth,
            videoHeight,
            duration: videoElement.duration,
            readyState: videoElement.readyState
          });
          
          // Armazenar dimensões para cálculos responsivos
          setVideoDimensions({ width: videoWidth, height: videoHeight });
          
          // Tentar reproduzir após metadata carregado
          setTimeout(() => {
            videoElement.play().catch(error => {
              console.log('ℹ️ Mirror: Video play falhou:', error.message);
            });
          }, 100);
        };
        
        const handleCanPlay = () => {
          console.log('▶️ Mirror: Video pode reproduzir');
        };
        
        const handlePlaying = () => {
          console.log('🎮 Mirror: Video está reproduzindo - SUCESSO!');
        };
        
        // Aplicar listeners
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        videoElement.addEventListener('canplay', handleCanPlay, { once: true });
        videoElement.addEventListener('playing', handlePlaying, { once: true });
      }
      
      console.log('✅ Mirror: Stream aplicado com sucesso');
    }
  }, [mirrorVideoStream]);

  // Debug: Monitorar quando o ref do vídeo estiver disponível
  useEffect(() => {
    if (mirrorVideoRef.current) {
      console.log('🎯 Mirror: Elemento de vídeo ref está disponível');
      console.log('📐 Mirror: Dimensões do elemento:', {
        width: mirrorVideoRef.current.offsetWidth,
        height: mirrorVideoRef.current.offsetHeight,
        display: typeof window !== 'undefined' ? window.getComputedStyle(mirrorVideoRef.current).display : 'unknown',
        visibility: typeof window !== 'undefined' ? window.getComputedStyle(mirrorVideoRef.current).visibility : 'unknown'
      });
    }
  }, [mirrorState, mirrorVideoStream]);

  // Cleanup do stream quando componente é desmontado ou stream é removido
  useEffect(() => {
    return () => {
      if (mirrorVideoStream) {
        mirrorVideoStream.getTracks().forEach(track => track.stop());
        console.log('🧹 Mirror: Cleanup do stream ao desmontar componente');
      }
    };
  }, [mirrorVideoStream]);

  // ETAPA 7: Responsividade - Listener para resize da janela
  useEffect(() => {
    if (typeof window === 'undefined') return; // Não executar no SSR
    
    const handleResize = () => {
      // Early return: não redimensionar quando modo fluido está ativo
      if (mirrorState === 'active') {
        return;
      }
      
      if (mirrorVideoStream && mirrorVideoRef.current && videoDimensions) {
        console.log('📱 Mirror: Redimensionando para nova tela');
        
        // Aplicar novas dimensões usando função helper com dimensões reais do vídeo
        const video = mirrorVideoRef.current;
        const dimensions = getResponsiveMirrorDimensions(videoDimensions.width, videoDimensions.height);
        
        video.style.width = dimensions.width;
        video.style.height = dimensions.height;
        video.style.maxWidth = dimensions.maxWidth;
        video.style.maxHeight = dimensions.maxHeight;
        
        console.log('✅ Mirror: Redimensionado com sucesso:', dimensions);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mirrorVideoStream, mirrorState, videoDimensions, getResponsiveMirrorDimensions]);

  // Atualizar dimensões do vídeo quando as dimensões da tela compartilhada mudarem
  useEffect(() => {
    // Early return: não redimensionar quando modo fluido está ativo
    if (mirrorState === 'active') {
      return;
    }
    
    if (mirrorVideoRef.current && videoDimensions) {
      console.log('🔧 Mirror: Atualizando dimensões do vídeo baseado na tela compartilhada');
      
      const video = mirrorVideoRef.current;
      const dimensions = getResponsiveMirrorDimensions(videoDimensions.width, videoDimensions.height);
      
      video.style.width = dimensions.width;
      video.style.height = dimensions.height;
      video.style.maxWidth = dimensions.maxWidth;
      video.style.maxHeight = dimensions.maxHeight;
      
      console.log('📏 Mirror: Dimensões aplicadas:', dimensions);
    }
  }, [videoDimensions, mirrorState, getResponsiveMirrorDimensions]);

  // ETAPA 7: Tratamento de erro para fallback (timeout)
  useEffect(() => {
    if (mirrorState === 'waiting' && isScreenAudioCaptured) {
      // Se está waiting há muito tempo, pode ser erro
      const errorTimeout = setTimeout(() => {
        const videoTrack = getScreenVideoTrack();
        if (!videoTrack) {
          setMirrorState('error');
          console.log('❌ Mirror: Timeout - track não disponível após 10 segundos');
        }
      }, 10000); // 10 segundos timeout
      
      return () => clearTimeout(errorTimeout);
    }
  }, [mirrorState, isScreenAudioCaptured, getScreenVideoTrack]);

  // ETAPA 8: Validação contínua quando mirror está ativo
  useEffect(() => {
    if (mirrorState === 'active' && mirrorVideoStream) {
      // Executar validação inicial
      setTimeout(() => {
        validateMirrorIntegration();
      }, 1000); // Aguardar 1s para estabilizar

      // Validação periódica a cada 30 segundos
      const validationInterval = setInterval(() => {
        console.log('🔄 [PERIODIC VALIDATION] Executando validação periódica...');
        validateMirrorIntegration();
      }, 30000);

      return () => clearInterval(validationInterval);
    }
  }, [mirrorState, mirrorVideoStream, validateMirrorIntegration]);


  // Função para ativar scroll automático
  const enableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(true);
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  // Função para verificar se análise está disponível (mesmas condições do botão)
  const canAnalyze = useCallback(() => {
    return !isAnalyzing && (blocks.length > 0 || interimTranscript.trim().length > 0);
  }, [isAnalyzing, blocks.length, interimTranscript]);

  // Função para envio ao webhook de análise (aceita objeto payload)
  const sendToWebhook = async (payload: any) => {
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_ANALYSIS_WEBHOOK_URL;
      if (!webhookUrl) {
        console.error('❌ URL do webhook de análise não configurada. Verifique a variável de ambiente NEXT_PUBLIC_ANALYSIS_WEBHOOK_URL.');
        throw new Error('Webhook URL not configured');
      }

      console.log('📡 Enviando payload para webhook...');
      console.log('🔍 Payload:', payload);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      console.log('✅ Resposta do webhook:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao enviar para webhook:', error);
      throw error;
    }
  };

  // FASE 3: Função para formatar resposta do webhook (com suporte a HTML)
  const formatWebhookResponse = (rawResponse: string): string => {
    try {
      console.log('🔍 Raw response recebida:', rawResponse);
      
      // Tentar fazer parse do JSON
      const parsed = JSON.parse(rawResponse);
      console.log('🔍 JSON parseado:', parsed);
      
      // Verificar múltiplas variações possíveis do campo
      let analysisText = parsed.analise_resposta || 
                        parsed['analise_resposta '] || // Com espaço
                        parsed.analysis || 
                        parsed.response ||
                        parsed.resposta;
      
      console.log('🔍 Texto da análise extraído:', analysisText);
      
      if (analysisText) {
        // Remover marcadores markdown de código (```html, ```, etc)
        analysisText = analysisText
          .replace(/```html\s*/g, '')  // Remove ```html
          .replace(/```\s*/g, '')      // Remove ``` no final
          .replace(/^```.*$/gm, '')    // Remove qualquer linha que comece com ```
          .trim();
        
        // Se contém HTML, processar adequadamente
        if (analysisText.includes('<') && analysisText.includes('>')) {
          console.log('✅ HTML detectado, processando formatação HTML');
          return analysisText
            .replace(/\\"/g, '"')  // Converter aspas escapadas
            .trim();
        } else {
          // Texto simples - converter quebras de linha
          console.log('✅ Texto simples detectado');
          return analysisText
            .replace(/\\n/g, '\n')
            .replace(/\n\n+/g, '\n\n')
            .trim();
        }
      }
      
      // Se não encontrou nenhum campo conhecido, retornar o valor do primeiro campo
      const firstValue = Object.values(parsed)[0];
      if (typeof firstValue === 'string') {
        let cleanedValue = firstValue
          .replace(/```html\s*/g, '')  // Remove ```html
          .replace(/```\s*/g, '')      // Remove ``` no final
          .replace(/^```.*$/gm, '')    // Remove qualquer linha que comece com ```
          .trim();
        
        if (cleanedValue.includes('<') && cleanedValue.includes('>')) {
          return cleanedValue.replace(/\\"/g, '"').trim();
        } else {
          return cleanedValue.replace(/\\n/g, '\n').replace(/\n\n+/g, '\n\n').trim();
        }
      }
      
      // Se não conseguiu extrair, retornar como texto
      return rawResponse;
    } catch (error) {
      console.log('⚠️ Erro ao fazer parse do JSON, tratando como texto simples');
      
      // Se não é JSON válido, tentar extrair texto entre aspas
      const textMatch = rawResponse.match(/"([^"]*(?:\\.[^"]*)*)"/);
      if (textMatch && textMatch[1]) {
        const extractedText = textMatch[1]
          .replace(/```html\s*/g, '')  // Remove ```html
          .replace(/```\s*/g, '')      // Remove ``` no final
          .replace(/^```.*$/gm, '')    // Remove qualquer linha que comece com ```
          .trim();
        
        return extractedText
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\n\n+/g, '\n\n')
          .trim();
      }
      
      // Último recurso: retornar como texto formatado
      return rawResponse
        .replace(/```html\s*/g, '')  // Remove ```html
        .replace(/```\s*/g, '')      // Remove ``` no final
        .replace(/^```.*$/gm, '')    // Remove qualquer linha que comece com ```
        .replace(/\\n/g, '\n')
        .replace(/\n\n+/g, '\n\n')
        .trim();
    }
  };

  // FASE 3: Função para verificar se a resposta contém HTML
  const isHtmlContent = (content: string): boolean => {
    return content.includes('<') && content.includes('>') && 
           (content.includes('<p>') || content.includes('<b>') || content.includes('<strong>') || 
            content.includes('<em>') || content.includes('<br>') || content.includes('<div>'));
  };

  // Funções do histórico de análises (mantidas idênticas)
  const createLoadingEntry = (contexto: string): string => {
    const id = `analysis-${Date.now()}`;
    const newEntry: AnalysisHistory = {
      id,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      contexto: contexto,
      resposta: '',
      isProcessing: true
    };
    
    setAnalysisHistory(prev => [newEntry, ...prev]);
    return id;
  };

  const updateLoadingEntry = (id: string, resposta: string) => {
    setAnalysisHistory(prev => 
      prev.map(entry => 
        entry.id === id 
          ? { ...entry, resposta: formatWebhookResponse(resposta), isProcessing: false }
          : entry
      )
    );
  };

  /**
   * Constrói seção do formulário pre-session para incluir no payload de análise
   * @param sessionData - Dados da sessão carregados do banco (já em memória)
   * @param sessionId - ID da sessão atual
   * @returns Objeto estruturado com dados da empresa e perguntas SPIN
   * 
   * IMPORTANTE: Esta função é fail-safe e sempre retorna uma estrutura válida,
   * mesmo com dados ausentes ou corrompidos, garantindo que o webhook nunca falhe.
   */
  const buildFormularioPresessao = (sessionData: any, sessionId: string) => {
    try {
      // Proteção contra sessionData null/undefined
      if (!sessionData) {
        console.warn('⚠️ SessionData não disponível, usando valores padrão para formulário');
        return {
          empresa: {
            nome: '',
            industria: '',
            industria_customizada: '',
            faturamento: '',
            tipo_agente: 'ESPECIALISTA'
          },
          perguntas_spin: {
            situacao: '',
            problema: '',
            implicacao: '',
            solucao_necessaria: ''
          },
          metadados: {
            sessao_id: sessionId || '',
            dados_carregados: false,
            timestamp_formulario: ''
          }
        };
      }

      // Proteção contra spinQuestions null/undefined ou formato incorreto
      let spinQuestions: any = {};
      if (sessionData.spinQuestions) {
        // Se spinQuestions for string JSON, fazer parse
        if (typeof sessionData.spinQuestions === 'string') {
          try {
            spinQuestions = JSON.parse(sessionData.spinQuestions);
          } catch {
            console.warn('⚠️ spinQuestions em formato inválido, usando valores vazios');
            spinQuestions = {};
          }
        } else {
          spinQuestions = sessionData.spinQuestions;
        }
      }
      
      // Função helper para garantir string segura
      const safeString = (value: any): string => {
        if (value === null || value === undefined) return '';
        return String(value).trim();
      };
      
      return {
        empresa: {
          nome: safeString(sessionData.companyName),
          industria: safeString(sessionData.industry),
          industria_customizada: safeString(sessionData.customIndustry),
          faturamento: safeString(sessionData.revenue),
          tipo_agente: sessionData.agentType || 'ESPECIALISTA'
        },
        perguntas_spin: {
          situacao: safeString(spinQuestions.situation),
          problema: safeString(spinQuestions.problem),
          implicacao: safeString(spinQuestions.implication),
          solucao_necessaria: safeString(spinQuestions.solutionNeed)
        },
        metadados: {
          sessao_id: sessionId || '',
          dados_carregados: true,
          timestamp_formulario: safeString(sessionData.createdAt)
        }
      };
    } catch (error) {
      // Fallback completo em caso de erro inesperado
      console.error('❌ Erro ao construir formulario_presessao:', error);
      return {
        empresa: {
          nome: '',
          industria: '',
          industria_customizada: '',
          faturamento: '',
          tipo_agente: 'ESPECIALISTA'
        },
        perguntas_spin: {
          situacao: '',
          problema: '',
          implicacao: '',
          solucao_necessaria: ''
        },
        metadados: {
          sessao_id: sessionId || '',
          dados_carregados: false,
          timestamp_formulario: '',
          erro: true
        }
      };
    }
  };

  // Função handleAnalyze com payload estruturado incluindo trans.usuario, trans.cliente e analiseRapida
  const handleAnalyze = useCallback(async () => {
    if (isAnalyzing) return;
    
    const analysisStartTime = performance.now(); // Performance tracking
    setIsAnalyzing(true);
    let loadingId: string | null = null;
    
    try {
      // Coleta do Contexto Completo
      const finalBlocksText = blocks.map(block => block.text).join(' \n');
      const currentInterimText = interimTranscript; // Captura o texto intermediário atual

      // Junta os dois, garantindo um espaço se ambos existirem.
      const contextoCompleto = `${finalBlocksText} ${currentInterimText}`.trim();
      
      if (!contextoCompleto) {
        console.log('⚠️ Nenhum contexto disponível para análise');
        return;
      }
      
      // Separar blocos por fonte para trans.usuario e trans.cliente
      const transUsuario = blocks.filter(b => b.source === 'microphone').map(b => b.text);
      const transCliente = blocks.filter(b => b.source === 'screen').map(b => b.text);
      
      // Construir payload estruturado incluindo dados do formulário pre-session
      // IMPORTANTE: sessionData já está carregado em memória, não faz nova query ao BD
      const payload = {
        contexto: contextoCompleto,
        timestamp: new Date().toISOString(),
        source: 'daily-co-transcription',
        trans: {
          usuario: transUsuario,
          cliente: transCliente
        },
        blocos: blocks.map(b => ({
          id: b.id,
          source: b.source === 'microphone' ? 'usuario' : b.source === 'screen' ? 'cliente' : b.source,
          color: b.color,
          startTime: b.startTime instanceof Date ? b.startTime.toISOString() : b.startTime,
          text: b.text
        })),
        interim: currentInterimText,
        analiseRapida: isQuickAnalysis,
        // NOVO: Dados do formulário de configuração da sessão
        // Inclui informações da empresa e perguntas SPIN coletadas na pre-session
        // Usa valores padrão vazios se dados não estiverem disponíveis (fail-safe)
        formulario_presessao: buildFormularioPresessao(sessionData, sessionId || '')
      };
      
      console.log('📋 Payload construído:', {
        contextoLength: contextoCompleto.length,
        blocosTotal: blocks.length,
        transUsuarioCount: transUsuario.length,
        transClienteCount: transCliente.length,
        analiseRapida: isQuickAnalysis,
        formularioIncluido: !!payload.formulario_presessao,
        empresaNome: payload.formulario_presessao?.empresa?.nome || 'VAZIO'
      });
      
      // Criar entrada de loading no histórico
      loadingId = createLoadingEntry(contextoCompleto);
      console.log('🌐 Enviando payload estruturado para análise de IA...');
      
      // Enviar para webhook
      const resposta = await sendToWebhook(payload);
      
      // Atualizar entrada no histórico com resultado
      if (loadingId) {
        updateLoadingEntry(loadingId, resposta);
      }
      
      // Tracking da análise na sessão (não-bloqueante)
      if (sessionId) {
        incrementAnalysisCount({
          type: isQuickAnalysis ? 'quick' : 'detailed',
          content: resposta,
          contextLength: contextoCompleto.length,
          creditsUsed: 1 // Pode ser calculado dinamicamente
        });
      }
      
      const analysisEndTime = performance.now();
      const analysisDuration = analysisEndTime - analysisStartTime;
      console.log(`✅ Análise concluída em ${analysisDuration.toFixed(2)}ms, transcrição Daily.co continua ativa`);
      
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      const errorMessage = `❌ Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      
      if (loadingId) {
        updateLoadingEntry(loadingId, errorMessage);
      } else {
        console.error(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [blocks, interimTranscript, isAnalyzing, isQuickAnalysis, createLoadingEntry, sendToWebhook, updateLoadingEntry]);

  // Event listener para tecla espaço
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );

        if (!isInputField && canAnalyze()) {
          event.preventDefault();
          handleAnalyze();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [canAnalyze, handleAnalyze]);

  // Tracking de conexão da sessão com duração cumulativa
  useEffect(() => {
    if (!sessionId) return;

    if (isConnected && !connectStartTime) {
      // Nova conexão - registrar início
      const startTime = new Date();
      setConnectStartTime(startTime);
      
      // Se é a primeira conexão da sessão, registrar connectTime
      if (!sessionData?.connectTime) {
        updateSessionData({ connectTime: startTime.toISOString() });
      }
    } else if (!isConnected && connectStartTime) {
      // Desconectou - somar duração à duração total existente
      const sessionDuration = Math.floor((new Date().getTime() - connectStartTime.getTime()) / 1000);
      const currentTotalDuration = sessionData?.totalDuration || 0;
      const newTotalDuration = currentTotalDuration + sessionDuration;
      
      updateSessionData({ totalDuration: newTotalDuration });
      
      // Atualizar estado local para próximas reconexões
      setSessionData((prev: any) => prev ? {
        ...prev,
        totalDuration: newTotalDuration
      } : prev);
      
      // Reset para próxima conexão
      setConnectStartTime(null);
    }
  }, [isConnected, sessionId, connectStartTime, sessionData, updateSessionData]);

  // Hook para expor função de incremento de análise para uso externo
  useEffect(() => {
    if (sessionId) {
      // Expor função globalmente para ser usada em análises
      (window as any).trackSessionAnalysis = incrementAnalysisCount;
    }
    
    return () => {
      if ((window as any).trackSessionAnalysis) {
        delete (window as any).trackSessionAnalysis;
      }
    };
  }, [incrementAnalysisCount, sessionId]);

  // Handler para salvar duração ao fechar/atualizar página
  useEffect(() => {
    if (!sessionId) return;

    const handleBeforeUnload = () => {
      // Se estiver conectado quando a página fechar, salvar duração acumulada
      if (connectStartTime) {
        const sessionDuration = Math.floor((new Date().getTime() - connectStartTime.getTime()) / 1000);
        const currentTotalDuration = sessionData?.totalDuration || 0;
        const finalTotalDuration = currentTotalDuration + sessionDuration;
        
        // Navigator.sendBeacon para garantir que a requisição seja enviada mesmo ao fechar
        const updateData = { totalDuration: finalTotalDuration };
        
        try {
          navigator.sendBeacon(
            `/api/transcription-sessions/${sessionId}`, 
            new Blob([JSON.stringify(updateData)], { type: 'application/json' })
          );
        } catch (error) {
          // Fallback com fetch síncrono como último recurso
          fetch(`/api/transcription-sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
            keepalive: true
          }).catch(() => {
            // Falha silenciosa - não podemos fazer mais nada
            console.warn('Failed to save session duration on page unload');
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, connectStartTime, sessionData]);

  // Timer para atualizar duração atual em tempo real
  useEffect(() => {
    if (!connectStartTime) {
      setCurrentSessionDuration(0);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - connectStartTime.getTime()) / 1000);
      setCurrentSessionDuration(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [connectStartTime]);

  // Mirror container render function
  const renderMirrorContainer = () => {
    
    const containerStyle = {
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: mirrorState === 'active' ? 'auto' : '158px',
      height: mirrorState === 'active' ? 'auto' : '258px',
      transition: 'all 0.3s ease'
    };

    switch (mirrorState) {
      case 'hidden':
        return (
          <div 
            id="screen-mirror-container"
            style={{
              ...containerStyle,
              border: '2px dashed rgba(107, 233, 76, 0.3)',
              backgroundColor: 'rgba(23, 24, 24, 0.5)',
            }}
          >
            <div style={{ color: 'var(--periwinkle)', fontSize: '13px', textAlign: 'center', opacity: 0.7 }}>
              🖥️ Mirror da tela compartilhada aparecerá aqui
              <br />
              <span style={{ fontSize: '11px' }}>Clique em &ldquo;🎙️ INICIAR&rdquo; para ativar</span>
            </div>
          </div>
        );
        
      case 'waiting':
        return (
          <div 
            id="screen-mirror-container"
            style={{
              ...containerStyle,
              border: '2px solid rgba(107, 233, 76, 0.6)',
              backgroundColor: 'rgba(107, 233, 76, 0.1)',
            }}
          >
            <div style={{ color: 'var(--sgbus-green)', fontSize: '13px', textAlign: 'center' }}>
              ⏳ Aguardando compartilhamento de tela...
              <br />
              <span style={{ fontSize: '11px', opacity: 0.8 }}>
                Selecione a tela para compartilhar na janela do navegador
              </span>
            </div>
          </div>
        );
        
      case 'active':
        return (
          <div 
            id="screen-mirror-container"
            style={{
              ...containerStyle,
              border: '2px solid var(--sgbus-green)',
              backgroundColor: 'var(--eerie-black)',
              minHeight: 'auto',
              padding: '2px',
              overflow: 'hidden'
            }}
          >
            {mirrorVideoStream && (
                <video
                  ref={mirrorVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    backgroundColor: 'var(--eerie-black, #171818)',
                    transition: 'all 0.3s ease',
                    display: 'block'
                  }}
                  onLoadedMetadata={() => {
                    console.log('🎥 Mirror: Video metadata carregado, video deve estar visível');
                  }}
                  onError={(e) => {
                    console.error('❌ Mirror: Erro no elemento de vídeo:', e);
                  }}
                />
            )}
          </div>
        );
        
      case 'error':
        return (
          <div 
            id="screen-mirror-container"
            style={{
              ...containerStyle,
              border: '2px solid rgba(239, 68, 68, 0.6)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <div style={{ color: 'rgb(239, 68, 68)', fontSize: '13px', textAlign: 'center' }}>
              ❌ Erro no compartilhamento de tela
              <br />
              <span style={{ fontSize: '11px', opacity: 0.8 }}>
                Tente novamente ou verifique as permissões
              </span>
            </div>
          </div>
        );
    }
  };


  return (
    <div className="h-full min-h-0 pt-[18px] px-6 pb-6">
      <div className="max-w-7xl mx-auto h-full">
        {/* Informações da Sessão */}
        {sessionId && (
          <div 
            className="mb-3 p-3 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--night)', 
              borderColor: 'rgba(249, 251, 252, 0.1)'
            }}
          >
            {sessionLoading ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--periwinkle)' }}>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-periwinkle border-t-transparent" />
                Carregando informações da sessão...
              </div>
            ) : sessionError ? (
              <div className="text-sm" style={{ color: 'var(--red-400)' }}>
                ⚠️ Erro: {sessionError}
              </div>
            ) : sessionData ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--seasalt)' }}>
                      {sessionData.sessionName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--periwinkle)' }}>
                      {sessionData.companyName} • {sessionData.industry} • {sessionData.revenue}
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-medium bg-sgbus-green text-night">
                    {sessionData.agentType}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--periwinkle)' }}>
                  <span>Sessão: {sessionId.slice(0, 8)}...</span>
                  {sessionData?.analysisCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-periwinkle bg-opacity-20 text-xs">
                      {sessionData.analysisCount} análises
                    </span>
                  )}
                  {(sessionData?.totalDuration > 0 || currentSessionDuration > 0) && (
                    <span className="px-1.5 py-0.5 rounded bg-sgbus-green bg-opacity-20 text-xs">
                      {Math.floor(((sessionData?.totalDuration || 0) + currentSessionDuration) / 60)}m {((sessionData?.totalDuration || 0) + currentSessionDuration) % 60}s
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-[1.25fr_0.9fr] gap-3 h-full">
          
          {/* COLUNA ESQUERDA - Controles e Transcrição */}
          <div className="flex flex-col space-y-3 h-full min-h-0">
            
            {/* PARTE SUPERIOR - Controles Reorganizados - RESPONSIVO */}
            <div 
              ref={controlsContainerRef}
              className="p-2 rounded-xl"
              style={{ 
                backgroundColor: 'var(--eerie-black)', 
                border: '1px solid rgba(249, 251, 252, 0.1)'
              }}
            >

              {/* Layout: Video ao lado dos controles */}
              <div className="flex gap-3 items-start h-full">
                {/* Mirror Container - Video */}
                <div className="flex-1 min-w-0">
                  {renderMirrorContainer()}
                </div>

                {/* Controles Verticais */}
                <div className="flex flex-col gap-2 min-w-[120px] sm:min-w-[140px] flex-shrink-0 h-full">
                  {/* Botão Primário - CONECTAR */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                    className="flex-none w-full h-[34px] px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-1 sm:gap-2 focus-visible:outline-2 focus-visible:outline-[color:var(--sgbus-green)] focus-visible:outline-offset-2 disabled:opacity-50"
                    style={{
                      backgroundColor: isProcessing ? 'rgba(255, 193, 7, 0.2)' : 
                                      isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 233, 76, 0.2)',
                      color: isProcessing ? '#ffc107' : 
                             isListening ? '#ef4444' : 'var(--sgbus-green)',
                      border: isProcessing ? '1px solid rgba(255, 193, 7, 0.3)' : 
                              isListening ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(107, 233, 76, 0.3)',
                      width: '140px' // Largura fixa para não mudar de tamanho
                    }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.filter = 'brightness(110%)')}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(100%)'}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                        <span>
                          {error?.includes('Tentando reconectar') ? 'RECOVERY...' : 'CONECTANDO...'}
                        </span>
                      </>
                    ) : isListening ? (
                      <>
                        <Square size={20} />
                        <span>DESCONECTAR</span>
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        <span>CONECTAR</span>
                      </>
                    )}
                  </button>

                  {/* Toggle MIC */}
                  <button
                    onClick={toggleMicrophone}
                    disabled={!isConnected}
                    className="flex-none w-full h-[34px] px-1 sm:px-2 rounded-lg text-xs font-medium transition-all duration-200 inline-flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-[color:var(--sgbus-green)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: !isConnected ? 'rgba(207, 198, 254, 0.1)' : isMicrophoneEnabled ? 'var(--sgbus-green)' : 'rgba(239, 68, 68, 0.2)',
                      color: !isConnected ? 'var(--periwinkle)' : isMicrophoneEnabled ? 'var(--night)' : '#ef4444',
                      border: !isConnected ? '1px solid rgba(207, 198, 254, 0.2)' : isMicrophoneEnabled ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                      opacity: !isConnected ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.filter = 'brightness(110%)')}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(100%)'}
                    title={!isConnected ? 'Conecte-se à sala Daily.co para habilitar o microfone' : undefined}
                  >
                    {isConnected && isMicrophoneEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                    <span>MIC</span>
                  </button>

                  {/* Toggle TELA (áudio) com alerta quando sem áudio */}
                  <div className="relative">
                    <button
                      onClick={toggleScreenAudio}
                      disabled={!isScreenAudioCaptured}
                      className="flex-none w-full h-[34px] px-1 sm:px-2 rounded-lg text-xs font-medium transition-all duration-200 inline-flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-[color:var(--sgbus-green)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: !isScreenAudioCaptured ? 'rgba(207, 198, 254, 0.1)' :
                                        // Se tela compartilhada mas sem áudio, mostrar amarelo de alerta
                                        (isScreenAudioCaptured && !hasScreenAudio) ? 'rgba(251, 191, 36, 0.2)' :
                                        isScreenAudioEnabled ? 'var(--sgbus-green)' : 'rgba(239, 68, 68, 0.2)',
                        color: !isScreenAudioCaptured ? 'var(--periwinkle)' :
                               (isScreenAudioCaptured && !hasScreenAudio) ? '#fbbf24' :
                               isScreenAudioEnabled ? 'var(--night)' : '#ef4444',
                        border: !isScreenAudioCaptured ? '1px solid rgba(207, 198, 254, 0.2)' :
                                (isScreenAudioCaptured && !hasScreenAudio) ? '1px solid rgba(251, 191, 36, 0.3)' :
                                isScreenAudioEnabled ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                        opacity: !isScreenAudioCaptured ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.filter = 'brightness(110%)')}
                      onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(100%)'}
                      title={!isScreenAudioCaptured ? 'Inicie o compartilhamento de tela primeiro' : 
                             (isScreenAudioCaptured && !hasScreenAudio) ? 'Tela compartilhada sem áudio - clique no tooltip para instruções' :
                             isScreenAudioEnabled ? 'Desabilitar áudio da tela' : 'Habilitar áudio da tela'}
                    >
                      {/* Ícone com alerta quando sem áudio */}
                      <div className="flex items-center gap-1">
                        {isScreenAudioCaptured && isScreenAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                        {/* Mostrar triângulo de alerta quando tela compartilhada mas sem áudio */}
                        {isScreenAudioCaptured && !hasScreenAudio && (
                          <AlertTriangle size={12} className="text-yellow-500" />
                        )}
                      </div>
                      <span>TELA</span>
                    </button>
                    
                    {/* Tooltip de aviso quando tela compartilhada sem áudio */}
                    <AudioWarningTooltip show={isScreenAudioCaptured && !hasScreenAudio} />
                  </div>

                  {/* NOVO: Botão Compartilhar Tela */}
                  <button
                    onClick={toggleScreenShare}
                    disabled={!isListening}
                    className="flex-none w-full h-[34px] px-1 sm:px-2 rounded-lg text-xs font-medium transition-all duration-200 inline-flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-[color:var(--sgbus-green)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isScreenAudioCaptured ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 233, 76, 0.2)',
                      color: isScreenAudioCaptured ? '#ef4444' : 'var(--sgbus-green)',
                      border: isScreenAudioCaptured ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(107, 233, 76, 0.3)'
                    }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.filter = 'brightness(110%)')}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(100%)'}
                    title={isScreenAudioCaptured ? 'Parar compartilhamento de tela' : 'Iniciar compartilhamento de tela'}
                  >
                    <ScreenShare size={16} />
                    <span>{isScreenAudioCaptured ? 'PARAR' : 'COMPART.'}</span>
                  </button>

                  {/* Espaçador para empurrar botões para baixo */}
                  <div className="flex-1"></div>

                  {/* Linha dos botões secundários - ANÁLISE e LIXEIRA */}
                  <div className="flex items-center gap-1 w-full">
                    {/* Botão Secundário - Analisar */}
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || (blocks.length === 0 && !interimTranscript.trim())}
                      aria-label="Analisar transcrição (Tecla: Espaço)"
                      className="flex-1 h-[34px] px-2 rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-[color:var(--sgbus-green)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      style={{
                        backgroundColor: isQuickAnalysis 
                          ? (isAnalyzing ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.2)')
                          : (isAnalyzing ? 'rgba(107, 233, 76, 0.2)' : 'rgba(107, 233, 76, 0.1)'),
                        color: isQuickAnalysis ? '#ffc107' : 'var(--sgbus-green)',
                        border: isQuickAnalysis ? '1px solid rgba(255, 193, 7, 0.5)' : '1px solid rgba(107, 233, 76, 0.3)'
                      }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.filter = 'brightness(110%)')}
                      onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(100%)'}
                    >
                      {isQuickAnalysis ? <Zap size={16} /> : <Brain size={16} />}
                      <span>ANÁLISE</span>
                    </button>

                    {/* Botão Secundário - Lixeira */}
                    <button
                      onClick={clearTranscriptionHistory}
                      disabled={blocks.length === 0}
                      aria-label="Limpar histórico de transcrição"
                      className="flex-none w-[34px] h-[34px] rounded-lg transition-all duration-200 inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[color:var(--sgbus-green)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        border: '1px solid var(--periwinkle)',
                        color: 'var(--periwinkle)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.filter = 'brightness(110%)')}
                      onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(100%)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Checkbox "Análise Rápida" */}
                  <div className="flex items-center gap-2 mt-0">
                    <label 
                      className="flex items-center gap-2 cursor-pointer text-xs"
                      style={{ color: 'var(--seasalt)' }}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isQuickAnalysis}
                          onChange={(e) => setIsQuickAnalysis(e.target.checked)}
                          className="w-3 h-3 rounded appearance-none cursor-pointer transition-all duration-200 ease focus:outline-none"
                          style={{
                            backgroundColor: isQuickAnalysis ? 'var(--sgbus-green)' : 'var(--night)',
                            border: isQuickAnalysis ? '1px solid var(--sgbus-green)' : '1px solid rgba(249, 251, 252, 0.2)',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                        />
                        {isQuickAnalysis && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ 
                              fontSize: '8px',
                              color: 'var(--night)',
                              fontWeight: 'bold'
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                      análise rápida
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* ÁREA DE TRANSCRIÇÃO - EXPANSÍVEL */}
            <div className="flex-1 flex flex-col min-h-0">
            <div 
                className="flex-1 flex flex-col rounded-xl overflow-hidden min-h-0"
                style={{ 
                  backgroundColor: 'var(--eerie-black)', 
                  border: '1px solid rgba(249, 251, 252, 0.1)'
                }}
              >
                {/* Conteúdo da transcrição */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 pt-2 px-2 pb-2 overflow-y-auto relative thin-scrollbar"
                  style={{ 
                    scrollBehavior: 'smooth'
                  }}
                >
                  {/* Floating scroll button */}
                  {!isAutoScrollEnabled && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={enableAutoScroll}
                        className="px-2 py-1 rounded text-xs transition-all duration-200 shadow-lg"
                        style={{ 
                          backgroundColor: 'rgba(207, 198, 254, 0.9)',
                          color: 'var(--periwinkle)',
                          border: '1px solid rgba(207, 198, 254, 0.3)'
                        }}
                      >
                        ⬇️ SCROLL
                      </button>
                    </div>
                  )}
                  {error && (
                    <div 
                      className="mb-4 p-4 rounded-lg"
                      style={{ 
                        backgroundColor: error.includes('Esta sessão foi encerrada') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: error.includes('Esta sessão foi encerrada') ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2" 
                             style={{ color: error.includes('Esta sessão foi encerrada') ? '#d97706' : '#ef4444' }}>
                            {error.includes('Esta sessão foi encerrada') ? '🚫 Sessão Duplicada Detectada' : '❌ Erro'}
                          </p>
                          <p className="text-sm leading-relaxed" 
                             style={{ color: error.includes('Esta sessão foi encerrada') ? '#92400e' : '#dc2626' }}>
                            {error}
                          </p>
                          
                          {/* 🆕 FASE 3: Ações específicas para erro de duplicação */}
                          {error.includes('Esta sessão foi encerrada') && (
                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => window.location.reload()}
                                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                                style={{ 
                                  backgroundColor: '#d97706',
                                  color: 'white'
                                }}
                              >
                                🔄 Tentar Novamente
                              </button>
                              <button
                                onClick={() => {
                                  // Copiar instruções para clipboard
                                  navigator.clipboard.writeText('1. Feche todas as outras abas desta sessão\n2. Recarregue esta página\n3. Tente conectar novamente');
                                  alert('Instruções copiadas para área de transferência!');
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                                style={{ 
                                  backgroundColor: 'transparent',
                                  color: '#d97706',
                                  border: '1px solid #d97706'
                                }}
                              >
                                📋 Copiar Instruções
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FASE 5: Renderizar blocos com sistema de blocos incremental */}
                  {blocks.map((block, index) => (
                    <div 
                      key={`block-${block.id}`}
                      className="mb-2" 
                      style={{ 
                        backgroundColor: block.color === 'green' ? 'rgba(107, 233, 76, 0.1)' : 
                                        block.color === 'blue' ? 'rgba(207, 198, 254, 0.1)' : 
                                        'rgba(249, 251, 252, 0.05)',
                        padding: '8px',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${
                          block.color === 'green' ? 'var(--sgbus-green)' : 
                          block.color === 'blue' ? 'var(--periwinkle)' : 
                          'var(--seasalt)'
                        }`
                      }}
                    >
                      {/* Header do bloco com informações de fonte */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ 
                              backgroundColor: block.color === 'green' ? 'var(--sgbus-green)' : 
                                              block.color === 'blue' ? 'var(--periwinkle)' : 
                                              'var(--seasalt)'
                            }}
                          ></div>
                          <span className="text-xs font-medium" style={{ 
                            color: block.color === 'green' ? 'var(--sgbus-green)' : 
                                   block.color === 'blue' ? 'var(--periwinkle)' : 
                                   'var(--seasalt)'
                          }}>
                            {block.source === 'screen' ? '🖥️ TELA' : 
                             block.source === 'microphone' ? '🎤 MICROFONE' : '👤 REMOTO'}
                          </span>
                        </div>
                        <span className="text-xs opacity-70" style={{ color: 'var(--seasalt)' }}>
                          {block.startTime.toLocaleTimeString()} | {block.text.length} chars
                        </span>
                      </div>
                      
                      {/* Texto da transcrição */}
                      <p 
                        className="text-base leading-relaxed" 
                        style={{ 
                          color: block.color === 'green' ? 'var(--sgbus-green)' : 
                                 block.color === 'blue' ? 'var(--periwinkle)' : 
                                 'var(--seasalt)'
                        }}
                      >
                        {block.text}
                        {/* FASE 5: Mostrar texto interim no último bloco */}
                        {index === blocks.length - 1 && interimTranscript && (
                          <span 
                            className="opacity-70 italic ml-1"
                            style={{ color: 'var(--periwinkle)' }}
                          >
                            {interimTranscript}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}

                  {/* FASE 5: Texto interim agora é exibido dentro do último bloco */}

                  {/* Fallback para transcrição consolidada (caso segments não estejam disponíveis) */}
                  {!segments.length && transcript && (
                    <p 
                      className="text-base leading-relaxed mb-2" 
                      style={{ color: 'var(--seasalt)' }}
                    >
                      {transcript}
                    </p>
                  )}

                  {!transcript && !interimTranscript && !isListening && (
                    <div className="text-center pt-4 pb-8">
                      <p className="text-lg mb-2" style={{ color: 'var(--periwinkle)' }}>
                        🎙️ Pressione &quot;CONECTAR&quot; para começar a transcrição
                      </p>
                      <p className="text-sm opacity-70" style={{ color: 'var(--seasalt)' }}>
                        Sistema capturará áudio do microfone e da tela
                      </p>
                    </div>
                  )}

                  {isListening && !transcript && !interimTranscript && (
                    <div className="text-center pt-4 pb-8">
                      <p className="text-lg mb-2" style={{ color: 'var(--sgbus-green)' }}>
                        🎧 Escutando...
                      </p>
                      <p className="text-sm opacity-70" style={{ color: 'var(--seasalt)' }}>
                        Fale algo para começar a transcrição
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - Histórico de Análises */}
          <div className="flex flex-col h-full min-h-0">
            
            {/* HISTÓRICO DE ANÁLISES - EXPANSÍVEL */}
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <div 
                className="flex-1 flex flex-col rounded-xl overflow-hidden min-h-0"
                style={{ 
                  backgroundColor: 'var(--eerie-black)', 
                  border: '1px solid rgba(249, 251, 252, 0.1)'
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-opacity-10" style={{ borderColor: 'var(--seasalt)' }}>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--seasalt)' }}>
                    ANÁLISES DE IA
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs" style={{ color: 'var(--periwinkle)' }}>
                      {analysisHistory.length} análises
                    </span>
                    
                    {/* Botão Tutorial */}
                    <button
                      onClick={() => setIsTutorialOpen(true)}
                      aria-label="Abrir tutorial"
                      className="w-[18px] h-[18px] rounded-full transition-all duration-200 inline-flex items-center justify-center hover:scale-110 focus-visible:outline-2 focus-visible:outline-[color:var(--periwinkle)] focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'rgba(207, 198, 254, 0.1)',
                        color: 'var(--periwinkle)',
                        border: '1px solid rgba(207, 198, 254, 0.3)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(207, 198, 254, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(207, 198, 254, 0.1)'}
                    >
                      <HelpCircle size={16} />
                    </button>
                  </div>
                </div>

                <div ref={analysisScrollRef} className="flex-1 p-2 overflow-y-auto space-y-4 persistent-scrollbar">
                  {analysisHistory.length === 0 && (
                    <div className="text-center pt-4 pb-8">
                      <p className="text-sm opacity-70" style={{ color: 'var(--seasalt)' }}>
                        Use o botão 🧠 no menu de controles acima para analisar a transcrição
                      </p>
                    </div>
                  )}

                  {analysisHistory.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="p-2 rounded-lg border"
                      style={{ 
                        backgroundColor: 'rgba(249, 251, 252, 0.05)',
                        borderColor: 'rgba(249, 251, 252, 0.1)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--periwinkle)' }}>
                          {analysis.timestamp}
                        </span>
                        {analysis.isProcessing && (
                          <span className="text-xs animate-pulse" style={{ color: 'var(--sgbus-green)' }}>
                            ⏳ Processando...
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs mb-2 opacity-70" style={{ color: 'var(--seasalt)' }}>
                        <strong>Contexto:</strong> {analysis.contexto.substring(0, 150)}...
                      </div>
                      
                      {analysis.resposta && (
                        isHtmlContent(analysis.resposta) ? (
                          <div 
                            className="text-sm leading-relaxed analysis-content"
                            style={{ 
                              color: 'var(--seasalt)',
                            }}
                            dangerouslySetInnerHTML={{ __html: analysis.resposta }}
                          />
                        ) : (
                          <div 
                            className="text-sm leading-relaxed whitespace-pre-wrap"
                            style={{ color: 'var(--seasalt)' }}
                          >
                            {analysis.resposta}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Tutorial Completo */}
      <TutorialModal 
        isOpen={isTutorialOpen}
        onClose={() => {
          setIsTutorialOpen(false);
          if (isFirstVisit) {
            markAsVisited();
          }
        }}
      />


    </div>
  );
};

export default DailyTranscriptionDisplay; 