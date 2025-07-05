'use client'

import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

export interface TranscriptionDisplayProps {
  transcript: string
  isListening: boolean
}

export function TranscriptionDisplay({ 
  transcript, 
  isListening 
}: TranscriptionDisplayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll para o final quando houver novo texto
  const scrollToBottom = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [transcript])

  return (
    <div className="space-y-4">
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
          Transcrição em Tempo Real
        </h3>
        <div className="flex items-center space-x-2">
          <div 
            className={clsx(
              'w-3 h-3 rounded-full transition-colors',
              isListening ? 'animate-pulse' : ''
            )}
            style={{
              backgroundColor: isListening ? 'var(--sgbus-green, #6be94c)' : 'var(--periwinkle, #cfc6fe)'
            }}
          />
          <span className="text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            {isListening ? 'Ouvindo...' : 'Parado'}
          </span>
        </div>
      </div>

      {/* Display da transcrição */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="w-full h-64 p-4 border border-opacity-20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 leading-relaxed scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 transition-all duration-200"
          style={{
            backgroundColor: 'var(--night, #0e0f0f)',
            borderColor: 'rgba(249, 251, 252, 0.2)',
            color: 'var(--seasalt, #f9fbfc)',
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6'
          }}
          value={transcript || 'Aguardando transcrição...'}
          readOnly
          placeholder="Aguardando transcrição..."
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--sgbus-green, #6be94c)'
            e.target.style.boxShadow = '0 0 0 2px rgba(107, 233, 76, 0.2)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(249, 251, 252, 0.2)'
            e.target.style.boxShadow = 'none'
          }}
        />
        
        {/* Indicador visual quando está ouvindo */}
        {isListening && (
          <div className="absolute top-2 right-2">
            <div className="flex space-x-1">
              <div className="w-1 h-4 rounded animate-pulse delay-0" style={{ backgroundColor: 'var(--sgbus-green, #6be94c)' }}></div>
              <div className="w-1 h-4 rounded animate-pulse delay-100" style={{ backgroundColor: 'var(--sgbus-green, #6be94c)' }}></div>
              <div className="w-1 h-4 rounded animate-pulse delay-200" style={{ backgroundColor: 'var(--sgbus-green, #6be94c)' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="text-xs space-y-1" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
        <p>
          • A transcrição aparece automaticamente quando há áudio
        </p>
        <p>
          • Certifique-se de que o áudio do sistema está habilitado
        </p>
        <p>
          • Funciona melhor com fala clara e sem ruído de fundo
        </p>
      </div>
    </div>
  )
} 