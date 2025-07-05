"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useGoogleCloudTranscription } from '../lib/useGoogleCloudTranscription';

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

const GoogleCloudTranscriptionDisplay: React.FC = () => {
  const {
    transcript,
    interimTranscript,
    isListening,
    isConnected,
    error,
    confidence,
    micLevel,
    screenLevel,
    isMicrophoneEnabled,
    startListening,
    stopListening,
    clearTranscript,
    connectWebSocket,
    toggleMicrophoneCapture,
    forceFinalize,
  } = useGoogleCloudTranscription();

  // Refs e estados para controle do scroll automático
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [newFieldText, setNewFieldText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Estados para histórico de análises
  interface AnalysisHistory {
    id: string;
    timestamp: string;
    contexto: string;
    resposta: string;
    isProcessing?: boolean;
  }
  
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);

  // Injetar estilos CSS para renderização de HTML
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

  // Função para verificar se está no final do scroll
  const isAtBottom = () => {
    if (!scrollContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 10;
  };

  // Função para fazer scroll para baixo
  const scrollToBottom = () => {
    if (scrollContainerRef.current && isAutoScrollEnabled) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Handler do evento de scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current || isUserScrolling) return;
    
    if (!isAtBottom()) {
      setIsAutoScrollEnabled(false);
    } else {
      setIsAutoScrollEnabled(true);
    }
  };

  // Effect para scroll automático quando há novo conteúdo
  useEffect(() => {
    if (isAutoScrollEnabled && (transcript || interimTranscript)) {
      setTimeout(scrollToBottom, 50);
    }
  }, [transcript, interimTranscript, isAutoScrollEnabled]);

  // Effect para detectar scroll programático vs manual
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
  }, []);

  // Reabilita auto-scroll quando limpa a transcrição
  useEffect(() => {
    if (!transcript && !interimTranscript) {
      setIsAutoScrollEnabled(true);
    }
  }, [transcript, interimTranscript]);

  // Função para toggle do microfone - agora usa a função real do hook
  const toggleMicrophone = () => {
    toggleMicrophoneCapture(!isMicrophoneEnabled);
  };

  // Função para formatar resposta do webhook (com suporte a HTML)
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
        if (firstValue.includes('<') && firstValue.includes('>')) {
          return firstValue.replace(/\\"/g, '"').trim();
        } else {
          return firstValue.replace(/\\n/g, '\n').replace(/\n\n+/g, '\n\n').trim();
        }
      }
      
      // Se não conseguiu extrair, retornar como texto
      return rawResponse;
    } catch (error) {
      console.log('⚠️ Erro ao fazer parse do JSON, tratando como texto simples');
      
      // Se não é JSON válido, tentar extrair texto entre aspas
      const textMatch = rawResponse.match(/"([^"]*(?:\\.[^"]*)*)"/);
      if (textMatch && textMatch[1]) {
        const extractedText = textMatch[1];
        return extractedText
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\n\n+/g, '\n\n')
          .trim();
      }
      
      // Último recurso: retornar como texto formatado
      return rawResponse.replace(/\\n/g, '\n').replace(/\n\n+/g, '\n\n').trim();
    }
  };

  // Função para verificar se a resposta contém HTML
  const isHtmlContent = (content: string): boolean => {
    return content.includes('<') && content.includes('>') && 
           (content.includes('<p>') || content.includes('<b>') || content.includes('<strong>') || 
            content.includes('<em>') || content.includes('<br>') || content.includes('<div>'));
  };

  // Função para limpar histórico
  const clearAnalysisHistory = () => {
    setAnalysisHistory([]);
  };

  // Função para adicionar análise ao histórico
  const addToAnalysisHistory = (contexto: string, resposta: string) => {
    const newAnalysis: AnalysisHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
      contexto: contexto.substring(0, 200) + (contexto.length > 200 ? '...' : ''),
      resposta: formatWebhookResponse(resposta)
    };
    
    setAnalysisHistory(prev => [newAnalysis, ...prev]); // Adicionar no topo
    setNewFieldText(''); // Limpar campo atual
  };

  // Função para criar entrada de loading no histórico
  const createLoadingEntry = (contexto: string) => {
    const loadingEntry: AnalysisHistory = {
      id: 'loading-' + Date.now().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
      contexto: contexto.substring(0, 200) + (contexto.length > 200 ? '...' : ''),
      resposta: '🔄 Processando análise...',
      isProcessing: true
    };
    
    setAnalysisHistory(prev => [loadingEntry, ...prev]);
    return loadingEntry.id;
  };

  // Função para atualizar entrada de loading com resultado
  const updateLoadingEntry = (loadingId: string, resposta: string) => {
    setAnalysisHistory(prev => prev.map(entry => 
      entry.id === loadingId 
        ? { ...entry, resposta: formatWebhookResponse(resposta), isProcessing: false }
        : entry
    ));
  };

  // Função para envio ao webhook de análise
  const sendToWebhook = async (contexto: string) => {
    try {
      console.log('📡 Enviando contexto para webhook:', contexto.substring(0, 100) + '...');
      
      const response = await fetch('https://webhook.lucasfelix.com/webhook/Analise_venda_beta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contexto: contexto,
          timestamp: new Date().toISOString(),
          source: 'google-cloud-transcription'
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

  // Função para análise de contexto completa
  const handleContextAnalysis = async () => {
    if (!isConnected) {
      setNewFieldText('❌ Erro: Servidor não conectado');
      return;
    }

    if (!isListening) {
      setNewFieldText('❌ Erro: Transcrição não está ativa');
      return;
    }

    if (isAnalyzing) {
      console.log('⚠️ Análise já em andamento');
      return;
    }

    console.log('🧠 Análise de contexto iniciada');
    setIsAnalyzing(true);
    
    let loadingId: string | null = null;
    
    try {
      // Mostrar loading no campo atual
      setNewFieldText('🔄 Forçando finalização das transcrições...');
      
      // 1. Forçar finalização do ciclo atual e aguardar confirmação
      console.log('📤 Enviando comando force-finalize');
      await forceFinalize();
      
      // 2. Aguardar tempo mínimo para garantir que evento 'end' foi processado
      console.log('⏳ Aguardando evento end e restart do stream...');
      setNewFieldText('⏳ Stream reiniciado - coletando contexto...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3. Coletar contexto atual (agora deve estar finalizado)
      const contextoCompleto = transcript + (interimTranscript ? ' ' + interimTranscript : '');
      
      if (!contextoCompleto.trim()) {
        setNewFieldText('⚠️ Nenhum contexto disponível para análise');
        return;
      }
      
      console.log('📋 Contexto coletado:', contextoCompleto.length, 'caracteres');
      console.log('📋 Contexto final:', contextoCompleto.substring(0, 200) + '...');
      
      // 4. Criar entrada de loading no histórico
      loadingId = createLoadingEntry(contextoCompleto);
      setNewFieldText('🌐 Enviando contexto para análise de IA...');
      
      // 5. Enviar para webhook
      const resposta = await sendToWebhook(contextoCompleto);
      
      // 6. Atualizar entrada no histórico com resultado
      if (loadingId) {
        updateLoadingEntry(loadingId, resposta);
      }
      
      // 7. Limpar campo atual
      setNewFieldText('');
      
      // 8. Stream continua ativo automaticamente
      console.log('✅ Análise concluída, stream continua ativo');
      
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      const errorMessage = `❌ Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      
      // Atualizar entrada de loading com erro ou mostrar no campo atual
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
                height: '280px',
                minHeight: '280px',
                maxHeight: '280px'
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
                
                {!isConnected && (
                  <button
                    onClick={connectWebSocket}
                    className="px-2 py-1 rounded text-xs transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(207, 198, 254, 0.2)',
                      color: 'var(--periwinkle)'
                    }}
                  >
                    RECONECTAR
                  </button>
                )}
              </div>

              {/* Grid de Controles Reorganizado */}
              <div className="space-y-2 mb-4">
                {/* Primeira linha: Gravação + Análise */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Botão Principal - Iniciar/Parar */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={!isConnected}
                    className="px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs"
                    style={{
                      backgroundColor: isListening ? '#ef4444' : ((!isConnected) ? 'rgba(55, 65, 81, 0.5)' : 'var(--sgbus-green)'),
                      color: isListening ? 'white' : ((!isConnected) ? '#9ca3af' : 'var(--night)'),
                      cursor: (!isConnected) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isListening ? '⏹ PARAR' : '▶ INICIAR'}
                  </button>

                  {/* Análise de Contexto */}
                  <button
                    onClick={handleContextAnalysis}
                    disabled={isAnalyzing || !isConnected || !isListening}
                    className="px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs"
                    style={{
                      backgroundColor: isAnalyzing 
                        ? 'rgba(107, 233, 76, 0.2)' 
                        : 'rgba(207, 198, 254, 0.2)',
                      border: `1px solid ${isAnalyzing ? 'var(--sgbus-green)' : 'var(--periwinkle)'}`,
                      color: isAnalyzing ? 'var(--sgbus-green)' : 'var(--periwinkle)',
                      cursor: (isAnalyzing || !isConnected || !isListening) ? 'not-allowed' : 'pointer',
                      opacity: (isAnalyzing || !isConnected || !isListening) ? 0.6 : 1
                    }}
                  >
                    {isAnalyzing ? '🔄 ANALISANDO' : '🧠 ANÁLISE'}
                  </button>
                </div>

                {/* Segunda linha: Microfone + Limpar */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Toggle Microfone - Agora funcional */}
                  <button
                    onClick={toggleMicrophone}
                    className="px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs"
                    style={{
                      backgroundColor: isMicrophoneEnabled ? 'var(--sgbus-green)' : 'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${isMicrophoneEnabled ? 'var(--sgbus-green)' : '#ef4444'}`,
                      color: isMicrophoneEnabled ? 'var(--night)' : '#ef4444'
                    }}
                  >
                    🎙 {isMicrophoneEnabled ? 'ON' : 'OFF'}
                  </button>

                  {/* Limpar */}
                  <button
                    onClick={clearTranscript}
                    className="px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs"
                    style={{
                      backgroundColor: 'rgba(249, 251, 252, 0.1)',
                      border: '1px solid rgba(249, 251, 252, 0.2)',
                      color: 'var(--seasalt)'
                    }}
                  >
                    🗑 LIMPAR
                  </button>
                </div>
              </div>

              {/* Níveis de Áudio - SEMPRE VISÍVEL COM ESPAÇO RESERVADO */}
              <div className="mt-4" style={{ height: '120px' }}>
                <div className="mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--periwinkle)' }}>
                    Níveis de Áudio
                  </h4>
                </div>
                
                <div className="space-y-3">
                  <AudioLevelBar
                    level={micLevel}
                    label="MIC"
                    color="blue"
                  />
                  <AudioLevelBar
                    level={screenLevel}
                    label="TELA"
                    color="green"
                  />
                </div>
                
                {/* Indicador de status do microfone */}
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--periwinkle)' }}>
                    <span>Microfone:</span>
                    <span style={{ color: isMicrophoneEnabled ? 'var(--sgbus-green)' : '#ef4444' }}>
                      {isMicrophoneEnabled ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                    {!isMicrophoneEnabled && isListening && (
                      <span style={{ color: 'var(--periwinkle)' }}>
                        • Apenas tela sendo capturada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PARTE INFERIOR - Área de Transcrição */}
            <div 
              className="p-6 rounded-xl flex-1"
              style={{ 
                backgroundColor: 'var(--eerie-black)', 
                border: '1px solid rgba(249, 251, 252, 0.1)'
              }}
            >
              <div className="h-full flex flex-col">
                {/* Header da Transcrição */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--seasalt)' }}>
                    Transcrição
                  </h3>
                  <div className="flex items-center space-x-4">
                    {confidence > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--sgbus-green)' }} />
                        <span className="text-xs font-mono" style={{ color: 'var(--periwinkle)' }}>
                          {Math.round(confidence * 100)}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isAutoScrollEnabled ? 'var(--sgbus-green)' : 'var(--periwinkle)' }}
                      />
                      <span className="text-xs font-mono" style={{ color: 'var(--periwinkle)' }}>
                        {isAutoScrollEnabled ? 'AUTO' : 'MANUAL'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Área de Transcrição */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 p-4 rounded-xl overflow-y-auto"
                  style={{ 
                    backgroundColor: 'var(--night)',
                    border: '1px solid rgba(249, 251, 252, 0.1)',
                    scrollBehavior: 'smooth'
                  }}
                >
                  {/* Texto transcrito final */}
                  <div className="leading-relaxed">
                    {transcript && (
                      <div 
                        className="mb-3 p-3 rounded-lg whitespace-pre-wrap"
                        style={{ 
                          backgroundColor: 'rgba(107, 233, 76, 0.1)',
                          border: '1px solid rgba(107, 233, 76, 0.2)',
                          color: 'var(--seasalt)'
                        }}
                      >
                        {transcript}
                      </div>
                    )}
                  </div>
                  
                  {/* Texto interim (em processo) */}
                  {interimTranscript && (
                    <div className="mt-2">
                      <div 
                        className="p-3 rounded-lg italic whitespace-pre-wrap"
                        style={{ 
                          backgroundColor: 'rgba(207, 198, 254, 0.1)',
                          border: '1px solid rgba(207, 198, 254, 0.2)',
                          color: 'var(--periwinkle)'
                        }}
                      >
                        {interimTranscript}
                      </div>
                    </div>
                  )}
                  
                  {/* Estados de placeholder */}
                  {isListening && !transcript && !interimTranscript && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-6 h-6 mx-auto mb-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sgbus-green)' }} />
                        <p className="text-sm italic" style={{ color: 'var(--periwinkle)' }}>
                          Aguardando fala...
                          {!isMicrophoneEnabled && (
                            <span className="block text-xs mt-1" style={{ color: '#ef4444' }}>
                              (Microfone desligado - apenas áudio da tela)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!isListening && !transcript && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm italic text-center" style={{ color: 'var(--periwinkle)' }}>
                        Clique em "INICIAR" para começar a transcrição
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - Análise de IA */}
          <div 
            className="rounded-xl flex flex-col"
            style={{ 
              backgroundColor: 'var(--eerie-black)', 
              border: '1px solid rgba(249, 251, 252, 0.1)',
              height: 'calc(100vh - 12rem)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--seasalt)' }}>
                  Análise de IA
                </h3>
                {analysisHistory.length > 0 && (
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(207, 198, 254, 0.2)',
                      color: 'var(--periwinkle)'
                    }}
                  >
                    {analysisHistory.length}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {analysisHistory.length > 0 && (
                  <button
                    onClick={clearAnalysisHistory}
                    className="px-2 py-1 rounded text-xs transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    🗑️ Limpar
                  </button>
                )}
                {isAnalyzing && (
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sgbus-green)' }} />
                    <span className="text-xs" style={{ color: 'var(--sgbus-green)' }}>
                      Processando...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Campo de entrada atual */}
            {newFieldText && (
              <div className="px-6 pb-4">
                <div 
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: 'var(--night)',
                    border: '1px solid rgba(249, 251, 252, 0.1)',
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sgbus-green)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--sgbus-green)' }}>
                      Processando agora...
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--seasalt)' }}>
                    {newFieldText}
                  </div>
                </div>
              </div>
            )}

            {/* Histórico de análises */}
            <div className="flex-1 px-6 pb-6 overflow-hidden">
              <div className="h-full overflow-y-auto space-y-4" style={{ scrollBehavior: 'smooth' }}>
                {analysisHistory.length === 0 && !newFieldText && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-3xl mb-3" style={{ color: 'var(--periwinkle)' }}>🧠</div>
                      <p className="text-sm" style={{ color: 'var(--periwinkle)' }}>
                        Clique em "ANÁLISE" para enviar o contexto atual das transcrições para análise de IA
                      </p>
                    </div>
                  </div>
                )}

                {analysisHistory.map((analysis) => (
                  <div 
                    key={analysis.id}
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: 'var(--night)',
                      border: `1px solid ${analysis.isProcessing ? 'rgba(107, 233, 76, 0.3)' : 'rgba(249, 251, 252, 0.1)'}`,
                    }}
                  >
                    {/* Header da análise */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`w-1.5 h-1.5 rounded-full ${analysis.isProcessing ? 'animate-pulse' : ''}`}
                          style={{ 
                            backgroundColor: analysis.isProcessing ? 'var(--sgbus-green)' : 'var(--periwinkle)' 
                          }} 
                        />
                        <span className="text-xs font-medium" style={{ color: 'var(--periwinkle)' }}>
                          {analysis.timestamp}
                        </span>
                      </div>
                      {analysis.isProcessing && (
                        <span className="text-xs" style={{ color: 'var(--sgbus-green)' }}>
                          Processando...
                        </span>
                      )}
                    </div>

                    {/* Contexto original */}
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--periwinkle)' }}>
                        Contexto:
                      </div>
                      <div 
                        className="text-xs p-2 rounded bg-opacity-50 italic"
                        style={{ 
                          color: 'rgba(249, 251, 252, 0.7)',
                          backgroundColor: 'rgba(249, 251, 252, 0.05)'
                        }}
                      >
                        "{analysis.contexto}"
                      </div>
                    </div>

                    {/* Resposta da IA */}
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: 'var(--periwinkle)' }}>
                        Análise:
                      </div>
                      {isHtmlContent(analysis.resposta) ? (
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exibição de Erros */}
        {error && (
          <div 
            className="mt-4 p-4 rounded-xl"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="flex items-center space-x-2">
              <span style={{ color: '#ef4444' }}>⚠️</span>
              <span className="font-medium" style={{ color: '#ef4444' }}>Erro:</span>
              <span style={{ color: '#ef4444' }}>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCloudTranscriptionDisplay; 