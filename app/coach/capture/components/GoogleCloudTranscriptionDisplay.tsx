"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useGoogleCloudTranscription } from '../lib/useGoogleCloudTranscription';

interface AudioLevelBarProps {
  level: number;
  label: string;
  color: string;
}

const AudioLevelBar: React.FC<AudioLevelBarProps> = ({ level, label, color }) => (
  <div className="flex items-center space-x-3">
    <span className="text-sm font-medium w-20" style={{ color: 'var(--seasalt)' }}>
      {label}:
    </span>
    <div className="flex-1 rounded-full h-3 relative" style={{ backgroundColor: 'var(--night)' }}>
      <div
        className="h-3 rounded-full transition-all duration-150"
        style={{ 
          width: `${Math.min(level * 100, 100)}%`,
          backgroundColor: color === 'blue' ? 'var(--periwinkle)' : 'var(--sgbus-green)'
        }}
      />
    </div>
    <span className="text-xs w-12 text-right" style={{ color: 'var(--periwinkle)' }}>
      {Math.round(level * 100)}%
    </span>
  </div>
);

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
    startListening,
    stopListening,
    clearTranscript,
    connectWebSocket,
  } = useGoogleCloudTranscription();

  // Refs e estados para controle do scroll automático
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Função para verificar se está no final do scroll
  const isAtBottom = () => {
    if (!scrollContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 10; // 10px de tolerância
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
    
    // Se o usuário rolou para cima, desabilita auto-scroll
    if (!isAtBottom()) {
      setIsAutoScrollEnabled(false);
    } else {
      // Se está no final, reabilita auto-scroll
      setIsAutoScrollEnabled(true);
    }
  };

  // Effect para scroll automático quando há novo conteúdo
  useEffect(() => {
    if (isAutoScrollEnabled && (transcript || interimTranscript)) {
      // Pequeno delay para garantir que o DOM foi atualizado
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
      
      // Considera que o scroll parou após 150ms sem novos eventos
      scrollTimer = setTimeout(() => {
        setIsUserScrolling(false);
        
        // Verifica se está no final para reativar auto-scroll
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

  return (
    <div className="max-w-4xl mx-auto p-6 rounded-lg" style={{ backgroundColor: 'var(--eerie-black)', border: '1px solid rgba(249, 251, 252, 0.1)' }}>
      {/* Header compacto */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--seasalt)' }}>
          Ferramenta de Transcrição
        </h2>
      </div>

      {/* Status de Conexão */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--night)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: isConnected ? 'var(--sgbus-green)' : '#ef4444' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--seasalt)' }}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          {!isConnected && (
            <button
              onClick={connectWebSocket}
              className="px-3 py-1 rounded text-sm font-medium transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--periwinkle)',
                color: 'var(--night)'
              }}
            >
              Reconectar
            </button>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={startListening}
          disabled={!isConnected || isListening}
          className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
          style={{
            backgroundColor: (!isConnected || isListening) ? '#374151' : 'var(--sgbus-green)',
            color: (!isConnected || isListening) ? '#9ca3af' : 'var(--night)',
            cursor: (!isConnected || isListening) ? 'not-allowed' : 'pointer'
          }}
        >
          {isListening ? '🎙️ Escutando...' : '▶️ Iniciar Transcrição'}
        </button>

        <button
          onClick={stopListening}
          disabled={!isListening}
          className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
          style={{
            backgroundColor: !isListening ? '#374151' : '#ef4444',
            color: !isListening ? '#9ca3af' : 'white',
            cursor: !isListening ? 'not-allowed' : 'pointer'
          }}
        >
          ⏹️ Parar
        </button>

        <button
          onClick={clearTranscript}
          className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
          style={{ 
            backgroundColor: 'var(--periwinkle)',
            color: 'var(--night)'
          }}
        >
          🗑️ Limpar
        </button>
      </div>

      {/* Níveis de Áudio */}
      {isListening && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--night)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--seasalt)' }}>
            Níveis de Áudio
          </h3>
          <div className="space-y-4">
            <AudioLevelBar
              level={micLevel}
              label="Microfone"
              color="blue"
            />
            <AudioLevelBar
              level={screenLevel}
              label="Áudio"
              color="green"
            />
          </div>
        </div>
      )}

      {/* Área de Transcrição */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--seasalt)' }}>
            Transcrição
          </h3>
          <div className="flex items-center space-x-3">
            {confidence > 0 && (
              <span className="text-sm" style={{ color: 'var(--periwinkle)' }}>
                Confiança: {Math.round(confidence * 100)}%
              </span>
            )}
            {/* Indicador de auto-scroll */}
            <div className="flex items-center space-x-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isAutoScrollEnabled ? 'var(--sgbus-green)' : 'var(--periwinkle)' }}
              />
              <span className="text-xs" style={{ color: 'var(--periwinkle)' }}>
                {isAutoScrollEnabled ? 'Auto-scroll' : 'Manual'}
              </span>
            </div>
          </div>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="p-4 rounded-lg overflow-y-auto"
          style={{ 
            backgroundColor: 'var(--night)',
            border: '1px solid rgba(249, 251, 252, 0.2)',
            height: '300px',
            maxHeight: '300px',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Texto transcrito final */}
          <div className="leading-relaxed">
            {transcript && (
              <div 
                className="mb-2 p-2 rounded whitespace-pre-wrap"
                style={{ 
                  backgroundColor: 'var(--eerie-black)',
                  color: 'var(--seasalt)',
                  border: '1px solid rgba(107, 233, 76, 0.2)'
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
                className="p-2 rounded italic whitespace-pre-wrap"
                style={{ 
                  backgroundColor: 'rgba(207, 198, 254, 0.1)',
                  color: 'var(--periwinkle)',
                  border: '1px solid rgba(207, 198, 254, 0.3)'
                }}
              >
                {interimTranscript}
              </div>
            </div>
          )}
          
          {/* Indicador de escuta */}
          {isListening && !transcript && !interimTranscript && (
            <div className="italic" style={{ color: 'var(--periwinkle)' }}>
              Aguardando fala... 🎤
            </div>
          )}
          
          {/* Placeholder quando não está escutando */}
          {!isListening && !transcript && (
            <div className="italic" style={{ color: 'var(--periwinkle)' }}>
              Clique em "Iniciar Transcrição" para começar
            </div>
          )}
        </div>
      </div>

      {/* Exibição de Erros */}
      {error && (
        <div 
          className="mb-4 p-4 rounded-lg"
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
  );
};

export default GoogleCloudTranscriptionDisplay; 