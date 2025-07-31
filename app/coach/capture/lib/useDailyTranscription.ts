import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import DailyIframe, { 
  DailyCall, 
  DailyEvent
} from '@daily-co/daily-js';

// Interface para blocos de transcrição (Fase 2)
interface TranscriptionBlock {
  id: string; // Ex: `block-${Date.now()}`
  source: 'microphone' | 'screen' | 'remote';
  color: 'blue' | 'green' | 'gray';
  startTime: Date;
  text: string; // O texto consolidado do bloco
}

// Interface compatível com Deepgram (mantendo mesma estrutura) + Enhanced Dual Stream
export interface TranscriptionState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isConnected: boolean;
  isProcessing: boolean;
  error: string | null;
  connectionQuality: 'good' | 'poor' | 'disconnected';
  audioLevel: number;
  wordsTranscribed: number;
  sessionDuration: number;
  lastActivity: Date | null;
  canForceFinalize: boolean;
  devicePermissions: {
    microphone: boolean;
    speaker: boolean;
  };
  availableDevices: {
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  };
  selectedDeviceId: string | null;
  isScreenAudioCaptured: boolean;
  transcriptionLanguage: string;
  confidence: number;
  isPaused: boolean;
  segments: Array<{
    text: string;
    confidence: number;
    timestamp: Date;
    isFinal: boolean;
    audioSource: 'screen' | 'microphone' | 'remote';
    color: 'green' | 'blue' | 'gray';
    speakerId?: string; // NOVO: ID do speaker via diarização
    trackType?: 'audio' | 'screenAudio'; // NOVO: Tipo de track do Daily.co
  }>;
  blocks: TranscriptionBlock[]; // NOVO: Sistema de blocos (Fase 2)
  // NOVOS CAMPOS para Dual Stream Enhancement
  trackInfo: {
    audioTrackActive: boolean;
    screenAudioTrackActive: boolean;
    lastDetectedSource: 'microphone' | 'screen' | 'unknown';
  };
  diarizationEnabled: boolean;
  speakerStats: {
    microphoneSegments: number;
    screenSegments: number;
    totalSpeakers: number;
  };
  // NOVOS CAMPOS para Controles Independentes (Fase 2)
  isMicrophoneEnabled: boolean;
  isScreenAudioEnabled: boolean;
}

// Interface para configuração Daily
interface DailyTranscriptionConfig {
  language?: string;
  model?: string;
  profanityFilter?: boolean;
  enableScreenAudio?: boolean;
  enableInterimResults?: boolean;
}

// Interface para eventos de transcrição Daily
interface DailyTranscriptionMessage {
  type: 'transcription-message';
  sessionId: string;
  participantId: string;
  text: string;
  timestamp: string;
  is_final: boolean;
  confidence?: number;
  language?: string;
}

// Função para diagnosticar disponibilidade de APIs
const checkMediaDevicesSupport = () => {
  const support = {
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
    enumerateDevices: !!(navigator.mediaDevices?.enumerateDevices),
    addEventListener: !!(navigator.mediaDevices?.addEventListener),
    isSecureContext: !!window.isSecureContext,
    protocol: window.location.protocol
  };
  
  console.log('📋 Diagnóstico MediaDevices:', support);
  return support;
};

