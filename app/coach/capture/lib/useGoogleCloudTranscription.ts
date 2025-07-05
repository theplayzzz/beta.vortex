"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TranscriptionState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isConnected: boolean;
  error: string | null;
  confidence: number;
  micLevel: number;
  screenLevel: number;
}

export const useGoogleCloudTranscription = () => {
  const [state, setState] = useState<TranscriptionState>({
    transcript: "",
    interimTranscript: "",
    isListening: false,
    isConnected: false,
    error: null,
    confidence: 0,
    micLevel: 0,
    screenLevel: 0,
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
  const animationFrameRef = useRef<number | null>(null);

  // Conectar ao servidor WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      // 🔧 CORREÇÃO: Detectar automaticamente protocolo e host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const wsUrl = `${protocol}//${host}:8080`;
      
      console.log('🔗 Conectando ao WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
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
              setState(prev => ({ 
                ...prev, 
                error: data.message,
                isListening: false 
              }));
              break;
              
            case 'connected':
              console.log('✅ Servidor confirmou conexão');
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
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isListening: false 
        }));
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
      const micLevel = calculateAudioLevel(micAnalyserRef.current);
      const screenLevel = calculateAudioLevel(screenAnalyserRef.current);
      
      setState(prev => ({ ...prev, micLevel, screenLevel }));
    }
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [calculateAudioLevel]);

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

      // Criar analisadores para monitoramento
      const micAnalyser = audioContext.createAnalyser();
      const screenAnalyser = audioContext.createAnalyser();
      micAnalyser.fftSize = 2048;
      screenAnalyser.fftSize = 2048;

      micAnalyserRef.current = micAnalyser;
      screenAnalyserRef.current = screenAnalyser;

      // Conectar e processar áudio
      micSource.connect(micAnalyser);
      screenSource.connect(screenAnalyser);
      micSource.connect(destination);
      screenSource.connect(destination);

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
      return true;
    } catch (error) {
      console.error('❌ Erro ao configurar captura de áudio:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao acessar microfone ou tela' 
      }));
      return false;
    }
  }, [updateAudioLevels]);

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
      
      setState(prev => ({ ...prev, isListening: true }));
      console.log('🚀 Transcrição iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar transcrição:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao iniciar transcrição',
        isListening: false 
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
    isConnected: state.isConnected,
    error: state.error,
    confidence: state.confidence,
    micLevel: state.micLevel,
    screenLevel: state.screenLevel,
    startListening,
    stopListening,
    clearTranscript,
    connectWebSocket,
  };
}; 