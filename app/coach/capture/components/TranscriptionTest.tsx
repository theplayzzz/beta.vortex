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
    startListening,
    stopListening,
    clearTranscript
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
      <div className="flex gap-4">
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

      {/* Transcrição */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2 text-gray-900">Transcrição Final</h3>
          <div className="p-4 bg-white border border-gray-300 rounded min-h-[100px] text-gray-800">
            {transcript || <span className="text-gray-400">Aguardando transcrição...</span>}
          </div>
        </div>
        
        {interimTranscript && (
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Transcrição Interim</h3>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900">
              {interimTranscript}
            </div>
          </div>
        )}
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
            <div className="font-semibold">Segmentos:</div>
            <div className="text-xs">Total: {segments.length}</div>
            <div className="text-xs">Finais: {segments.filter(s => s.isFinal).length}</div>
            <div className="text-xs">Interim: {segments.filter(s => !s.isFinal).length}</div>
          </div>
        </div>
      </div>

      {/* Instruções de Teste */}
      <div className="p-4 bg-blue-100 rounded text-sm text-blue-900">
        <h3 className="font-semibold mb-2 text-blue-900">Como testar sistema de deduplicação:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Clique em "Iniciar" e permita acesso ao microfone</li>
          <li>Fale em português devagar e observe o "Log de Eventos"</li>
          <li>Verifique se aparecem mensagens "🔄 Duplicada bloqueada"</li>
          <li>Observe se o texto interim aparece apenas uma vez (sem piscar)</li>
          <li>Confira as "Estatísticas de Duplicatas" - quanto mais duplicatas bloqueadas, melhor!</li>
          <li>Abra o Console (F12) para ver logs detalhados do sistema</li>
        </ol>
        <div className="mt-2 p-2 bg-blue-200 rounded text-xs">
          ⚠️ <strong>Se ainda houver duplicatas:</strong> Você verá mensagens repetidas no Log de Eventos ou textos "piscando" na transcrição.
        </div>
      </div>
    </div>
  );
}