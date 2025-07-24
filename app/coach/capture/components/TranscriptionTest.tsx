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
  
  // Ref para armazenar timestamp do último segmento
  const lastSegmentTimeRef = useRef<number>(0);
  const previousSegmentCountRef = useRef<number>(0);
  
  // Interceptar console.log para capturar métricas reais
  useEffect(() => {
    const originalLog = console.log;
    
    console.log = (...args) => {
      originalLog(...args);
      
      // Capturar métricas de performance
      const message = args.join(' ');
      if (message.includes('⚡ Tempo de processamento:')) {
        const match = message.match(/(\d+\.?\d*)ms/);
        if (match) {
          const time = parseFloat(match[1]);
          setPerformanceMetrics(prev => {
            const newMetrics = [...prev.realMetrics, time].slice(-20); // Manter últimas 20
            const avg = newMetrics.reduce((a, b) => a + b, 0) / newMetrics.length;
            
            return {
              ...prev,
              messageCount: prev.messageCount + 1,
              lastProcessingTime: time,
              avgProcessingTime: avg,
              realMetrics: newMetrics
            };
          });
          
          setEventLog(prev => [...prev.slice(-9), `⚡ Processamento real: ${time.toFixed(2)}ms`]);
        }
      }
    };
    
    return () => {
      console.log = originalLog;
    };
  }, []);

  // Monitor de segmentos
  useEffect(() => {
    if (segments.length > previousSegmentCountRef.current) {
      previousSegmentCountRef.current = segments.length;
      const lastSegment = segments[segments.length - 1];
      setEventLog(prev => [...prev.slice(-9), `📝 Transcrição recebida (${lastSegment.isFinal ? 'final' : 'interim'})`]);
    }
  }, [segments]);

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

      {/* Performance */}
      <div className="p-4 bg-blue-50 rounded text-blue-900">
        <h3 className="font-semibold mb-2 text-blue-900">Performance dos Event Handlers</h3>
        <div className="text-sm space-y-1 text-blue-800">
          <div>Mensagens processadas: {performanceMetrics.messageCount}</div>
          <div>Último tempo real: {performanceMetrics.lastProcessingTime.toFixed(2)}ms</div>
          <div>Média real: {performanceMetrics.avgProcessingTime.toFixed(2)}ms</div>
          <div className="text-xs text-blue-700 mt-2">
            ⚡ Meta: &lt;10ms por mensagem (30-50% mais rápido que handler genérico)
          </div>
          <div className="text-xs text-orange-700 mt-2 p-2 bg-orange-100 rounded">
            ℹ️ <strong>Nota:</strong> Abra o Console do navegador (F12) para ver os tempos reais de processamento.
            Procure por mensagens com "⚡ Tempo de processamento: X.XXms"
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

      {/* Instruções de Teste */}
      <div className="p-4 bg-blue-100 rounded text-sm text-blue-900">
        <h3 className="font-semibold mb-2 text-blue-900">Como testar:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Clique em "Iniciar" e permita acesso ao microfone</li>
          <li>Fale em português para testar a transcrição</li>
          <li>Observe os tempos de processamento no painel de Performance</li>
          <li>Verifique se o tempo médio está abaixo de 10ms (otimização funcionando)</li>
          <li>Teste falando rápido para verificar o endpointing de 100ms</li>
        </ol>
      </div>
    </div>
  );
}