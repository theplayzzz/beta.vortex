'use client'

import { clsx } from 'clsx'

export interface AudioControlsProps {
  isEnabled: boolean
  isListening: boolean
  onStart: () => void
  onStop: () => void
  onReset: () => void
  hasRecording?: boolean
  onDownload?: () => void
}

export function AudioControls({
  isEnabled,
  isListening,
  onStart,
  onStop,
  onReset,
  hasRecording = false,
  onDownload
}: AudioControlsProps) {
  return (
    <div className="border border-opacity-20 rounded-lg p-6 transition-all duration-300" 
         style={{ 
           backgroundColor: 'rgba(23, 24, 24, 0.6)',
           borderColor: 'rgba(249, 251, 252, 0.1)'
         }}>
      <div className="flex items-center justify-between">
        {/* Status visual */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {/* Ícone de microfone */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: isListening ? 'rgba(107, 233, 76, 0.2)' : 'rgba(207, 198, 254, 0.2)'
              }}
            >
              <svg 
                className="w-4 h-4"
                style={{
                  color: isListening ? 'var(--sgbus-green, #6be94c)' : 'var(--periwinkle, #cfc6fe)'
                }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.912 2.706A8.025 8.025 0 0118 10a8.025 8.025 0 01-.332 1.973 6.012 6.012 0 01-1.912 2.706C15.488 14.27 15.026 14 14.5 14A1.5 1.5 0 0013 12.5V12a2 2 0 00-4 0v.5A1.5 1.5 0 007.5 14c-.526 0-.988.27-1.256.679a6.012 6.012 0 01-1.912-2.706A8.025 8.025 0 014 10a8.025 8.025 0 01.332-1.973z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
              {isListening ? 'Capturando áudio' : 'Aguardando'}
            </span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center space-x-3">
          {!isEnabled ? (
            <button
              onClick={onStart}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{
                backgroundColor: 'var(--sgbus-green, #6be94c)',
                color: 'var(--night, #0e0f0f)'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLElement
                target.style.transform = 'scale(1.02)'
                target.style.boxShadow = '0 4px 12px rgba(107, 233, 76, 0.3)'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLElement
                target.style.transform = 'scale(1)'
                target.style.boxShadow = 'none'
              }}
            >
              🖥️ Compartilhar Tela
            </button>
          ) : (
            <button
              onClick={onStop}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{
                backgroundColor: '#ff6b6b',
                color: 'var(--seasalt, #f9fbfc)'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLElement
                target.style.transform = 'scale(1.02)'
                target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLElement
                target.style.transform = 'scale(1)'
                target.style.boxShadow = 'none'
              }}
            >
              ⏹️ Parar Captura
            </button>
          )}

          {hasRecording && onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 border border-opacity-20"
              style={{
                backgroundColor: 'rgba(107, 233, 76, 0.1)',
                color: 'var(--sgbus-green, #6be94c)',
                borderColor: 'var(--sgbus-green, #6be94c)'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLElement
                target.style.backgroundColor = 'rgba(107, 233, 76, 0.2)'
                target.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLElement
                target.style.backgroundColor = 'rgba(107, 233, 76, 0.1)'
                target.style.transform = 'scale(1)'
              }}
            >
              💾 Baixar
            </button>
          )}

          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 border border-opacity-20"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--periwinkle, #cfc6fe)',
              borderColor: 'var(--periwinkle, #cfc6fe)'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = 'rgba(207, 198, 254, 0.1)'
              target.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = 'transparent'
              target.style.transform = 'scale(1)'
            }}
          >
            🔄 Limpar
          </button>
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
        <div className="text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
          {!isEnabled ? (
            <div className="space-y-1">
              <p>
                <strong style={{ color: 'var(--seasalt, #f9fbfc)' }}>Para começar:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Clique em &ldquo;🖥️ Compartilhar Tela&rdquo;</li>
                <li>Selecione a janela ou tela a compartilhar</li>
                <li>Certifique-se de habilitar o áudio</li>
                <li>A transcrição começará automaticamente</li>
              </ol>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2" style={{ color: 'var(--sgbus-green, #6be94c)' }}>
                <span>✅ Tela compartilhada</span>
              </div>
              <div className="flex items-center space-x-2" style={{ color: 'var(--sgbus-green, #6be94c)' }}>
                <span>✅ Transcrição ativa</span>
              </div>
              <div className="flex items-center space-x-2" style={{ color: 'var(--sgbus-green, #6be94c)' }}>
                <span>✅ Áudio sendo gravado</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                Use &ldquo;⏹️ Parar Captura&rdquo; para finalizar
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 