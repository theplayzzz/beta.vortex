/**
 * 🆕 PLAN-025: Componente de Notificação de Aprovação Automática
 * Mostra feedback visual quando usuário está sendo processado para aprovação automática
 */

'use client'

import { useEffect, useState } from 'react'

interface AutoApprovalNotificationProps {
  isVisible: boolean
  onClose?: () => void
}

export function AutoApprovalNotification({ isVisible, onClose }: AutoApprovalNotificationProps) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      return
    }

    // Simular progresso da verificação
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          return 90 // Parar em 90% até receber resposta real
        }
        return prev + 10
      })
    }, 300)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="rounded-lg shadow-lg border-l-4 p-4 transition-all duration-300 animate-in slide-in-from-right"
           style={{ 
             backgroundColor: 'var(--eerie-black)',
             borderColor: 'var(--sgbus-green)',
             border: '1px solid rgba(249, 251, 252, 0.1)'
           }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="animate-spin">🔄</div>
            <h4 className="font-semibold text-sm" style={{ color: 'var(--seasalt)' }}>
              Verificando Aprovação
            </h4>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--periwinkle)' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Mensagem */}
        <p className="text-xs mb-3" style={{ color: 'var(--periwinkle)' }}>
          Consultando lista de usuários pré-aprovados...
        </p>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--sgbus-green)',
              width: `${progress}%` 
            }}
          />
        </div>

        {/* Status */}
        <div className="mt-2 text-xs" style={{ color: 'var(--periwinkle)' }}>
          {progress < 30 && "🔍 Conectando ao servidor..."}
          {progress >= 30 && progress < 60 && "📋 Verificando lista de aprovação..."}
          {progress >= 60 && progress < 90 && "⚡ Processando resultado..."}
          {progress >= 90 && "✨ Finalizando verificação..."}
        </div>
      </div>
    </div>
  )
}

export default AutoApprovalNotification 