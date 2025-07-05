"use client";

import React from 'react';
import { useGoogleCloudTranscription } from '../lib/useGoogleCloudTranscription';

interface AudioLevelBarProps {
  level: number;
  label: string;
  color: string;
}

const AudioLevelBar: React.FC<AudioLevelBarProps> = ({ level, label, color }) => (
  <div className="flex items-center space-x-2">
    <span className="text-sm font-medium w-20">{label}:</span>
    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
      <div
        className={`h-2 rounded-full transition-all duration-150 ${color}`}
        style={{ width: `${Math.min(level * 100, 100)}%` }}
      />
    </div>
    <span className="text-xs text-gray-500 w-8">
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Google Cloud Speech-to-Text
        </h2>
        <p className="text-gray-600">
          Transcrição em tempo real de microfone + tela compartilhada
        </p>
      </div>

      {/* Status de Conexão */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium">
              {isConnected ? 'Conectado ao servidor' : 'Desconectado'}
            </span>
          </div>
          
          {!isConnected && (
            <button
              onClick={connectWebSocket}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
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
          className={`px-6 py-2 rounded-lg font-medium ${
            !isConnected || isListening
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isListening ? '🎙️ Escutando...' : '▶️ Iniciar Transcrição'}
        </button>

        <button
          onClick={stopListening}
          disabled={!isListening}
          className={`px-6 py-2 rounded-lg font-medium ${
            !isListening
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          ⏹️ Parar
        </button>

        <button
          onClick={clearTranscript}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
        >
          🗑️ Limpar
        </button>
      </div>

      {/* Níveis de Áudio */}
      {isListening && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Níveis de Áudio</h3>
          <div className="space-y-3">
            <AudioLevelBar
              level={micLevel}
              label="Microfone"
              color="bg-blue-500"
            />
            <AudioLevelBar
              level={screenLevel}
              label="Tela"
              color="bg-green-500"
            />
          </div>
        </div>
      )}

      {/* Área de Transcrição */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Transcrição</h3>
          {confidence > 0 && (
            <span className="text-sm text-gray-500">
              Confiança: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        
        <div className="min-h-[200px] p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
          {/* Texto transcrito final */}
          <div className="text-gray-800 leading-relaxed">
            {transcript && (
              <span className="bg-white px-2 py-1 rounded shadow-sm">
                {transcript}
              </span>
            )}
          </div>
          
          {/* Texto interim (em processo) */}
          {interimTranscript && (
            <div className="mt-2">
              <span className="text-gray-500 italic bg-yellow-50 px-2 py-1 rounded">
                {interimTranscript}
              </span>
            </div>
          )}
          
          {/* Indicador de escuta */}
          {isListening && !transcript && !interimTranscript && (
            <div className="text-gray-400 italic">
              Aguardando fala... 🎤
            </div>
          )}
          
          {/* Placeholder quando não está escutando */}
                     {!isListening && !transcript && (
             <div className="text-gray-400 italic">
               Clique em &quot;Iniciar Transcrição&quot; para começar
             </div>
           )}
        </div>
      </div>

      {/* Exibição de Erros */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 font-medium">Erro:</span>
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      )}

      {/* Informações Técnicas */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Informações</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Usa Google Cloud Speech-to-Text API</li>
          <li>• Combina áudio do microfone e tela compartilhada</li>
          <li>• Transcrição em tempo real com confiança</li>
          <li>• Reconexão automática em caso de erro</li>
          <li>• Stream é reiniciado automaticamente a cada 55s</li>
        </ul>
      </div>
    </div>
  );
};

export default GoogleCloudTranscriptionDisplay; 