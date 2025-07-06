"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TranscriptionState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean; // Estado técnico: stream ativo no servidor
  userIsTranscribing: boolean; // Estado de UI: usuário iniciou transcrição
  isConnected: boolean;
  error: string | null;
  confidence: number;
  micLevel: number;
  screenLevel: number;
  isMicrophoneEnabled: boolean;
  isForceFinalizingActive: boolean; // Flag para controlar force-finalize
}

export const useGoogleCloudTranscription = () => {
  const [state, setState] = useState<TranscriptionState>({
    transcript: "",
    interimTranscript: "",
    isListening: false,
    userIsTranscribing: false,
    isConnected: false,
    error: null,
    confidence: 0,
    micLevel: 0,
    screenLevel: 0,
    isMicrophoneEnabled: false,
    isForceFinalizingActive: false,
  });

  // Referências para recursos de áudio
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const screenAnalyserRef = useRef<AnalyserNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Conectar ao servidor WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('🔗 Conectado ao servidor Speech-to-Text');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'transcript':
              setState(prev => ({
                ...prev,
                interimTranscript: data.isFinal ? '' : data.transcript,
                transcript: data.isFinal 
                  ? prev.transcript + ' ' + data.transcript 
                  : prev.transcript,
                confidence: data.confidence || 0,
              }));
              break;
              
            case 'interim':
              console.log('📝 Transcrição interim:', data.transcript);
              setState(prev => ({
                ...prev,
                interimTranscript: data.transcript,
                confidence: data.confidence || 0,
              }));
              break;
              
            case 'final':
              console.log('✅ Transcrição final:', data.transcript);
              setState(prev => ({
                ...prev,
                transcript: prev.transcript + ' ' + data.transcript,
                interimTranscript: '',
                confidence: data.confidence || 0,
              }));
              break;
              
            case 'started':
              console.log('▶️ Transcrição confirmada pelo servidor');
              break;
              
            case 'stopped':
              console.log('⏹️ Transcrição parada pelo servidor');
              break;
              
            case 'error':
              console.log('❌ Erro recebido do servidor:', data.message);
              console.log('🔍 Verificando se é durante force-finalize...');
              setState(prev => ({ 
                ...prev, 
                error: data.message,
                // NÃO modificar isListening se estivermos em force-finalize
                isListening: prev.isForceFinalizingActive ? prev.isListening : false 
              }));
              break;
              
            case 'connected':
              console.log('✅ Servidor confirmou conexão');
              break;

            case 'force-finalize-started':
              console.log('🧠 Finalização forçada iniciada pelo servidor');
              console.log('🔍 Estado atual isListening:', state.isListening);
              break;

            case 'force-finalize-completed':
              console.log('✅ Finalização forçada concluída, stream reiniciado');
              console.log('🔍 Estado atual isListening:', state.isListening);
              // Limpar flag de force-finalize
              setState(prev => ({ ...prev, isForceFinalizingActive: false }));
              // Resolver Promise pendente se existir
              if (forceFinalizePendingRef.current) {
                clearTimeout(forceFinalizePendingRef.current.timeout);
                forceFinalizePendingRef.current.resolve(true);
                forceFinalizePendingRef.current = null;
              }
              break;

            case 'force-finalize-error':
              console.warn('⚠️ Erro na finalização forçada:', data.message);
              console.log('🔍 Estado atual isListening:', state.isListening);
              // Limpar flag de force-finalize
              setState(prev => ({ ...prev, isForceFinalizingActive: false }));
              // Rejeitar Promise pendente se existir
              if (forceFinalizePendingRef.current) {
                clearTimeout(forceFinalizePendingRef.current.timeout);
                forceFinalizePendingRef.current.reject(new Error(data.message || 'Erro na finalização forçada'));
                forceFinalizePendingRef.current = null;
              }
              break;
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erro WebSocket:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Erro na conexão WebSocket',
          isConnected: false 
        }));
      };

      ws.onclose = () => {
        console.log('🔌 Conexão WebSocket fechada');
        console.log('🔍 Verificando se é durante force-finalize...');
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          // NÃO modificar isListening se estivermos em force-finalize
          isListening: prev.isForceFinalizingActive ? prev.isListening : false 
        }));
        
        // Limpar Promise de finalização pendente se existir
        if (forceFinalizePendingRef.current) {
          clearTimeout(forceFinalizePendingRef.current.timeout);
          forceFinalizePendingRef.current.reject(new Error('Conexão WebSocket fechada'));
          forceFinalizePendingRef.current = null;
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Falha ao conectar ao servidor' 
      }));
    }
  }, []);

  // Função para toggle do microfone
  const toggleMicrophoneCapture = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, isMicrophoneEnabled: enabled }));
    
    // Controlar o gain do microfone
    if (micGainRef.current) {
      micGainRef.current.gain.value = enabled ? 1 : 0;
      console.log(`🎙️ Microfone ${enabled ? 'HABILITADO' : 'DESABILITADO'}`);
    }
  }, []);

  // Função para calcular nível de áudio
  const calculateAudioLevel = useCallback((analyser: AnalyserNode): number => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    return (sum / dataArray.length) / 255;
  }, []);

  // Atualizar níveis de áudio em tempo real
  const updateAudioLevels = useCallback(() => {
    if (micAnalyserRef.current && screenAnalyserRef.current) {
      const micLevel = state.isMicrophoneEnabled ? calculateAudioLevel(micAnalyserRef.current) : 0;
      const screenLevel = calculateAudioLevel(screenAnalyserRef.current);
      
      setState(prev => ({ ...prev, micLevel, screenLevel }));
    }
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [calculateAudioLevel, state.isMicrophoneEnabled]);

  // Configurar captura de áudio
  const setupAudioCapture = useCallback(async () => {
    try {
      // Capturar microfone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      // Capturar tela com áudio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 16000,
        }
      });

      micStreamRef.current = micStream;
      screenStreamRef.current = screenStream;

      // Criar contexto de áudio
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Criar nós de áudio
      const micSource = audioContext.createMediaStreamSource(micStream);
      const screenSource = audioContext.createMediaStreamSource(screenStream);
      const destination = audioContext.createMediaStreamDestination();

      // Criar gain node para controlar o microfone
      const micGain = audioContext.createGain();
      micGain.gain.value = state.isMicrophoneEnabled ? 1 : 0; // Iniciar conforme estado
      micGainRef.current = micGain;

      // Criar analisadores para monitoramento
      const micAnalyser = audioContext.createAnalyser();
      const screenAnalyser = audioContext.createAnalyser();
      micAnalyser.fftSize = 2048;
      screenAnalyser.fftSize = 2048;

      micAnalyserRef.current = micAnalyser;
      screenAnalyserRef.current = screenAnalyser;

      // Conectar e processar áudio com controle do microfone
      micSource.connect(micAnalyser);
      micSource.connect(micGain); // Microfone passa pelo gain
      micGain.connect(destination); // Gain controlado vai para o destino
      
      screenSource.connect(screenAnalyser);
      screenSource.connect(destination); // Tela vai direto para o destino

      combinedStreamRef.current = destination.stream;

      // Criar processador para enviar áudio ao servidor
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Conectar o stream combinado ao processador
      const combinedSource = audioContext.createMediaStreamSource(destination.stream);
      combinedSource.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Converter para 16-bit PCM
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
          }
          
          // Enviar áudio como base64
          const uint8Array = new Uint8Array(pcm16.buffer);
          const audioBase64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            audio: audioBase64
          }));
        }
      };

      // Iniciar monitoramento de níveis
      updateAudioLevels();

      console.log('🎙️ Captura de áudio configurada com sucesso');
      console.log(`🎙️ Microfone ${state.isMicrophoneEnabled ? 'HABILITADO' : 'DESABILITADO'}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao configurar captura de áudio:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao acessar microfone ou tela' 
      }));
      return false;
    }
  }, [updateAudioLevels, state.isMicrophoneEnabled]);

  // Iniciar transcrição
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState(prev => ({ 
        ...prev, 
        error: 'Servidor não conectado' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      
      const audioSetupSuccess = await setupAudioCapture();
      if (!audioSetupSuccess) return;

      // Iniciar transcrição no servidor
      wsRef.current.send(JSON.stringify({ type: 'start' }));
      
      setState(prev => ({ 
        ...prev, 
        isListening: true,
        userIsTranscribing: true // UI sempre mostra que está transcrevendo
      }));
      console.log('🚀 Transcrição iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar transcrição:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao iniciar transcrição',
        isListening: false,
        userIsTranscribing: false 
      }));
    }
  }, [setupAudioCapture]);

  // Parar transcrição
  const stopListening = useCallback(() => {
    try {
      // Parar transcrição no servidor
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
      }

      // Parar animação
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Limpar recursos de áudio
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (micGainRef.current) {
        micGainRef.current.disconnect();
        micGainRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      setState(prev => ({ 
        ...prev, 
        isListening: false,
        userIsTranscribing: false, // Usuário parou a transcrição
        micLevel: 0,
        screenLevel: 0 
      }));
      
      console.log('⏹️ Transcrição parada');
    } catch (error) {
      console.error('❌ Erro ao parar transcrição:', error);
    }
  }, []);

  // Limpar transcrição
  const clearTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      interimTranscript: '' 
    }));
  }, []);

  // Ref para Promise de finalização forçada
  const forceFinalizePendingRef = useRef<{
    resolve: (value: boolean) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  } | null>(null);

  // Forçar finalização de transcrições interim para análise
  const forceFinalize = useCallback(() => {
    console.log('🔍 forceFinalize chamado - verificando condições...');
    console.log('🔍 Estado atual userIsTranscribing:', state.userIsTranscribing);
    console.log('🔍 Estado atual isListening:', state.isListening);
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket não conectado para forçar finalização');
      return Promise.reject(new Error('WebSocket não conectado'));
    }
    
    if (!state.userIsTranscribing) {
      console.warn('⚠️ Transcrição não está ativa para forçar finalização');
      return Promise.reject(new Error('Transcrição não está ativa'));
    }

    console.log('🧠 Enviando comando force-finalize para servidor');
    console.log('📡 Estado WebSocket:', wsRef.current.readyState);
    console.log('🎙️ userIsTranscribing:', state.userIsTranscribing);
    console.log('🔍 isListening:', state.isListening);
    console.log('💡 Force-finalize funcionará mesmo se stream estiver em restart');
    
    // Marcar que força finalização está ativa
    setState(prev => ({ ...prev, isForceFinalizingActive: true }));
    
    return new Promise<boolean>((resolve, reject) => {
      // Limpar Promise anterior se existir
      if (forceFinalizePendingRef.current) {
        clearTimeout(forceFinalizePendingRef.current.timeout);
        forceFinalizePendingRef.current.reject(new Error('Nova finalização iniciada'));
      }
      
      // Configurar timeout
      const timeout = setTimeout(() => {
        forceFinalizePendingRef.current = null;
        // Limpar flag de force-finalize em caso de timeout
        setState(prev => ({ ...prev, isForceFinalizingActive: false }));
        reject(new Error('Timeout na finalização forçada'));
      }, 8000); // Aumentado para 8 segundos para aguardar evento 'end'
      
      // Armazenar Promise pendente
      forceFinalizePendingRef.current = { resolve, reject, timeout };
      
      // Enviar comando
      if (wsRef.current) {
        const comando = { 
          type: 'force-finalize',
          reason: 'user-analysis' 
        };
        console.log('📤 Enviando comando para servidor:', comando);
        wsRef.current.send(JSON.stringify(comando));
        console.log('✅ Comando enviado, aguardando resposta...');
      } else {
        clearTimeout(timeout);
        forceFinalizePendingRef.current = null;
        reject(new Error('WebSocket não está mais conectado'));
      }
    });
  }, [state.userIsTranscribing]);

  // Conectar ao WebSocket na inicialização
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Limpar recursos na desmontagem
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    transcript: state.transcript,
    interimTranscript: state.interimTranscript,
    isListening: state.isListening,
    userIsTranscribing: state.userIsTranscribing,
    isConnected: state.isConnected,
    error: state.error,
    confidence: state.confidence,
    micLevel: state.micLevel,
    screenLevel: state.screenLevel,
    isMicrophoneEnabled: state.isMicrophoneEnabled,
    startListening,
    stopListening,
    clearTranscript,
    connectWebSocket,
    toggleMicrophoneCapture,
    forceFinalize,
  };
}; 