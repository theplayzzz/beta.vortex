"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDailyTranscription } from '../lib/useDailyTranscription';
import { Mic, MicOff, MonitorSpeaker } from 'lucide-react';
import TutorialModal from './TutorialModal';

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

const DailyTranscriptionDisplay: React.FC = () => {
  // Hook Daily.co (compatível com interface Deepgram)
  const {
    transcript,
    interimTranscript,
    isListening,
    isConnected,
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
    clearTranscript,
    forceFinalize,
    pauseListening,
    resumeListening,
    isPaused,
    clearTranscriptionHistory, // NOVO: Função de limpeza de histórico
    // FASE 3: Novos estados e funções de controle
    isMicrophoneEnabled,
    isScreenAudioEnabled,
    toggleMicrophone,
    toggleScreenAudio
  } = useDailyTranscription({
    language: 'pt',
    enableScreenAudio: true,
    enableInterimResults: true
  });

  // Refs e estados para controle do scroll automático (mantidos idênticos)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [newFieldText, setNewFieldText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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

    const handleScrollStart = () => {
      setIsUserScrolling(true);
      clearTimeout(scrollTimer);
      
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
    };
  }, [handleScroll, isAtBottom]);

  // Função para ativar scroll automático
  const enableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(true);
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  // Função para envio ao webhook de análise (FASE 1: Adaptada do GoogleCloudTranscriptionDisplay)
  const sendToWebhook = async (contexto: string) => {
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_ANALYSIS_WEBHOOK_URL;
      if (!webhookUrl) {
        console.error('❌ URL do webhook de análise não configurada. Verifique a variável de ambiente NEXT_PUBLIC_ANALYSIS_WEBHOOK_URL.');
        throw new Error('Webhook URL not configured');
      }

      console.log('📡 Enviando contexto para webhook...');
      console.log('🔍 Source identificado como: daily-co-transcription');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contexto: contexto,
          timestamp: new Date().toISOString(),
          source: 'daily-co-transcription' // ✅ FASE 1: Campo source atualizado conforme solicitado
        })
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

  // FASE 2: Função handleAnalyze com nova lógica de consolidação de contexto
  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    let loadingId: string | null = null;
    
    try {
      // FASE 2: Coleta do Contexto Completo (crítica conforme planejamento)
      const finalBlocksText = blocks.map(block => block.text).join(' \n');
      const currentInterimText = interimTranscript; // Captura o texto intermediário atual

      // Junta os dois, garantindo um espaço se ambos existirem.
      const contextoCompleto = `${finalBlocksText} ${currentInterimText}`.trim();
      
      // FASE 2: Log de teste conforme solicitado no critério de teste
      console.log('Contexto para análise:', contextoCompleto);
      
      if (!contextoCompleto) {
        setNewFieldText('⚠️ Nenhum contexto disponível para análise');
        return;
      }
      
      console.log('📋 Contexto coletado:', contextoCompleto.length, 'caracteres');
      console.log('🔍 Blocos finalizados:', blocks.length);
      console.log('🔍 Texto interim atual:', currentInterimText ? currentInterimText.length + ' chars' : 'vazio');
      
      // Criar entrada de loading no histórico
      loadingId = createLoadingEntry(contextoCompleto);
      setNewFieldText('🌐 Enviando contexto para análise de IA...');
      
      // Enviar para webhook
      const resposta = await sendToWebhook(contextoCompleto);
      
      // Atualizar entrada no histórico com resultado
      if (loadingId) {
        updateLoadingEntry(loadingId, resposta);
      }
      
      setNewFieldText('');
      console.log('✅ Análise concluída, transcrição Daily.co continua ativa');
      
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      const errorMessage = `❌ Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      
      if (loadingId) {
        updateLoadingEntry(loadingId, errorMessage);
      } else {
        setNewFieldText(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* COLUNA ESQUERDA - Controles e Transcrição */}
          <div className="flex flex-col space-y-6">
            
            {/* PARTE SUPERIOR - Controles Reorganizados - TAMANHO FIXO */}
            <div 
              className="p-4 rounded-xl overflow-hidden"
              style={{ 
                backgroundColor: 'var(--eerie-black)', 
                border: '1px solid rgba(249, 251, 252, 0.1)',
                height: '196px',
                minHeight: '196px',
                maxHeight: '196px'
              }}
            >
              {/* Status de Conexão */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isConnected ? 'var(--sgbus-green)' : '#ef4444' }}
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--seasalt)' }}>
                    {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
                  </span>
                </div>
                
                <button 
                  className="px-2 py-1 rounded text-xs transition-all duration-200" 
                  style={{ backgroundColor: 'rgba(207, 198, 254, 0.2)', color: 'var(--periwinkle)' }}
                  onClick={() => setIsTutorialOpen(true)}
                >
                  TUTORIAL
                </button>
              </div>

              {/* Grid de Controles Reorganizado */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Controles Principais */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={false}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                      style={{
                        backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 233, 76, 0.2)',
                        color: isListening ? '#ef4444' : 'var(--sgbus-green)',
                        border: isListening ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(107, 233, 76, 0.3)'
                      }}
                    >
                      {isListening ? '⏹️ PARAR' : '🎙️ INICIAR'}
                    </button>
                    
                    <button
                      onClick={clearTranscriptionHistory}
                      disabled={blocks.length === 0}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'rgba(207, 198, 254, 0.2)',
                        color: 'var(--periwinkle)',
                        border: '1px solid rgba(207, 198, 254, 0.3)'
                      }}
                      title="Limpar histórico de transcrição"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* Substitua o botão antigo por esta estrutura */}
                  <div className="flex w-full gap-2">
                    {/* Botão do Microfone - Com ícones dinâmicos */}
                    <button 
                      onClick={toggleMicrophone}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      style={isMicrophoneEnabled ? 
                        { backgroundColor: 'rgba(74, 222, 128, 0.2)', color: 'rgb(34, 197, 94)', border: '1px solid rgba(74, 222, 128, 0.3)' } :
                        { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.3)' }
                      }
                    >
                      {isMicrophoneEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                      <span>{isMicrophoneEnabled ? 'MIC ON' : 'MIC OFF'}</span>
                    </button>

                    {/* Botão de Áudio da Tela - Com ícones dinâmicos */}
                    <button 
                      onClick={toggleScreenAudio}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      style={isScreenAudioEnabled ? 
                        { backgroundColor: 'rgba(74, 222, 128, 0.2)', color: 'rgb(34, 197, 94)', border: '1px solid rgba(74, 222, 128, 0.3)' } :
                        { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.3)' }
                      }
                    >
                      <MonitorSpeaker size={16} />
                      <span>{isScreenAudioEnabled ? 'TELA ON' : 'TELA OFF'}</span>
                    </button>
                  </div>
                </div>

                {/* Níveis de Áudio - Adaptado para Daily.co */}
                <div className="space-y-2">
                  <CompactAudioLevelBar level={audioLevel / 100} label="MIC" color="blue" />
                  <CompactAudioLevelBar 
                    level={isScreenAudioCaptured ? audioLevel / 100 : 0} 
                    label="TELA" 
                    color="green" 
                  />
                </div>
              </div>

              {/* Estatísticas Dual Stream Melhoradas */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-opacity-50 p-1.5 rounded" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)' }}>
                  <div className="text-xs font-mono" style={{ color: 'var(--sgbus-green)' }}>
                    {speakerStats.screenSegments}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sgbus-green)' }}>
                    TELA
                  </div>
                </div>
                <div className="bg-opacity-50 p-1.5 rounded" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)' }}>
                  <div className="text-xs font-mono" style={{ color: 'var(--periwinkle)' }}>
                    {speakerStats.microphoneSegments}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--periwinkle)' }}>
                    MIC
                  </div>
                </div>
                <div className="bg-opacity-50 p-1.5 rounded" style={{ backgroundColor: 'rgba(249, 251, 252, 0.05)' }}>
                  <div className="text-xs font-mono" style={{ color: 'var(--seasalt)' }}>
                    {speakerStats.totalSpeakers}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--periwinkle)' }}>
                    SPKRS
                  </div>
                </div>
                <div className="bg-opacity-50 p-1.5 rounded" style={{ backgroundColor: 'rgba(249, 251, 252, 0.05)' }}>
                  <div className="text-xs font-mono" style={{ color: 'var(--seasalt)' }}>
                    {Math.round(confidence * 100)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--periwinkle)' }}>
                    CONF
                  </div>
                </div>
              </div>
            </div>

            {/* ÁREA DE TRANSCRIÇÃO - EXPANSÍVEL */}
            <div className="flex-1 flex flex-col min-h-0">
              <div 
                className="flex-1 flex flex-col rounded-xl overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--eerie-black)', 
                  border: '1px solid rgba(249, 251, 252, 0.1)'
                }}
              >
                {/* Header da transcrição */}
                <div className="flex items-center justify-between p-4 border-b border-opacity-10" style={{ borderColor: 'var(--seasalt)' }}>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--seasalt)' }}>
                      TRANSCRIÇÃO DUAL STREAM
                    </h3>
                    {diarizationEnabled && (
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--sgbus-green)' }}></div>
                        <span className="text-xs" style={{ color: 'var(--sgbus-green)' }}>DIARIZAÇÃO</span>
                      </div>
                    )}
                    {trackInfo.audioTrackActive && (
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--periwinkle)' }}></div>
                        <span className="text-xs" style={{ color: 'var(--periwinkle)' }}>MIC</span>
                      </div>
                    )}
                    {trackInfo.screenAudioTrackActive && (
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--sgbus-green)' }}></div>
                        <span className="text-xs" style={{ color: 'var(--sgbus-green)' }}>TELA</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isAutoScrollEnabled && (
                      <button
                        onClick={enableAutoScroll}
                        className="px-2 py-1 rounded text-xs transition-all duration-200"
                        style={{ 
                          backgroundColor: 'rgba(207, 198, 254, 0.2)',
                          color: 'var(--periwinkle)'
                        }}
                      >
                        ⬇️ SCROLL
                      </button>
                    )}
                    
                    <button
                      onClick={forceFinalize}
                      disabled={!interimTranscript || !isListening}
                      className="px-2 py-1 rounded text-xs transition-all duration-200 disabled:opacity-50"
                      style={{ 
                        backgroundColor: 'rgba(107, 233, 76, 0.2)',
                        color: 'var(--sgbus-green)'
                      }}
                    >
                      ⚡ FINALIZAR
                    </button>
                  </div>
                </div>

                {/* Conteúdo da transcrição */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 p-4 overflow-y-auto"
                  style={{ 
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'thin'
                  }}
                >
                  {error && (
                    <div 
                      className="mb-4 p-3 rounded-lg"
                      style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <p className="text-sm" style={{ color: '#ef4444' }}>
                        ❌ Erro: {error}
                      </p>
                    </div>
                  )}

                  {/* FASE 5: Renderizar blocos com sistema de blocos incremental */}
                  {blocks.map((block, index) => (
                    <div 
                      key={`block-${block.id}`}
                      className="mb-3" 
                      style={{ 
                        backgroundColor: block.color === 'green' ? 'rgba(107, 233, 76, 0.1)' : 
                                        block.color === 'blue' ? 'rgba(207, 198, 254, 0.1)' : 
                                        'rgba(249, 251, 252, 0.05)',
                        padding: '12px',
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
                    <div className="text-center py-12">
                      <p className="text-lg mb-2" style={{ color: 'var(--periwinkle)' }}>
                        🎙️ Pressione &quot;INICIAR&quot; para começar a transcrição
                      </p>
                      <p className="text-sm opacity-70" style={{ color: 'var(--seasalt)' }}>
                        Sistema capturará áudio do microfone e da tela
                      </p>
                    </div>
                  )}

                  {isListening && !transcript && !interimTranscript && (
                    <div className="text-center py-12">
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

          {/* COLUNA DIREITA - Análise de IA e Histórico (mantida idêntica) */}
          <div className="flex flex-col space-y-6">
            
            {/* ANÁLISE DE IA - TAMANHO FIXO */}
            <div 
              className="p-4 rounded-xl overflow-hidden"
              style={{ 
                backgroundColor: 'var(--eerie-black)', 
                border: '1px solid rgba(249, 251, 252, 0.1)',
                height: '196px',
                minHeight: '196px',
                maxHeight: '196px'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: 'var(--seasalt)' }}>
                  ANÁLISE DE IA
                </h3>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (blocks.length === 0 && !interimTranscript.trim())}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: 'rgba(107, 233, 76, 0.2)',
                    color: 'var(--sgbus-green)',
                    border: '1px solid rgba(107, 233, 76, 0.3)'
                  }}
                >
                  {isAnalyzing ? 'ANALISANDO...' : '🧠 ANALISAR'}
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {newFieldText && (
                  <div className="p-3 rounded-lg h-full overflow-y-auto" style={{ backgroundColor: 'rgba(249, 251, 252, 0.05)' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--seasalt)' }}>
                      {newFieldText}
                    </p>
                  </div>
                )}

                {!newFieldText && (
                  <div className="text-center py-8">
                    <p className="text-sm opacity-70" style={{ color: 'var(--seasalt)' }}>
                      Clique em &quot;ANALISAR&quot; para enviar o contexto da transcrição para IA
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* HISTÓRICO DE ANÁLISES - EXPANSÍVEL */}
            <div className="flex-1 flex flex-col min-h-0">
              <div 
                className="flex-1 flex flex-col rounded-xl overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--eerie-black)', 
                  border: '1px solid rgba(249, 251, 252, 0.1)'
                }}
              >
                <div className="flex items-center justify-between p-4 border-b border-opacity-10" style={{ borderColor: 'var(--seasalt)' }}>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--seasalt)' }}>
                    HISTÓRICO DE ANÁLISES
                  </h3>
                  <span className="text-xs" style={{ color: 'var(--periwinkle)' }}>
                    {analysisHistory.length} análises
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {analysisHistory.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-sm opacity-70" style={{ color: 'var(--seasalt)' }}>
                        Nenhuma análise realizada ainda
                      </p>
                    </div>
                  )}

                  {analysisHistory.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="p-3 rounded-lg border"
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
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
};

export default DailyTranscriptionDisplay; 