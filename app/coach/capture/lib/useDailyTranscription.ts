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

// Interface para callback de mirror events
export interface MirrorCallbacks {
  onTrackAvailable?: () => void;
  onTrackUnavailable?: () => void;
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

export const useDailyTranscription = (config?: DailyTranscriptionConfig & { mirrorCallbacks?: MirrorCallbacks }) => {
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
    // CORREÇÃO: Tentar ambos os formatos de campo (trackType e track_type)
    const trackTypeValue = data.trackType || data.track_type;
    const speakerIdValue = data.speaker || data.speaker_id;
    
    console.log('🔬 Análise otimizada (FASE 1 - CORRIGIDA):', {
      trackType: trackTypeValue,
      speakerId: speakerIdValue,
      availableFields: Object.keys(data),
      rawTrackType: data.trackType,
      rawTrack_type: data.track_type
    });

    // 🥇 CAMADA 1: trackType (PRIORIDADE MÁXIMA - CORRIGIDA)
    if (trackTypeValue) {
      const sourceMap = {
        'screen-audio': { audioSource: 'screen' as const, trackType: 'screenAudio' as const },
        'cam-audio': { audioSource: 'microphone' as const, trackType: 'audio' as const },
        'screenAudio': { audioSource: 'screen' as const, trackType: 'screenAudio' as const },
        'audio': { audioSource: 'microphone' as const, trackType: 'audio' as const }
      };
      
      const mapping = sourceMap[trackTypeValue as keyof typeof sourceMap];
      if (mapping) {
        console.log('✅ Fonte detectada via trackType (CORRIGIDA):', {
          campo: trackTypeValue,
          resultado: mapping,
          confianca: '95%'
        });
        return { ...mapping, confidence: 0.95 };
      }
      
      // Fallback para valores desconhecidos mas que contenham informação útil
      console.log('⚠️ trackType desconhecido:', trackTypeValue);
    }

    // 🥈 CAMADA 2: speaker_id (OFICIAL - BACKUP)
    if (speakerIdValue) {
      console.log('🎭 Detectando fonte via speaker ID (BACKUP):', speakerIdValue);
      
      // Estratégia: speaker IDs diferentes = fontes diferentes
      // Speaker 0 ou primeiro = microfone, Speaker 1+ = tela
      const isFirstSpeaker = speakerIdValue === '0' || speakerIdValue === 0 || speakerIdValue === 'speaker_0';
      
      if (state.isScreenAudioCaptured && !isFirstSpeaker) {
        return {
          audioSource: 'screen',
          trackType: 'screenAudio',
          confidence: 0.85
        };
      }
    }

    // 🥉 CAMADA 3: tracks analysis (TÉCNICO - BACKUP)
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
          confidence: 0.80
        };
      }
    }

    // 🏅 CAMADA 4: content heuristics (Último RECURSO)
    if (state.isScreenAudioCaptured) {
      console.log('🔄 Usando heurísticas de conteúdo (Último recurso)');
      
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
      isListening: true,
      isProcessing: false, // CORREÇÃO: resetar isProcessing quando transcrição realmente inicia
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
    
    // FASE 2: Estratégia baseada nos logs (Mapeamento Otimizado)
    const getBlockColor = (audioSource: string, trackType: string) => {
      if (trackType === "screen-audio") return 'green';  // 🟢 Tela
      if (trackType === "cam-audio") return 'blue';      // 🔵 Microfone
      if (trackType === "screenAudio") return 'green';   // 🟢 Tela (formato alternativo)
      if (trackType === "audio") return 'blue';          // 🔵 Microfone (formato alternativo)
      if (audioSource === 'screen') return 'green';      // 🟢 Fallback tela
      if (audioSource === 'microphone') return 'blue';   // 🔵 Fallback mic
      return 'gray';                                      // ⚫ Desconhecido
    };
    
    const color = getBlockColor(audioSource, trackType) as 'green' | 'blue' | 'gray';
    

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
        // FASE 2: Lógica Otimizada de Separação de Blocos
        const lastBlock = prev.blocks[prev.blocks.length - 1];
        let updatedBlocks;
        
        // FASE 2: Funções auxiliares para separação inteligente
        const createNewBlock = (segment: any, blockId: string): TranscriptionBlock => ({
          id: blockId,
          text: segment.text,
          source: segment.audioSource,
          color: segment.color,
          startTime: segment.timestamp
        });
        
        const shouldCreateNewBlock = (lastBlock: any, newSegment: any) => {
          if (!lastBlock) return true;
          
          // ✅ PRINCIPAL: Nova fonte = novo bloco (OBRIGATÓRIO)
          if (lastBlock.source !== newSegment.audioSource) {
            console.log('🔄 CRITÉRIO ATINGIDO: Mudança de fonte:', lastBlock.source, '→', newSegment.audioSource);
            return true;
          }
          
          // ✅ SECUNDÁRIO: Limite de caracteres = novo bloco (EVITAR BLOCOS GIGANTES)
          if (lastBlock.text.length > 500) {
            console.log('📏 CRITÉRIO ATINGIDO: Limite de 500 caracteres:', lastBlock.text.length);
            return true;
          }
          
          // ❌ REMOVIDO: Pausa longa (estava criando blocos demais)
          // ❌ REMOVIDO: Novo speaker (muito sensível para mesmo usuário)
          
          console.log('✅ CONSOLIDANDO no bloco existente (mesma fonte):', lastBlock.source);
          return false;
        };
        
        // Aplicar lógica de separação otimizada
        const shouldCreate = shouldCreateNewBlock(lastBlock, {
          audioSource,
          speakerId: newSegment.speakerId,
          timestamp: newSegment.timestamp
        });
        
        if (shouldCreate) {
          // CONDIÇÃO ATINGIDA: Criar um NOVO bloco
          const newBlock = createNewBlock({
            audioSource,
            color,
            text: data.text,
            timestamp: new Date()
          }, `block-${Date.now()}`);
          updatedBlocks = [...prev.blocks, newBlock];
          
          // FASE 2: Logs simplificados
          if (!lastBlock) {
            console.log('🆕 Primeiro bloco criado:', newBlock.id);
          } else {
            console.log('🆕 Novo bloco criado (FASE 2):', {
              id: newBlock.id,
              fonte: newBlock.source,
              cor: newBlock.color,
              motivo: lastBlock.source !== audioSource ? 'mudança de fonte' : 'limite de caracteres'
            });
          }
        } else {
          // FASE 2: Consolidação inteligente no bloco existente
          const updatedBlock = {
            ...lastBlock,
            text: lastBlock.text + (lastBlock.text ? ' ' : '') + data.text
          };
          updatedBlocks = [...prev.blocks.slice(0, -1), updatedBlock];
          console.log('📝 Bloco consolidado (FASE 2):', {
            fonte: updatedBlock.source,
            tamanho: updatedBlock.text.length,
            cor: updatedBlock.color,
            palavras: updatedBlock.text.split(' ').length
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
      
      // Timeout de segurança para garantir que isProcessing não fique travado
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Timeout na conexão Daily.co - resetando isProcessing');
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: 'Timeout na conexão - tente novamente' 
        }));
      }, 30000); // 30 segundos timeout

      // Verificar se usuário está carregado e logado
      if (!isUserLoaded || !user) {
        console.log('⏳ Aguardando dados do usuário...');
        clearTimeout(timeoutId);
        setState(prev => ({ ...prev, error: 'Aguardando autenticação do usuário', isProcessing: false }));
        return;
      }

      // Verificar permissões de microfone
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        clearTimeout(timeoutId);
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
          clearTimeout(timeoutId);
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
      
      try {
        await callObject.startTranscription(transcriptionConfig);
        console.log('✅ Transcrição Daily.co iniciada com configuração válida');
      } catch (transcriptionError) {
        console.warn('⚠️ Erro ao iniciar transcrição, tentando configuração simplificada...', transcriptionError);
        // Fallback para configuração mais simples
        try {
          await callObject.startTranscription({
            language: 'pt-BR',
            model: 'nova-2-general'
          });
          console.log('✅ Transcrição Daily.co iniciada com configuração simplificada');
        } catch (fallbackError) {
          console.error('❌ Erro ao iniciar transcrição mesmo com configuração simplificada:', fallbackError);
          throw new Error('Falha ao iniciar transcrição Daily.co');
        }
      }

      // 3. Configurar compartilhamento de tela se solicitado
      if (config?.enableScreenAudio) {
        try {
          console.log('🖥️ Solicitando compartilhamento de tela...');
          callObject.startScreenShare({
            audio: true // Capturar áudio da tela
          });
          // CORREÇÃO: Estado só será atualizado quando evento 'track-started' confirmar
          console.log('🔄 Aguardando seleção do usuário para compartilhamento...');
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
      
      // Limpar timeout de segurança - conexão bem-sucedida
      clearTimeout(timeoutId);
      
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
      
      // Limpar timeout de segurança - erro capturado
      clearTimeout(timeoutId);
      
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
    // CORREÇÃO: Esta função agora apenas controla o áudio quando a tela já está sendo compartilhada
    if (!state.isScreenAudioCaptured) {
      console.log('ℹ️ Nenhuma tela está sendo compartilhada. Use o botão COMPARTILHAR primeiro.');
      return;
    }

    const nextState = !state.isScreenAudioEnabled;
    
    if (callObjectRef.current) {
      try {
        const participants = callObjectRef.current.participants();
        const localParticipant = participants?.local;
        const screenAudioTrack = localParticipant?.tracks?.screenAudio;
        
        if (nextState) {
          // Ligar áudio da tela existente
          if (screenAudioTrack?.track) {
            console.log('🔊 Habilitando áudio da tela...');
            screenAudioTrack.track.enabled = true;
            setState(prev => ({ ...prev, isScreenAudioEnabled: true }));
          } else {
            // Reiniciar screen share com áudio
            console.log('🔊 Reiniciando compartilhamento com áudio...');
            callObjectRef.current.stopScreenShare();
            setTimeout(() => {
              callObjectRef.current?.startScreenShare({ audio: true });
            }, 100);
            // CORREÇÃO: Estado será atualizado pelos eventos track-started/stopped
            console.log('🔄 Aguardando confirmação do restart...');
          }
        } else {
          // Desligar apenas o áudio da tela
          if (screenAudioTrack?.track) {
            console.log('🔇 Desabilitando áudio da tela (mantendo vídeo)...');
            screenAudioTrack.track.enabled = false;
            setState(prev => ({ ...prev, isScreenAudioEnabled: false }));
          } else {
            console.log('🔇 Reiniciando compartilhamento sem áudio...');
            callObjectRef.current.stopScreenShare();
            setTimeout(() => {
              callObjectRef.current?.startScreenShare({ audio: false });
            }, 100);
            // CORREÇÃO: Estado será atualizado pelos eventos track-started/stopped
            setState(prev => ({ 
              ...prev, 
              isScreenAudioEnabled: false
              // isScreenAudioCaptured será gerenciado pelos eventos
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
    
    console.log(`🔊 Áudio da tela foi ${nextState ? 'LIGADO' : 'DESLIGADO'}`);
  }, [state.isScreenAudioEnabled, state.isScreenAudioCaptured]);

  // NOVA: Função dedicada para controlar compartilhamento de tela
  const toggleScreenShare = useCallback(() => {
    if (!callObjectRef.current) {
      console.log('⚠️ Não conectado à sala Daily.co');
      return;
    }

    const isCurrentlySharing = state.isScreenAudioCaptured;
    
    if (isCurrentlySharing) {
      // Parar compartilhamento - pode ser imediato pois sempre funciona
      console.log('🛑 Parando compartilhamento de tela...');
      try {
        callObjectRef.current.stopScreenShare();
        // Estado será atualizado pelo evento 'track-stopped'
        console.log('🔄 Aguardando confirmação de parada...');
      } catch (error) {
        console.error('❌ Erro ao parar compartilhamento:', error);
      }
    } else {
      // Iniciar compartilhamento - NÃO mudar estado aqui, aguardar evento 'track-started'
      console.log('🖥️ Solicitando compartilhamento de tela...');
      try {
        callObjectRef.current.startScreenShare({ 
          audio: true // Iniciar com áudio habilitado por padrão
        });
        console.log('🔄 Aguardando seleção do usuário...');
        // IMPORTANTE: Estado só será atualizado quando o evento 'track-started' confirmar
      } catch (error) {
        console.error('❌ Erro ao solicitar compartilhamento:', error);
      }
    }
  }, [state.isScreenAudioCaptured]);

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

  // Função para acessar o screen video track (ISOLADA - não afeta transcrição)
  const getScreenVideoTrack = useCallback(() => {
    if (!callObjectRef.current) {
      console.warn('🚫 Mirror: CallObject não disponível');
      return null;
    }
    
    try {
      const participants = callObjectRef.current.participants();
      const localParticipant = participants?.local;
      
      // ✅ VALIDAÇÃO: Verificar se screen share está ativo
      if (!localParticipant?.tracks?.screenVideo) {
        console.warn('🚫 Mirror: Screen video track não encontrado');
        return null;
      }
      
      const screenVideoTrack = localParticipant.tracks.screenVideo;
      
      // ✅ SEGURANÇA: Verificar se o track está disponível e ativo
      // Aceitar estados "sendable" ou "playable" - ambos indicam que o track está funcional
      if (!screenVideoTrack.track || (screenVideoTrack.state !== 'sendable' && screenVideoTrack.state !== 'playable')) {
        console.warn('🚫 Mirror: Screen video track não está ativo:', screenVideoTrack.state);
        return null;
      }
      
      console.log('✅ Mirror: Screen video track encontrado:', {
        kind: screenVideoTrack.track.kind,
        enabled: screenVideoTrack.track.enabled,
        readyState: screenVideoTrack.track.readyState,
        state: screenVideoTrack.state
      });
      
      // ✅ GARANTIA: Retorna APENAS o track de vídeo da tela compartilhada
      return screenVideoTrack.track;
      
    } catch (error) {
      console.error('❌ Mirror: Erro ao acessar screen video track:', error);
      return null;
    }
  }, []);

  // Função para criar elemento de vídeo mirror com dimensões responsivas
  const createScreenMirror = useCallback((videoTrack: MediaStreamTrack) => {
    // Detectar tamanho da tela para responsividade
    const screenWidth = window.innerWidth;
    let mirrorWidth, mirrorHeight;
    
    if (screenWidth > 1200) {
      mirrorWidth = 400;
      mirrorHeight = 225;
    } else if (screenWidth > 768) {
      mirrorWidth = 320;
      mirrorHeight = 180;
    } else {
      mirrorWidth = 280;
      mirrorHeight = 158;
    }
    
    // Criar elemento de vídeo
    const videoElement = document.createElement('video');
    videoElement.id = 'screen-mirror-video';
    videoElement.srcObject = new MediaStream([videoTrack]);
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    
    // Aplicar estilos responsivos
    videoElement.style.cssText = `
      width: 100%;
      height: auto;
      max-width: ${mirrorWidth}px;
      max-height: ${mirrorHeight}px;
      border-radius: 8px;
      background-color: var(--eerie-black, #171818);
      object-fit: contain;
      transition: all 0.3s ease;
    `;
    
    console.log('✅ Mirror: Elemento de vídeo criado:', { width: mirrorWidth, height: mirrorHeight });
    return videoElement;
  }, []);

  // Função para gerenciar mirror (isolada das outras funcionalidades)
  const manageScreenMirror = useCallback(() => {
    const videoTrack = getScreenVideoTrack();
    
    if (videoTrack && state.isScreenAudioCaptured) {
      console.log('🎥 Mirror: Criando mirror com track disponível');
      const mirrorElement = createScreenMirror(videoTrack);
      return mirrorElement;
    } else {
      console.log('🚫 Mirror: Condições não atendidas para criar mirror');
      return null;
    }
  }, [getScreenVideoTrack, createScreenMirror, state.isScreenAudioCaptured]);

  // ⚠️ CRÍTICO: Listener isolado para mirror (não interfere com transcrição)
  useEffect(() => {
    if (!callObjectRef.current) return;
    
    const handleTrackStarted = (event: any) => {
      // ✅ FILTRO ESPECÍFICO: Apenas screenVideo tracks locais
      if (event.track?.kind === 'video' && 
          event.participant?.local) {
        console.log('🖥️ Mirror: Screen video track iniciado:', event);
        
        // ✅ ATUALIZAR ESTADO: Compartilhamento realmente confirmado
        setState(prev => ({ 
          ...prev, 
          isScreenAudioCaptured: true,
          isScreenAudioEnabled: true 
        }));
        console.log('✅ Compartilhamento de tela confirmado!');
        
        // Notificar componente que track está disponível (via callback personalizado)
        if (config?.mirrorCallbacks?.onTrackAvailable) {
          setTimeout(() => {
            config.mirrorCallbacks?.onTrackAvailable?.();
          }, 500); // Pequeno delay para garantir que o track esteja realmente pronto
        }
      }
    };
    
    const handleTrackStopped = (event: any) => {
      // ✅ FILTRO ESPECÍFICO: Apenas screenVideo tracks locais
      if (event.track?.kind === 'video' && 
          event.participant?.local) {
        console.log('🖥️ Mirror: Screen video track parou:', event);
        
        // ✅ ATUALIZAR ESTADO: Compartilhamento realmente parado
        setState(prev => ({ 
          ...prev, 
          isScreenAudioCaptured: false,
          isScreenAudioEnabled: false 
        }));
        console.log('✅ Compartilhamento de tela parado!');
        
        // Notificar componente que track não está mais disponível
        if (config?.mirrorCallbacks?.onTrackUnavailable) {
          config.mirrorCallbacks.onTrackUnavailable();
        }
      }
    };
    
    // ✅ NAMESPACE ISOLADO: Usar namespace específico para evitar conflitos
    const mirrorEventHandlers = {
      'track-started': handleTrackStarted,
      'track-stopped': handleTrackStopped
    };
    
    // Adicionar listeners
    Object.entries(mirrorEventHandlers).forEach(([event, handler]) => {
      callObjectRef.current?.on(event as any, handler);
    });
    
    return () => {
      // Cleanup isolado
      if (callObjectRef.current) {
        Object.entries(mirrorEventHandlers).forEach(([event, handler]) => {
          callObjectRef.current?.off(event as any, handler);
        });
      }
    };
  }, [config?.mirrorCallbacks]); // Adicionar dependência dos callbacks

  // ✅ FALLBACK: Verificação periódica para garantir sincronização
  useEffect(() => {
    if (!state.isScreenAudioCaptured) return;
    
    const checkInterval = setInterval(() => {
      const videoTrack = getScreenVideoTrack();
      console.log('🔄 Mirror: Verificação periódica - track disponível:', !!videoTrack);
    }, 5000); // Verificar a cada 5 segundos
    
    return () => clearInterval(checkInterval);
  }, [state.isScreenAudioCaptured, getScreenVideoTrack]);

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
    toggleScreenAudio,
    toggleScreenShare, // NOVA: Controle dedicado de compartilhamento
    // NOVAS funções para mirror
    getScreenVideoTrack,
    createScreenMirror,
    manageScreenMirror
  };
}; 