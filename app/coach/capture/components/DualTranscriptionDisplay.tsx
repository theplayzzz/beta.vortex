'use client'

import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

export interface DualTranscriptionDisplayProps {
  microphoneTranscript: string
  screenTranscript: string
  isMicrophoneListening: boolean
  isScreenListening: boolean
  screenAudioLevel?: number
}

export function DualTranscriptionDisplay({ 
  microphoneTranscript, 
  screenTranscript,
  isMicrophoneListening,
  isScreenListening,
  screenAudioLevel = 0
}: DualTranscriptionDisplayProps) {
  const microphoneTextareaRef = useRef<HTMLTextAreaElement>(null)
  const screenTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll para o final quando houver novo texto
  const scrollToBottom = (textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom(microphoneTextareaRef)
  }, [microphoneTranscript])

  useEffect(() => {
    scrollToBottom(screenTextareaRef)
  }, [screenTranscript])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transcrição do Microfone */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: 'rgba(207, 198, 254, 0.2)' }}>
                <svg className="w-3 h-3" style={{ color: 'var(--periwinkle, #cfc6fe)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.912 2.706A8.025 8.025 0 0118 10a8.025 8.025 0 01-.332 1.973 6.012 6.012 0 01-1.912 2.706C15.488 14.27 15.026 14 14.5 14A1.5 1.5 0 0013 12.5V12a2 2 0 00-4 0v.5A1.5 1.5 0 007.5 14c-.526 0-.988.27-1.256.679a6.012 6.012 0 01-1.912-2.706A8.025 8.025 0 014 10a8.025 8.025 0 01.332-1.973z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                Microfone
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={clsx(
                  'w-3 h-3 rounded-full transition-colors',
                  isMicrophoneListening ? 'animate-pulse' : ''
                )}
                style={{
                  backgroundColor: isMicrophoneListening ? 'var(--periwinkle, #cfc6fe)' : 'rgba(207, 198, 254, 0.3)'
                }}
              />
              <span className="text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                {isMicrophoneListening ? 'Ouvindo...' : 'Parado'}
              </span>
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={microphoneTextareaRef}
              className="w-full h-64 p-4 border border-opacity-20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 leading-relaxed scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 transition-all duration-200"
              style={{
                backgroundColor: 'var(--night, #0e0f0f)',
                borderColor: 'rgba(207, 198, 254, 0.2)',
                color: 'var(--seasalt, #f9fbfc)',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.6'
              }}
              value={microphoneTranscript || 'Aguardando transcrição do microfone...'}
              readOnly
              placeholder="Aguardando transcrição do microfone..."
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--periwinkle, #cfc6fe)'
                e.target.style.boxShadow = '0 0 0 2px rgba(207, 198, 254, 0.2)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(207, 198, 254, 0.2)'
                e.target.style.boxShadow = 'none'
              }}
            />
            
            {/* Indicador visual quando está ouvindo */}
            {isMicrophoneListening && (
              <div className="absolute top-2 right-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 rounded animate-pulse delay-0" style={{ backgroundColor: 'var(--periwinkle, #cfc6fe)' }}></div>
                  <div className="w-1 h-4 rounded animate-pulse delay-100" style={{ backgroundColor: 'var(--periwinkle, #cfc6fe)' }}></div>
                  <div className="w-1 h-4 rounded animate-pulse delay-200" style={{ backgroundColor: 'var(--periwinkle, #cfc6fe)' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transcrição da Tela */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: 'rgba(107, 233, 76, 0.2)' }}>
                <svg className="w-3 h-3" style={{ color: 'var(--sgbus-green, #6be94c)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                Tela Compartilhada
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={clsx(
                  'w-3 h-3 rounded-full transition-colors',
                  isScreenListening ? 'animate-pulse' : ''
                )}
                style={{
                  backgroundColor: isScreenListening ? 'var(--sgbus-green, #6be94c)' : 'rgba(107, 233, 76, 0.3)'
                }}
              />
              <span className="text-sm" style={{ color: 'var(--sgbus-green, #6be94c)' }}>
                {isScreenListening ? 'Ouvindo...' : 'Parado'}
              </span>
              {/* Indicador de nível de áudio */}
              {isScreenListening && (
                <div className="flex items-center space-x-1">
                  <div className="w-12 h-2 bg-opacity-20 rounded-full overflow-hidden"
                       style={{ backgroundColor: 'var(--sgbus-green, #6be94c)' }}>
                    <div 
                      className="h-full transition-all duration-200 rounded-full"
                      style={{ 
                        width: `${screenAudioLevel * 100}%`,
                        backgroundColor: 'var(--sgbus-green, #6be94c)'
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--sgbus-green, #6be94c)' }}>
                    {Math.round(screenAudioLevel * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={screenTextareaRef}
              className="w-full h-64 p-4 border border-opacity-20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 leading-relaxed scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 transition-all duration-200"
              style={{
                backgroundColor: 'var(--night, #0e0f0f)',
                borderColor: 'rgba(107, 233, 76, 0.2)',
                color: 'var(--seasalt, #f9fbfc)',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.6'
              }}
              value={screenTranscript || 'Aguardando transcrição da tela...'}
              readOnly
              placeholder="Aguardando transcrição da tela..."
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--sgbus-green, #6be94c)'
                e.target.style.boxShadow = '0 0 0 2px rgba(107, 233, 76, 0.2)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(107, 233, 76, 0.2)'
                e.target.style.boxShadow = 'none'
              }}
            />
            
            {/* Indicador visual quando está ouvindo */}
            {isScreenListening && (
              <div className="absolute top-2 right-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 rounded animate-pulse delay-0" style={{ backgroundColor: 'var(--sgbus-green, #6be94c)' }}></div>
                  <div className="w-1 h-4 rounded animate-pulse delay-100" style={{ backgroundColor: 'var(--sgbus-green, #6be94c)' }}></div>
                  <div className="w-1 h-4 rounded animate-pulse delay-200" style={{ backgroundColor: 'var(--sgbus-green, #6be94c)' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles e informações */}
      <div className="border-t border-opacity-20 pt-4" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-xs space-y-1" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            <p><strong>Microfone:</strong></p>
            <p>• Captura fala diretamente do microfone</p>
            <p>• Ideal para narração e comentários</p>
            <p>• Funciona independentemente da tela</p>
          </div>
          <div className="text-xs space-y-1" style={{ color: 'var(--sgbus-green, #6be94c)' }}>
            <p><strong>Tela Compartilhada:</strong></p>
            <p>• Captura áudio da aplicação compartilhada</p>
            <p>• Ideal para chamadas, vídeos e apresentações</p>
            <p>• Requer compartilhamento de tela ativo</p>
          </div>
        </div>
      </div>
    </div>
  )
} 