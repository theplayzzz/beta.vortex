import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import DailyIframe, { 
  DailyCall, 
  DailyEvent
} from '@daily-co/daily-js';

// Interface compatível com Deepgram (mantendo mesma estrutura)
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
  }>;
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

  // Estados principais compatíveis com Deepgram
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
    segments: []
  });

  // Refs para Daily.co
  const callObjectRef = useRef<DailyCall | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handler otimizado para erro de transcrição
  const handleTranscriptionError = useCallback((event: any) => {
    console.error('❌ Erro de transcrição:', event);
    setState(prev => ({
      ...prev,
      error: `Erro de transcrição: ${event.errorMsg || 'Erro desconhecido'}`,
      isProcessing: false
    }));
  }, []);

  // Handler otimizado para mensagem de transcrição
  const handleTranscriptionMessage = useCallback((data: any) => {
    const startTime = performance.now();
    console.log('📝 Transcrição recebida:', data);
    
    const newSegment = {
      text: data.text,
      confidence: data.confidence || 0,
      timestamp: new Date(),
      isFinal: data.is_final || false
    };

    setState(prev => {
      const updatedSegments = [...prev.segments, newSegment];
      
      if (data.is_final) {
        // Texto final - adicionar ao transcript principal
        const finalText = prev.transcript + (prev.transcript ? ' ' : '') + data.text;
        
        return {
          ...prev,
          transcript: finalText,
          interimTranscript: '', // Limpar interim
          segments: updatedSegments,
          wordsTranscribed: finalText.split(' ').length,
          lastActivity: new Date(),
          confidence: data.confidence || 0
        };
      } else {
        // Resultado interim - apenas atualizar interimTranscript
        return {
          ...prev,
          interimTranscript: data.text,
          segments: updatedSegments,
          lastActivity: new Date(),
          confidence: data.confidence || 0
        };
      }
    });
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    console.log(`⚡ Tempo de processamento: ${processingTime.toFixed(2)}ms`);
  }, []);

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

    // Evento de erro
    callObject.on('error', (event) => {
      console.error('❌ Erro Daily.co:', event);
      setState(prev => ({
        ...prev,
        error: `Erro Daily.co: ${event.errorMsg || 'Erro desconhecido'}`,
        isListening: false,
        isConnected: false,
        connectionQuality: 'disconnected'
      }));
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

    // HANDLER BACKUP: app-message para redundância (compatibilidade)
    callObject.on('app-message', (event) => {
      // Filtro para mensagens de transcrição
      if (event.fromId !== 'transcription' || !event.data) return;
      
      console.log('📝 App-message (backup):', event.data);
      try {
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

      // 2. Iniciar transcrição com configuração otimizada
      console.log('🎤 Iniciando transcrição com configuração otimizada...');
      const transcriptionConfig = {
        language: 'pt-BR',
        model: 'nova-2',
        profanityFilter: false,
        endpointing: 100, // CRÍTICO: Reduz latência de 300ms para 100ms
        extra: {
          endpointing: 100,
          interim_results: true,
          punctuate: true,
          utterance_end_ms: 1000
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

      startTimeRef.current = new Date();
      setState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false,
        transcript: '',
        interimTranscript: '',
        segments: [],
        wordsTranscribed: 0,
        sessionDuration: 0
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



  // Retorno compatível com useDeepgramTranscription
  return {
    ...state,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    forceFinalize,
    clearTranscript,
    // Funções adicionais específicas Daily
    updateAvailableDevices
  };
}; 