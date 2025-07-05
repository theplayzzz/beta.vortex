'use client'

import { useEffect, useRef } from 'react'

export interface UnifiedTranscriptionDisplayProps {
  transcript: string
  listening: boolean
  microphoneLevel: number
  screenAudioLevel: number
  microphoneVolume: number
  screenAudioVolume: number
  onMicrophoneVolumeChange: (volume: number) => void
  onScreenAudioVolumeChange: (volume: number) => void
  error?: string | null
}

export function UnifiedTranscriptionDisplay({
  transcript,
  listening,
  microphoneLevel,
  screenAudioLevel,
  microphoneVolume,
  screenAudioVolume,
  onMicrophoneVolumeChange,
  onScreenAudioVolumeChange,
  error
}: UnifiedTranscriptionDisplayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll para o final quando houver novo texto
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    }
  }, [transcript])

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <div className="w-5 h-5 rounded-full mr-2 flex items-center justify-center bg-blue-500">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            Sistema de Transcrição Unificado
          </h3>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full transition-colors ${
                listening ? 'animate-pulse bg-green-400' : 'bg-gray-400'
              }`}
            />
            <span className={`text-sm ${listening ? 'text-green-400' : 'text-gray-400'}`}>
              {listening ? 'Ouvindo...' : 'Parado'}
            </span>
          </div>
        </div>

        {/* Controles de Volume e Níveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Microfone */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-300">🎤 Microfone</span>
              <span className="text-xs text-gray-400">
                Nível: {Math.round(microphoneLevel * 100)}%
              </span>
            </div>
            
            {/* Barra de nível do microfone */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-200"
                style={{ width: `${microphoneLevel * 100}%` }}
              />
            </div>
            
            {/* Controle de volume do microfone */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Volume: {Math.round(microphoneVolume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={microphoneVolume}
                onChange={(e) => onMicrophoneVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Áudio da Tela */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-300">🖥️ Tela</span>
              <span className="text-xs text-gray-400">
                Nível: {Math.round(screenAudioLevel * 100)}%
              </span>
            </div>
            
            {/* Barra de nível do áudio da tela */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-200"
                style={{ width: `${screenAudioLevel * 100}%` }}
              />
            </div>
            
            {/* Controle de volume da tela */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Volume: {Math.round(screenAudioVolume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={screenAudioVolume}
                onChange={(e) => onScreenAudioVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Área de Transcrição */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Transcrição Combinada</h3>
          <div className="text-sm text-gray-400">
            {transcript.length} caracteres
          </div>
        </div>

        {/* Erro se houver */}
        {error && (
          <div className="bg-red-900 border border-red-500 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Campo de transcrição */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full h-80 p-4 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white leading-relaxed"
            value={transcript || 'Aguardando transcrição combinada de microfone e tela...'}
            readOnly
            placeholder="Aguardando transcrição combinada de microfone e tela..."
            style={{
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.6'
            }}
          />
          
          {/* Indicador visual quando está ouvindo */}
          {listening && (
            <div className="absolute top-2 right-2">
              <div className="flex space-x-1">
                <div className="w-1 h-4 bg-blue-400 rounded animate-pulse delay-0"></div>
                <div className="w-1 h-4 bg-green-400 rounded animate-pulse delay-100"></div>
                <div className="w-1 h-4 bg-blue-400 rounded animate-pulse delay-200"></div>
                <div className="w-1 h-4 bg-green-400 rounded animate-pulse delay-300"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações técnicas */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Como Funciona:</h4>
        <div className="space-y-1 text-xs text-gray-400">
          <p>• <strong className="text-blue-300">Microfone:</strong> Captura sua voz via getUserMedia()</p>
          <p>• <strong className="text-green-300">Tela:</strong> Captura áudio do compartilhamento via getDisplayMedia()</p>
          <p>• <strong className="text-purple-300">Mixer:</strong> Combina ambos os áudios usando Web Audio API</p>
          <p>• <strong className="text-yellow-300">Transcrição:</strong> Web Speech API processa o stream unificado</p>
          <p>• <strong className="text-gray-300">Resultado:</strong> Transcrição única com falas de ambas as fontes</p>
        </div>
      </div>
    </div>
  )
} 