export const useDailyTranscription = (config?: DailyTranscriptionConfig) => {
  // Hook para acessar dados do usuário Clerk
  const { user, isLoaded: isUserLoaded } = useUser();

  // Diagnóstico inicial - executar apenas uma vez
  useEffect(() => {
    checkMediaDevicesSupport();
  }, []);

  // Estados principais compatíveis com Deepgram + Enhanced Dual Stream
  const [state, setState] = useState<TranscriptionState>({
    transcript: '',
    interimTranscript: '',
    isListening: false,
    isConnected: false,
    isProcessing: false,
    error: null,
    connectionQuality: 'disconnected',
    audioLevel: 0,
    wordsTranscribed: 0,
    sessionDuration: 0,
    lastActivity: null,
    canForceFinalize: true,
    devicePermissions: {
      microphone: false,
      speaker: false
    },
    availableDevices: {
      microphones: [],
      speakers: []
    },
    selectedDeviceId: null,
    isScreenAudioCaptured: false,
    transcriptionLanguage: config?.language || 'pt',
    confidence: 0,
    isPaused: false,
    segments: [],
    blocks: [], // NOVO: Sistema de blocos inicializado (Fase 2)
    // NOVOS CAMPOS INICIALIZADOS
    trackInfo: {
      audioTrackActive: false,
      screenAudioTrackActive: false,
      lastDetectedSource: 'unknown'
    },
    diarizationEnabled: true, // Ativado por padrão
    speakerStats: {
      microphoneSegments: 0,
      screenSegments: 0,
      totalSpeakers: 0
    },
    // NOVOS CAMPOS INICIALIZADOS (Fase 2)
    isMicrophoneEnabled: false, // Microfone inicia desligado
    isScreenAudioEnabled: true   // Áudio da tela inicia ligado
  });

  // Refs para Daily.co
  const callObjectRef = useRef<DailyCall | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  
  // Sistema de deduplicação específico para nosso contexto (1 usuário, 2 canais)
  const processedMessagesRef = useRef<Map<string, number>>(new Map());
  const processedInterimRef = useRef<Map<string, number>>(new Map()); // Cache separado para interim
  const MESSAGE_CLEANUP_INTERVAL = 10000; // 10s cleanup

  // NOVA FUNÇÃO: Determinar fonte de áudio - ESTRATÉGIA BASEADA EM DADOS REAIS
  const determineAudioSourceAdvanced = useCallback((data: any, participants: any): {
    audioSource: 'screen' | 'microphone' | 'remote';
    trackType: 'audio' | 'screenAudio';
    confidence: number;
  } => {
    console.log('🔬 Analisando dados para detecção de fonte:', {
      hasTrackType: !!data.track_type,
      hasSpeakerId: !!(data.speaker_id || data.speaker),
      hasParticipantId: !!data.participant_id,
      screenCaptureActive: state.isScreenAudioCaptured,
      availableDataFields: Object.keys(data),
    });

    // 1. PRIMEIRO: Verificar se há informações diretas de track no evento
    if (data.track_type) {
      const trackType = data.track_type as 'audio' | 'screenAudio';
      console.log('✅ Fonte detectada via track_type:', trackType);
      return {
        audioSource: trackType === 'screenAudio' ? 'screen' : 'microphone',
        trackType,
        confidence: 0.95
      };
    }

    // 2. SEGUNDO: Usar diarização (speaker ID) se disponível
    if (data.speaker_id || data.speaker) {
      const speakerId = data.speaker_id || data.speaker;
      console.log('🎭 Tentando detectar fonte via speaker ID:', speakerId);
      
      // Estratégia: speaker IDs diferentes = fontes diferentes
      // Speaker 0 ou primeiro = microfone, Speaker 1+ = tela
      const isFirstSpeaker = speakerId === '0' || speakerId === 0 || speakerId === 'speaker_0';
      
      if (state.isScreenAudioCaptured && !isFirstSpeaker) {
        return {
          audioSource: 'screen',
          trackType: 'screenAudio',
          confidence: 0.8
        };
      }
    }

    // 3. TERCEIRO: Análise de tracks se disponível
    const localParticipant = participants?.local;
    if (localParticipant?.tracks) {
      const audioTrack = localParticipant.tracks.audio;
      const screenAudioTrack = localParticipant.tracks.screenAudio;
      
      const audioActive = audioTrack?.state === 'sendable' || audioTrack?.state === 'loading';
      const screenAudioActive = screenAudioTrack?.state === 'sendable' || screenAudioTrack?.state === 'loading';
      
      console.log('🎵 Status dos tracks:', { audioActive, screenAudioActive });
      
      // Atualizar trackInfo no estado
      setState(prev => ({
        ...prev,
        trackInfo: {
          audioTrackActive: audioActive,
          screenAudioTrackActive: screenAudioActive,
          lastDetectedSource: screenAudioActive && state.isScreenAudioCaptured ? 'screen' : 'microphone'
        }
      }));
      
      // Se apenas screen audio está ativo
      if (screenAudioActive && !audioActive && state.isScreenAudioCaptured) {
        return {
          audioSource: 'screen',
          trackType: 'screenAudio',
          confidence: 0.9
        };
      }
    }

    // 4. QUARTO: Fallback inteligente para dual stream
    if (state.isScreenAudioCaptured) {
      console.log('🔄 Usando fallback para dual stream');
      
      // Estratégia baseada em características do texto ou timestamp
      const textLength = data.text?.length || 0;
      const isLongText = textLength > 30; // Textos longos podem ser da tela (leitura)
      const timestampBased = Math.floor(Date.now() / 2000) % 2 === 0; // Alternar a cada 2 segundos
      
      // Combinação de fatores
      const isScreenSource = isLongText || timestampBased;
      
      return {
        audioSource: isScreenSource ? 'screen' : 'microphone',
        trackType: isScreenSource ? 'screenAudio' : 'audio',
        confidence: 0.6
      };
    }

    // 5. FINAL: Default para microfone
    console.log('🎤 Defaulting para microfone');
    return {
      audioSource: 'microphone',
      trackType: 'audio',
      confidence: 0.8
    };
  }, [state.isScreenAudioCaptured]);

  // Atualizar duração da sessão
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isListening && startTimeRef.current) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - startTimeRef.current!.getTime()) / 1000);
        setState(prev => ({ ...prev, sessionDuration: duration }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isListening]);

  // Função para obter permissões de mídia
  const requestPermissions = useCallback(async () => {
    try {
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ getUserMedia não disponível - verifique se está em HTTPS');
        setState(prev => ({
          ...prev,
          error: 'Acesso ao microfone não disponível (necessário HTTPS)',
          devicePermissions: {
            ...prev.devicePermissions,
            microphone: false
          }
        }));
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({
        ...prev,
        devicePermissions: {
          ...prev.devicePermissions,
          microphone: true
        }
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao obter permissões:', error);
      setState(prev => ({
        ...prev,
        error: 'Permissão de microfone negada ou não disponível',
        devicePermissions: {
          ...prev.devicePermissions,
          microphone: false
        }
      }));
      
      return false;
    }
  }, []);

  // Função para listar dispositivos disponíveis
  const updateAvailableDevices = useCallback(async () => {
    try {
      // Verificar se mediaDevices está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('⚠️ navigator.mediaDevices não disponível');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      setState(prev => ({
        ...prev,
        availableDevices: {
          microphones: devices.filter(d => d.kind === 'audioinput'),
          speakers: devices.filter(d => d.kind === 'audiooutput')
        }
      }));
    } catch (error) {
      console.error('❌ Erro ao listar dispositivos:', error);
    }
  }, []);

  // Monitorar nível de áudio
  const startAudioLevelMonitoring = useCallback((callObject: DailyCall) => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    audioLevelIntervalRef.current = setInterval(async () => {
      try {
        const stats = await callObject.getNetworkStats();
        const localAudio = stats?.stats?.latest?.recvBitsPerSecond || 0;
        
        setState(prev => ({
          ...prev,
          audioLevel: Math.min(100, Math.max(0, localAudio / 1000)) // Converter para 0-100
        }));
      } catch (error) {
        // Silencioso - estatísticas podem não estar disponíveis
      }
    }, 100);
  }, []);

  // Handler otimizado para transcrição iniciada
  const handleTranscriptionStarted = useCallback((event: any) => {
    console.log('✅ Transcrição Daily.co iniciada:', event);
    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      lastActivity: new Date()
    }));
  }, []);

  // Handler otimizado para erro de transcrição COM RETRY
  const handleTranscriptionError = useCallback(async (event: any) => {
    console.error('❌ Erro de transcrição:', event);
    
    // Se for erro 403, tentar com configuração ainda mais simples
    if (event.errorMsg?.includes('403') || event.errorMsg?.includes('Unexpected server response')) {
      console.log('🔄 Tentando reconectar com configuração básica...');
      
      try {
        const callObject = callObjectRef.current;
        if (callObject) {
          // Aguardar um pouco antes da tentativa
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Configuração mínima válida
          const basicConfig = {
            language: 'pt-BR',
            model: 'nova-2-general'
          };
          
          await callObject.startTranscription(basicConfig);
          
          setState(prev => ({
            ...prev,
            error: 'Reconectado com configuração básica - diarização limitada',
            isListening: true,
            isProcessing: false
          }));
          
          console.log('✅ Reconectado com configuração básica');
          return;
        }
      } catch (retryError) {
        console.error('❌ Falha na reconexão:', retryError);
      }
    }
    
    setState(prev => ({
      ...prev,
      error: `Erro de transcrição: ${event.errorMsg || 'Erro desconhecido'}`,
      isListening: false,
      isProcessing: false
    }));
  }, []);

  // Sistema de deduplicação para nosso contexto específico
  const isDuplicateMessage = useCallback((data: any) => {
    const now = Date.now();
    const isInterim = !data.is_final;
    
    // Gerar chave única baseada no conteúdo e contexto
    // Para nosso caso: 1 usuário com 2 canais (microfone + tela)
    const messageKey = `${data.text?.trim()}_${data.is_final ? 'final' : 'interim'}_${data.timestamp || now}`;
    
    // Para mensagens interim, usar cache separado com chave mais específica
    if (isInterim) {
      // Chave específica para interim: conteúdo + timestamp (mais sensível)
      const interimKey = `${data.text?.trim()}_interim`;
      
      if (processedInterimRef.current.has(interimKey)) {
        console.log('🔄 Mensagem interim duplicada ignorada:', interimKey.substring(0, 50) + '...');
        return true;
      }
      
      // Limpar cache interim anterior (manter apenas o mais recente)
      processedInterimRef.current.clear();
      processedInterimRef.current.set(interimKey, now);
      
      return false;
    }
    
    // Para mensagens finais, usar cache normal
    if (processedMessagesRef.current.has(messageKey)) {
      console.log('🔄 Mensagem final duplicada ignorada:', messageKey.substring(0, 50) + '...');
      return true;
    }
    
    // Adicionar ao cache de mensagens processadas
    processedMessagesRef.current.set(messageKey, now);
    
    // Cleanup automático - remover mensagens antigas (>10s)
    const cutoffTime = now - MESSAGE_CLEANUP_INTERVAL;
    for (const [key, timestamp] of Array.from(processedMessagesRef.current.entries())) {
      if (timestamp < cutoffTime) {
        processedMessagesRef.current.delete(key);
      }
    }
    
    return false;
  }, []);

  // Handler otimizado para mensagem de transcrição com deduplicação
  const handleTranscriptionMessage = useCallback((data: any) => {
    const startTime = performance.now();
    
    // Verificar duplicata antes de processar
    if (isDuplicateMessage(data)) {
      return; // Ignorar mensagem duplicada
    }
    
    console.log('📝 Transcrição processada (única):', data);
    
    // DEBUG INTENSIVO: Analisar TODOS os dados disponíveis
    const participants = callObjectRef.current?.participants();
    
    console.log('🔍 DEBUG COMPLETO - Dados brutos:', {
      rawData: data,
      dataKeys: Object.keys(data),
      dataValues: Object.values(data),
      participantsExists: !!participants,
      localParticipant: participants?.local,
      localTracks: participants?.local?.tracks,
      isScreenCaptured: state.isScreenAudioCaptured,
      callObjectMethods: callObjectRef.current 
        ? (() => {
            const callObject = callObjectRef.current;
            if (!callObject) return [];
            return Object.getOwnPropertyNames(callObject)
              .filter(name => {
                const descriptor = Object.getOwnPropertyDescriptor(callObject, name);
                return descriptor && typeof descriptor.value === 'function';
              })
              .slice(0, 10);
          })()
        : []
    });
    
    // NOVA ESTRATÉGIA: Usar função avançada de detecção de fonte
    const sourceAnalysis = determineAudioSourceAdvanced(data, participants);
    
    const audioSource = sourceAnalysis.audioSource;
    const trackType = sourceAnalysis.trackType;
    const detectionConfidence = sourceAnalysis.confidence;
    
    const color: 'green' | 'blue' | 'gray' = 
      audioSource === 'screen' ? 'green' : 
      audioSource === 'microphone' ? 'blue' : 'gray';
    

    console.log('📊 Enhanced Debug Daily.co:', {
      data,
      sourceAnalysis,
      participants: participants?.local,
      trackInfo: state.trackInfo,
      speakerId: data.speaker_id || data.speaker,
      trackType: data.track_type,
      isScreenAudioCaptured: state.isScreenAudioCaptured,
      availableFields: Object.keys(data),
      participantTracks: participants?.local?.tracks
    });
    
    console.log(`🎤 Fonte detectada (Enhanced): ${audioSource} (${trackType}) - Confiança: ${(detectionConfidence * 100).toFixed(1)}%`);
    
    const newSegment = {
      text: data.text,
      confidence: data.confidence || 0,
      timestamp: new Date(),
      isFinal: data.is_final || false,
      audioSource,
      color,
      speakerId: data.speaker_id || data.speaker || 'unknown', // NOVO: Speaker ID da diarização
      trackType // NOVO: Tipo de track detectado
    };

    setState(prev => {
      const updatedSegments = [...prev.segments, newSegment];
      
      // NOVO: Atualizar estatísticas de speakers
      const newStats = {
        microphoneSegments: prev.speakerStats.microphoneSegments + (audioSource === 'microphone' ? 1 : 0),
        screenSegments: prev.speakerStats.screenSegments + (audioSource === 'screen' ? 1 : 0),
        totalSpeakers: new Set([...prev.segments.map(s => s.speakerId), newSegment.speakerId]).size
      };
      
      if (data.is_final) {
        // FASE 4: Lógica de Separação - Criando Novos Blocos
        const lastBlock = prev.blocks[prev.blocks.length - 1];
        let updatedBlocks;
        
        // Verificações para criação de novo bloco
        const shouldCreateNewBlock = !lastBlock || 
                                   lastBlock.source !== audioSource || 
                                   lastBlock.text.length > 500;
        
        if (shouldCreateNewBlock) {
          // CONDIÇÃO ATINGIDA: Criar um NOVO bloco
          const newBlock: TranscriptionBlock = {
            id: `block-${Date.now()}`,
            source: audioSource,
            color: color,
            startTime: new Date(),
            text: data.text
          };
          updatedBlocks = [...prev.blocks, newBlock];
          
          // Logs específicos da Fase 4
          if (!lastBlock) {
            console.log('🆕 Criado primeiro bloco:', newBlock);
          } else if (lastBlock.source !== audioSource) {
            console.log('🔄 Novo bloco criado - mudança de fonte:', {
              anterior: lastBlock.source,
              nova: audioSource,
              novoBloco: newBlock
            });
          } else if (lastBlock.text.length > 500) {
            console.log('📏 Novo bloco criado - limite de 500 caracteres atingido:', {
              tamanhoAnterior: lastBlock.text.length,
              novoBloco: newBlock
            });
          }
        } else {
          // CONDIÇÃO NÃO ATINGIDA: Anexar ao bloco existente
          const updatedBlock = {
            ...lastBlock,
            text: lastBlock.text + (lastBlock.text ? ' ' : '') + data.text
          };
          updatedBlocks = [...prev.blocks.slice(0, -1), updatedBlock];
          console.log('📝 Texto anexado ao bloco existente:', {
            tamanhoAtual: updatedBlock.text.length,
            fonte: updatedBlock.source,
            bloco: updatedBlock
          });
        }
        
        // Log para debug da Fase 4
        console.log('🔍 Estado dos blocos (Fase 4):', JSON.stringify(updatedBlocks, null, 2));
        
        // Texto final - adicionar ao transcript principal
        const finalText = prev.transcript + (prev.transcript ? ' ' : '') + data.text;
        
        return {
          ...prev,
          transcript: finalText,
          interimTranscript: '', // Limpar interim
          segments: updatedSegments,
          blocks: updatedBlocks, // NOVO: Atualizar blocos
          wordsTranscribed: finalText.split(' ').length,
          lastActivity: new Date(),
          confidence: data.confidence || 0,
          speakerStats: newStats // NOVO: Estatísticas atualizadas
        };
      } else {
        // Resultado interim - apenas atualizar interimTranscript (sem duplicação visual)
        return {
          ...prev,
          interimTranscript: data.text,
          segments: updatedSegments,
          lastActivity: new Date(),
          confidence: data.confidence || 0,
          speakerStats: newStats // NOVO: Estatísticas atualizadas
        };
      }
    });
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    console.log(`⚡ Tempo de processamento: ${processingTime.toFixed(2)}ms`);
  }, [isDuplicateMessage]);

  // Handlers de eventos Daily.co com performance otimizada
  const setupDailyEventHandlers = useCallback((callObject: DailyCall) => {
    // Evento de participante entrou
    callObject.on('joined-meeting', () => {
      console.log('✅ Conectado à sala Daily.co');
      setState(prev => ({ 
        ...prev, 
        isConnected: true,
        connectionQuality: 'good',
        error: null
      }));
    });

    // Evento de erro com tratamento específico para transport
    callObject.on('error', (event) => {
      console.error('❌ Erro Daily.co:', event);
      
      // Tratamento específico para erro de transport disconnected
      if (event.errorMsg?.includes('transport') || event.errorMsg?.includes('disconnected')) {
        console.log('🔄 Detectado erro de transport, tentando reconexão...');
        setState(prev => ({
          ...prev,
          error: 'Reconectando...',
          connectionQuality: 'poor'
        }));
        
        // Tentar reconexão após delay
        setTimeout(async () => {
          try {
            if (callObjectRef.current && state.isListening) {
              console.log('🔄 Reiniciando transcrição após erro de transport...');
              await callObjectRef.current.startTranscription({
                language: 'pt-BR',
                model: 'nova-2-general',
                profanity_filter: false,
                endpointing: 100,
                extra: {
                  interim_results: true,
                  punctuate: true,
                  utterance_end_ms: 1000
                }
              });
              setState(prev => ({ ...prev, error: null, connectionQuality: 'good' }));
              console.log('✅ Transcrição reconectada com sucesso');
            }
          } catch (reconnectError) {
            console.error('❌ Falha na reconexão:', reconnectError);
            setState(prev => ({
              ...prev,
              error: 'Falha na reconexão - tente reiniciar',
              isListening: false,
              isConnected: false,
              connectionQuality: 'disconnected'
            }));
          }
        }, 3000);
      } else {
        // Outros erros
        setState(prev => ({
          ...prev,
          error: `Erro Daily.co: ${event.errorMsg || 'Erro desconhecido'}`,
          isListening: false,
          isConnected: false,
          connectionQuality: 'disconnected'
        }));
      }
    });

    // Handlers específicos ultra-rápidos
    callObject.on('transcription-started', handleTranscriptionStarted);
    callObject.on('transcription-error', handleTranscriptionError);
    
    // Evento de transcrição parada
    callObject.on('transcription-stopped', (event) => {
      console.log('⏹️ Transcrição Daily.co parada:', event);
      setState(prev => ({ ...prev, isProcessing: false }));
    });

    // HANDLER PRIMÁRIO: Evento dedicado transcription-message (RECOMENDADO)
    callObject.on('transcription-message', (event) => {
      console.log('📝 Transcription-message (primário):', event);
      try {
        handleTranscriptionMessage(event);
      } catch (error) {
        console.error('❌ Erro ao processar transcription-message:', error);
      }
    });

    // HANDLER BACKUP: app-message para redundância com fallback condicional
    // Nosso contexto: 1 usuário, 2 canais - não precisa filtro por session_id
    callObject.on('app-message', (event) => {
      // Filtro básico para mensagens de transcrição
      if (event.fromId !== 'transcription' || !event.data) return;
      
      console.log('📝 App-message (backup/fallback):', event.data);
      try {
        // Sistema de deduplicação já trata duplicatas automaticamente
        // Permite redundância sem duplicação visual
        handleTranscriptionMessage(event.data);
      } catch (error) {
        console.error('❌ Erro ao processar app-message backup:', error);
      }
    });

    // Monitorar qualidade da conexão
    callObject.on('network-quality-change', (event) => {
      // Daily.co agora usa threshold ao invés de quality
      const threshold = (event as any).threshold || event.quality;
      setState(prev => ({
        ...prev,
        connectionQuality: threshold > 0.5 ? 'good' : 'poor'
      }));
    });

    // Iniciar monitoramento de áudio
    startAudioLevelMonitoring(callObject);
  }, [startAudioLevelMonitoring, handleTranscriptionStarted, handleTranscriptionError, handleTranscriptionMessage]);



  // Função para iniciar transcrição (compatível com Deepgram)
  const startListening = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isProcessing: true }));

      // Verificar se usuário está carregado e logado
      if (!isUserLoaded || !user) {
        console.log('⏳ Aguardando dados do usuário...');
        setState(prev => ({ ...prev, error: 'Aguardando autenticação do usuário', isProcessing: false }));
        return;
      }

      // Verificar permissões de microfone
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // 1. Verificar se já estamos conectados à sala (reconexão)
      let callObject = callObjectRef.current;
      
      if (!callObject || !state.isConnected) {
        // Precisamos conectar à sala primeiro
        
        // Criar sala com clerk-id
        const roomName = `transcription-${user.id}`;
        console.log(`🏠 Verificando/criando sala persistente: ${roomName}`);

        // Verificar se sala já existe ou criar nova
        let roomData;
        try {
          const roomResponse = await fetch('/api/daily/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomName: roomName, // Nome específico baseado no clerk ID
              language: config?.language || 'pt',
              transcriptionModel: config?.model || 'nova-2-general',
              enableTranscription: true
            })
          });

          if (!roomResponse.ok) {
            throw new Error('Erro ao criar/acessar sala Daily.co');
          }

          roomData = await roomResponse.json();
          roomNameRef.current = roomData.room.name;
          
          if (roomData.room.isExisting) {
            console.log(`🔄 Reconectando à sala existente: ${roomData.room.name}`);
          } else {
            console.log(`✅ Nova sala criada: ${roomData.room.name}`);
          }

        } catch (error) {
          console.error('❌ Erro ao preparar sala:', error);
          setState(prev => ({ ...prev, error: 'Erro ao preparar sala de conferência', isProcessing: false }));
          return;
        }

        // Criar token de acesso
        const tokenResponse = await fetch('/api/daily/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: roomData.room.name,
            userName: `${user.firstName || 'Usuario'}-${user.id.slice(-6)}`,
            enableTranscription: true,
            permissions: {
              canScreenshare: config?.enableScreenAudio !== false
            }
          })
        });

        if (!tokenResponse.ok) {
          throw new Error('Erro ao criar token Daily.co');
        }

        const tokenData = await tokenResponse.json();

        // Criar CallObject Daily.co
        callObject = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: false
        });

        callObjectRef.current = callObject;

        // Setup event handlers
        setupDailyEventHandlers(callObject);

        // Entrar na sala
        await callObject.join({
          url: roomData.room.url,
          token: tokenData.token,
          userName: tokenData.userName
        });

        console.log(`✅ Conectado à sala ${roomData.room.name}`);
        
        setState(prev => ({
          ...prev,
          isConnected: true
        }));
      }

      // 2. Iniciar transcrição com configuração VÁLIDA (removendo parâmetros não suportados)
      console.log('🎤 Iniciando transcrição com diarização (configuração corrigida)...');
      const transcriptionConfig = {
        language: 'pt-BR',
        model: 'nova-2-general',
        profanity_filter: false, // Não filtrar em contexto business
        diarize: true, // ATIVADO: Identifica diferentes speakers
        punctuate: true, // Pontuação automática melhora legibilidade
        endpointing: 100, // CRÍTICO: Reduz latência de 300ms para 100ms
        extra: {
          endpointing: 100,
          interim_results: true,
          punctuate: true,
          utterance_end_ms: 1000,
          diarize: true
          // Removidos parâmetros não suportados: tier, multichannel, speaker_labels, detect_language, filler_words
        }
      };
      
      await callObject.startTranscription(transcriptionConfig);

      // 3. Configurar compartilhamento de tela se solicitado
      if (config?.enableScreenAudio) {
        try {
          console.log('🖥️ Iniciando compartilhamento de tela...');
          callObject.startScreenShare({
            audio: true // Capturar áudio da tela
          });
          setState(prev => ({ ...prev, isScreenAudioCaptured: true }));
          console.log('✅ Compartilhamento de tela ativo');
        } catch (screenError) {
          console.warn('⚠️ Compartilhamento de tela não disponível:', screenError);
        }
      }

      // 4. Configurar estado inicial do microfone (desligado conforme planejamento)
      if (callObject) {
        console.log('🎤 Configurando microfone inicial como DESLIGADO...');
        callObject.setLocalAudio(false); // Desligar microfone no início
      }

      startTimeRef.current = new Date();
      setState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false,
        transcript: '',
        interimTranscript: '',
        segments: [],
        wordsTranscribed: 0,
        sessionDuration: 0,
        // Garantir que estado inicial do microfone está correto
        isMicrophoneEnabled: false // Confirma estado inicial
      }));

      console.log('✅ Transcrição Daily.co iniciada com sucesso');

    } catch (error) {
      console.error('❌ Erro ao iniciar Daily.co:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao iniciar transcrição',
        isListening: false,
        isProcessing: false,
        isConnected: false
      }));
    }
  }, [user, isUserLoaded, state.isConnected, config, requestPermissions, setupDailyEventHandlers]);

  // Função para parar transcrição (compatível com Deepgram)
  const stopListening = useCallback(async () => {
    try {
      if (callObjectRef.current) {
        // Parar transcrição
        await callObjectRef.current.stopTranscription();
        
        // Parar compartilhamento de tela se ativo
        if (state.isScreenAudioCaptured) {
          callObjectRef.current.stopScreenShare();
        }
        
        // Sair da sala
        await callObjectRef.current.leave();
        
        // Destruir call object
        callObjectRef.current.destroy();
        callObjectRef.current = null;
      }

      // Limpar intervalos
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        isConnected: false,
        isProcessing: false,
        connectionQuality: 'disconnected',
        audioLevel: 0,
        isScreenAudioCaptured: false
      }));

      console.log('✅ Transcrição Daily.co parada');

    } catch (error) {
      console.error('❌ Erro ao parar Daily.co:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao parar transcrição'
      }));
    }
  }, [state.isScreenAudioCaptured]);

  // Pausar/retomar (compatível com Deepgram)
  const pauseListening = useCallback(async () => {
    // Daily.co não tem pausa nativa, simular pausando o processamento
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeListening = useCallback(async () => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // Força finalização (compatível com Deepgram)
  const forceFinalize = useCallback(async () => {
    if (callObjectRef.current && state.interimTranscript) {
      // Adicionar interim como final
      setState(prev => ({
        ...prev,
        transcript: prev.transcript + (prev.transcript ? ' ' : '') + prev.interimTranscript,
        interimTranscript: '',
        wordsTranscribed: (prev.transcript + ' ' + prev.interimTranscript).split(' ').length
      }));
    }
  }, [state.interimTranscript]);

  // Limpar estados (compatível com Deepgram)
  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      segments: [],
      wordsTranscribed: 0
    }));
  }, []);


  // NOVO: Função de limpeza de histórico (preserva texto intermediário)
  const clearTranscriptionHistory = useCallback(() => {
    console.log('🧹 Limpando blocos finalizados. Texto intermediário será preservado.');
    setState(prevState => ({
      ...prevState,
      blocks: [], // Ação principal: esvazia APENAS a lista de blocos.
      // O estado 'interimTranscript' e todos os outros são intencionalmente preservados.
    }));
  }, []);

  // FASE 2: Funções de Controle de Áudio Independentes
  
  // Função para o microfone do usuário
  const toggleMicrophone = useCallback(() => {
    const nextState = !state.isMicrophoneEnabled;
    callObjectRef.current?.setLocalAudio(nextState);
    setState(prev => ({ ...prev, isMicrophoneEnabled: nextState }));
    console.log(`🎤 Microfone foi ${nextState ? 'LIGADO' : 'DESLIGADO'}`);
  }, [state.isMicrophoneEnabled]);

  // Função para o áudio da tela
  const toggleScreenAudio = useCallback(() => {
    const nextState = !state.isScreenAudioEnabled;
    
    if (callObjectRef.current) {
      try {
        const participants = callObjectRef.current.participants();
        const localParticipant = participants?.local;
        const screenAudioTrack = localParticipant?.tracks?.screenAudio;
        
        if (nextState) {
          // Ligar áudio da tela
          if (!state.isScreenAudioCaptured) {
            // Se screen share não existe, iniciar com áudio
            console.log('🖥️ Iniciando compartilhamento de tela com áudio...');
            callObjectRef.current.startScreenShare({ audio: true });
            setState(prev => ({ 
              ...prev, 
              isScreenAudioEnabled: true,
              isScreenAudioCaptured: true 
            }));
          } else if (screenAudioTrack?.track) {
            // Se screen share existe mas áudio está mutado, desmute
            console.log('🖥️ Habilitando áudio da tela existente...');
            screenAudioTrack.track.enabled = true;
            setState(prev => ({ ...prev, isScreenAudioEnabled: true }));
          } else {
            // Reiniciar screen share com áudio
            console.log('🖥️ Reiniciando screen share com áudio...');
            callObjectRef.current.stopScreenShare();
            setTimeout(() => {
              callObjectRef.current?.startScreenShare({ audio: true });
            }, 100);
            setState(prev => ({ 
              ...prev, 
              isScreenAudioEnabled: true,
              isScreenAudioCaptured: true 
            }));
          }
        } else {
          // Desligar apenas o áudio da tela
          if (screenAudioTrack?.track) {
            console.log('🖥️ Desabilitando áudio da tela (mantendo vídeo)...');
            screenAudioTrack.track.enabled = false;
            setState(prev => ({ ...prev, isScreenAudioEnabled: false }));
          } else {
            console.log('🖥️ Reiniciando screen share sem áudio...');
            // Se não conseguir controlar o track diretamente, reiniciar sem áudio
            callObjectRef.current.stopScreenShare();
            setTimeout(() => {
              callObjectRef.current?.startScreenShare({ audio: false });
            }, 100);
            setState(prev => ({ 
              ...prev, 
              isScreenAudioEnabled: false,
              isScreenAudioCaptured: true // Mantém screen share ativo
            }));
          }
        }
      } catch (error) {
        console.error('❌ Erro ao controlar áudio da tela:', error);
        setState(prev => ({ ...prev, isScreenAudioEnabled: !nextState })); // Reverter estado
      }
    } else {
      setState(prev => ({ ...prev, isScreenAudioEnabled: nextState }));
    }
    
    console.log(`🖥️ Áudio da tela foi ${nextState ? 'LIGADO' : 'DESLIGADO'}`);
  }, [state.isScreenAudioEnabled, state.isScreenAudioCaptured]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        try {
          callObjectRef.current.destroy();
        } catch (error) {
          console.warn('⚠️ Erro ao destruir CallObject:', error);
        }
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      // Limpar cache de deduplicação
      processedMessagesRef.current.clear();
      processedInterimRef.current.clear();
    };
  }, []);

  // Atualizar dispositivos disponíveis no mount
  useEffect(() => {
    updateAvailableDevices();
    
    // Escutar mudanças de dispositivos - verificar disponibilidade
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', updateAvailableDevices);
      
      return () => {
        if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
          navigator.mediaDevices.removeEventListener('devicechange', updateAvailableDevices);
        }
      };
    }
  }, [updateAvailableDevices]);



  // Retorno compatível com useDeepgramTranscription + DUAL STREAM enhancements
  return {
    ...state,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    forceFinalize,
    clearTranscript,
    // Funções adicionais específicas Daily
    updateAvailableDevices,
    // NOVO: Função de limpeza de histórico
    clearTranscriptionHistory,
    // FASE 2: Novos estados e funções de controle
    isMicrophoneEnabled: state.isMicrophoneEnabled,
    isScreenAudioEnabled: state.isScreenAudioEnabled,
    toggleMicrophone,
    toggleScreenAudio
  };
}; 