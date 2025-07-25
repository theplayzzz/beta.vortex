'use client';

import { useState, useEffect, useRef } from 'react';
import { useDailyTranscription } from '../lib/useDailyTranscription';

export function TranscriptionTest() {
  const {
    transcript,
    interimTranscript,
    isListening,
    isConnected,
    isProcessing,
    error,
    connectionQuality,
    audioLevel,
    wordsTranscribed,
    sessionDuration,
    confidence,
    segments,
    trackInfo, // NOVO: Informações de tracks
    diarizationEnabled, // NOVO: Status de diarização
    speakerStats, // NOVO: Estatísticas de speakers
    startListening,
    stopListening,
    clearTranscript,
    forceSourceDetection, // NOVO: Forçar fonte específica
    toggleForcedSource // NOVO: Alternar fonte forçada
  } = useDailyTranscription({ language: 'pt-BR' });

  const [eventLog, setEventLog] = useState<string[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    messageCount: 0,
    avgProcessingTime: 0,
    lastProcessingTime: 0,
    realMetrics: [] as number[]
  });
  
  // Refs para detectar duplicatas em tempo real
  const previousSegmentCountRef = useRef<number>(0);
  const lastInterimTextRef = useRef<string>('');
  const duplicateDetectionRef = useRef<{
    interimDuplicates: number;
    finalDuplicates: number;
    totalMessages: number;
  }>({ interimDuplicates: 0, finalDuplicates: 0, totalMessages: 0 });
  
  // Interceptar console.log para capturar métricas reais e detectar duplicatas
  useEffect(() => {
    const originalLog = console.log;
    
    console.log = (...args) => {
      originalLog(...args);
      
      const message = args.join(' ');
      
      // Capturar métricas de performance
      if (message.includes('⚡ Tempo de processamento:')) {
        const match = message.match(/(\d+\.?\d*)ms/);
        if (match) {
          const time = parseFloat(match[1]);
          setPerformanceMetrics(prev => {
            const newMetrics = [...prev.realMetrics, time].slice(-20);
            const avg = newMetrics.reduce((a, b) => a + b, 0) / newMetrics.length;
            
            return {
              ...prev,
              messageCount: prev.messageCount + 1,
              lastProcessingTime: time,
              avgProcessingTime: avg,
              realMetrics: newMetrics
            };
          });
        }
      }
      
      // Detectar mensagens duplicadas
      if (message.includes('🔄 Mensagem') && message.includes('duplicada ignorada')) {
        if (message.includes('interim')) {
          duplicateDetectionRef.current.interimDuplicates++;
          setEventLog(prev => [...prev.slice(-9), `🔄 Interim duplicada bloqueada (#${duplicateDetectionRef.current.interimDuplicates})`]);
        } else {
          duplicateDetectionRef.current.finalDuplicates++;
          setEventLog(prev => [...prev.slice(-9), `🔄 Final duplicada bloqueada (#${duplicateDetectionRef.current.finalDuplicates})`]);
        }
      }
      
      // Detectar mensagens processadas
      if (message.includes('📝 Transcrição processada (única)')) {
        duplicateDetectionRef.current.totalMessages++;
        setEventLog(prev => [...prev.slice(-9), `📝 Mensagem única processada (#${duplicateDetectionRef.current.totalMessages})`]);
      }
    };
    
    return () => {
      console.log = originalLog;
    };
  }, []);

  // Monitor de segmentos e detecção visual de duplicatas
  useEffect(() => {
    if (segments.length > previousSegmentCountRef.current) {
      previousSegmentCountRef.current = segments.length;
      const lastSegment = segments[segments.length - 1];
      setEventLog(prev => [...prev.slice(-9), `📝 Segmento adicionado (${lastSegment.isFinal ? 'final' : 'interim'}): "${lastSegment.text.substring(0, 30)}..."`]);
    }
  }, [segments]);

  // Monitor de mudanças no interim text para detectar duplicatas visuais
  useEffect(() => {
    if (interimTranscript && interimTranscript !== lastInterimTextRef.current) {
      lastInterimTextRef.current = interimTranscript;
      setEventLog(prev => [...prev.slice(-9), `💬 Interim atualizado: "${interimTranscript.substring(0, 30)}..."`]);
    }
  }, [interimTranscript]);

  // Log de eventos
  useEffect(() => {
    if (isConnected) {
      setEventLog(prev => [...prev, '✅ Conectado à sala']);
    }
  }, [isConnected]);

  useEffect(() => {
    if (isProcessing) {
      setEventLog(prev => [...prev, '🎙️ Processando transcrição']);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (error) {
      setEventLog(prev => [...prev, `❌ Erro: ${error}`]);
    }
  }, [error]);

  const handleStart = async () => {
    setEventLog(prev => [...prev, '🚀 Iniciando transcrição...']);
    await startListening();
  };

  const handleStop = async () => {
    setEventLog(prev => [...prev, '⏹️ Parando transcrição...']);
    await stopListening();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Teste de Transcrição Otimizada</h1>
      
      {/* Controles */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleStart}
          disabled={isListening}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {isListening ? 'Ouvindo...' : 'Iniciar'}
        </button>
        
        <button
          onClick={handleStop}
          disabled={!isListening}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Parar
        </button>
        
        <button
          onClick={clearTranscript}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Limpar
        </button>
        
        {/* NOVOS: Botões de Debug para Fonte */}
        <button
          onClick={toggleForcedSource}
          className="px-3 py-2 bg-purple-500 text-white rounded text-sm"
          title="Alternar fonte forçada: Auto → Tela → Microfone → Auto"
        >
          🎯 Toggle
        </button>
        
        <button
          onClick={() => forceSourceDetection('screen')}
          className="px-3 py-2 bg-green-500 text-white rounded text-sm"
          title="Forçar tudo como áudio da tela"
        >
          🖥️ Tela
        </button>
        
        <button
          onClick={() => forceSourceDetection('microphone')}
          className="px-3 py-2 bg-blue-500 text-white rounded text-sm"
          title="Forçar tudo como microfone"
        >
          🎤 Mic
        </button>
        
        <button
          onClick={() => forceSourceDetection(null)}
          className="px-3 py-2 bg-orange-500 text-white rounded text-sm"
          title="Voltar para detecção automática"
        >
          🔄 Auto
        </button>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 rounded text-gray-800">
        <div>
          <span className="font-semibold text-gray-900">Status:</span>
          <div className="text-sm text-gray-700">
            Conectado: {isConnected ? '✅' : '❌'}<br />
            Ouvindo: {isListening ? '✅' : '❌'}<br />
            Processando: {isProcessing ? '✅' : '❌'}<br />
            Qualidade: {connectionQuality}
          </div>
        </div>
        <div>
          <span className="font-semibold text-gray-900">Métricas:</span>
          <div className="text-sm text-gray-700">
            Palavras: {wordsTranscribed}<br />
            Duração: {sessionDuration}s<br />
            Confiança: {(confidence * 100).toFixed(1)}%<br />
            Nível de áudio: {audioLevel.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Performance e Deduplicação */}
      <div className="p-4 bg-blue-50 rounded text-blue-900">
        <h3 className="font-semibold mb-2 text-blue-900">Performance & Sistema de Deduplicação</h3>
        <div className="text-sm space-y-1 text-blue-800">
          <div>Mensagens processadas: {performanceMetrics.messageCount}</div>
          <div>Último tempo real: {performanceMetrics.lastProcessingTime.toFixed(2)}ms</div>
          <div>Média real: {performanceMetrics.avgProcessingTime.toFixed(2)}ms</div>
          
          <div className="border-t pt-2 mt-2">
            <div className="font-semibold text-blue-900">📊 Estatísticas de Duplicatas:</div>
            <div>Total mensagens únicas: {duplicateDetectionRef.current.totalMessages}</div>
            <div>Duplicatas interim bloqueadas: {duplicateDetectionRef.current.interimDuplicates}</div>
            <div>Duplicatas finais bloqueadas: {duplicateDetectionRef.current.finalDuplicates}</div>
            <div className="text-xs text-green-700 mt-1">
              ✅ Eficiência: {duplicateDetectionRef.current.totalMessages + duplicateDetectionRef.current.interimDuplicates + duplicateDetectionRef.current.finalDuplicates > 0 ? 
                ((duplicateDetectionRef.current.totalMessages / (duplicateDetectionRef.current.totalMessages + duplicateDetectionRef.current.interimDuplicates + duplicateDetectionRef.current.finalDuplicates)) * 100).toFixed(1) : 0}% (mensagens únicas processadas)
            </div>
          </div>
          
          <div className="text-xs text-blue-700 mt-2">
            ⚡ Meta: &lt;10ms por mensagem + 0 duplicatas visuais
          </div>
        </div>
      </div>

      {/* Log de Eventos */}
      <div className="p-4 bg-gray-900 text-green-400 rounded font-mono text-sm">
        <h3 className="text-white mb-2">Log de Eventos</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {eventLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      {/* Transcrição com Identificação de Canal */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2 text-gray-900">Transcrição por Segmentos (Com Identificação de Canal)</h3>
          <div className="p-4 bg-white border border-gray-300 rounded min-h-[200px] max-h-[400px] overflow-y-auto space-y-2">
            {segments.length > 0 ? (
              segments.map((segment, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg flex items-start space-x-3 ${
                    segment.color === 'green' 
                      ? 'bg-green-100 border-l-4 border-green-500' 
                      : segment.color === 'blue'
                      ? 'bg-blue-100 border-l-4 border-blue-500'
                      : 'bg-gray-100 border-l-4 border-gray-500'
                  }`}
                >
                  {/* Indicador Visual - Balão Colorido */}
                  <div className={`flex-shrink-0 w-4 h-4 rounded-full ${
                    segment.color === 'green' 
                      ? 'bg-green-500' 
                      : segment.color === 'blue'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }`}></div>
                  
                  {/* Conteúdo do Segmento */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        segment.color === 'green' 
                          ? 'text-green-700' 
                          : segment.color === 'blue'
                          ? 'text-blue-700'
                          : 'text-gray-700'
                      }`}>
                        {segment.audioSource === 'screen' ? '🖥️ Áudio da Tela' : 
                         segment.audioSource === 'microphone' ? '🎤 Microfone' : '👤 Remoto'}
                        {segment.isFinal ? ' (Final)' : ' (Interim)'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(segment.confidence * 100).toFixed(1)}% | {segment.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed">{segment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="mb-2">🎤 Aguardando transcrição...</div>
                <div className="text-xs">
                  <span className="inline-flex items-center mr-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    Áudio da Tela
                  </span>
                  <span className="inline-flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    Microfone
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Transcrições Legadas para Comparação */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Transcrição Final (Consolidada)</h3>
            <div className="p-4 bg-white border border-gray-300 rounded min-h-[100px] text-gray-800 text-sm">
              {transcript || <span className="text-gray-400">Aguardando transcrição...</span>}
            </div>
          </div>
          
          {interimTranscript && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Transcrição Interim (Atual)</h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 text-sm">
                {interimTranscript}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Diagnóstico de Duplicatas */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
        <h3 className="font-semibold mb-2 text-yellow-900">🔍 Diagnóstico de Duplicatas:</h3>
        <div className="space-y-2 text-yellow-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold">Transcrição Final:</div>
              <div className="text-xs">Palavras: {transcript.split(' ').filter(w => w.length > 0).length}</div>
              <div className="text-xs">Chars: {transcript.length}</div>
            </div>
            <div>
              <div className="font-semibold">Transcrição Interim:</div>
              <div className="text-xs">Chars: {interimTranscript.length}</div>
              <div className="text-xs">Última atualização: {lastInterimTextRef.current === interimTranscript ? '✅ Sem duplicata' : '⚠️ Possível duplicata'}</div>
            </div>
          </div>
          <div className="border-t pt-2">
            <div className="font-semibold">Dual Stream Analytics:</div>
            <div className="text-xs">Total: {segments.length}</div>
            <div className="text-xs">🖥️ Tela: {speakerStats.screenSegments}</div>
            <div className="text-xs">🎤 Microfone: {speakerStats.microphoneSegments}</div>
            <div className="text-xs">👥 Speakers: {speakerStats.totalSpeakers}</div>
            <div className="text-xs">Finais: {segments.filter(s => s.isFinal).length}</div>
            <div className="text-xs">Interim: {segments.filter(s => !s.isFinal).length}</div>
          </div>
          
          <div className="border-t pt-2">
            <div className="font-semibold">Track Status:</div>
            <div className="text-xs">🎤 Audio Track: {trackInfo.audioTrackActive ? '✅ Ativo' : '❌ Inativo'}</div>
            <div className="text-xs">🖥️ Screen Audio: {trackInfo.screenAudioTrackActive ? '✅ Ativo' : '❌ Inativo'}</div>
            <div className="text-xs">🧠 Diarização: {diarizationEnabled ? '✅ Ativada' : '❌ Desativada'}</div>
            <div className="text-xs">🎯 Última Fonte: {trackInfo.lastDetectedSource}</div>
          </div>
        </div>
      </div>

      {/* Instruções de Teste */}
      <div className="p-4 bg-blue-100 rounded text-sm text-blue-900">
        <h3 className="font-semibold mb-2 text-blue-900">Como testar DUAL STREAM com diarização avançada:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Clique em "Iniciar" e permita acesso ao microfone</li>
          <li>Fale no microfone - deve aparecer azul 🎤 com speaker ID</li>
          <li>Se possível, compartilhe tela com áudio - deve aparecer verde 🖥️</li>
          <li>Observe "Track Status" para ver quais tracks estão ativos</li>
          <li>Confira "Dual Stream Analytics" - contadores por canal</li>
          <li>Verifique se diarização está ✅ ativada</li>
          <li>No Console (F12): veja "📊 Enhanced Debug" e "🎤 Fonte detectada (Enhanced)"</li>
          <li>Teste múltiplos speakers - deve mostrar diferentes IDs</li>
        </ol>
        <div className="mt-2 p-2 bg-blue-200 rounded text-xs">
          ⚠️ <strong>Se ainda houver duplicatas:</strong> Você verá mensagens repetidas no Log de Eventos ou textos "piscando" na transcrição.
        </div>
      </div>
    </div>
  );
}