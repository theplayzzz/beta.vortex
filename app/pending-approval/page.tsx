"use client"

import { SignOutButton } from '@clerk/nextjs'
import { useState } from 'react'
import { useApprovalStatusPolling } from '@/hooks/useApprovalStatusPolling'
import { requestManualApprovalCheck } from '@/hooks/useAutoApprovalCheck'
import AutoApprovalNotification from '@/components/AutoApprovalNotification'

export default function PendingApprovalPage() {
  const [isManualChecking, setIsManualChecking] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  
  // 🔄 Polling otimizado para Race Condition
  const {
    approvalStatus,
    isPolling,
    isLoading,
    isError,
    forceCheck,
    canAccessDashboard,
    needsApproval
  } = useApprovalStatusPolling({
    pollingInterval: 2000, // Verificar a cada 2 segundos
    autoRedirect: true,
    redirectTo: '/',
    onlyWhenPending: true, // Só fazer polling quando PENDING
    onStatusChange: (statusData) => {
      console.log('[PENDING_PAGE] Status mudou para:', statusData.approvalStatus)
      if (statusData.approvalStatus === 'APPROVED') {
        console.log('[PENDING_PAGE] Aprovado! Redirecionando em breve...')
        setShowNotification(true)
      }
    }
  })

  // Função para solicitar verificação manual
  const handleManualCheck = async () => {
    setIsManualChecking(true)
    setShowNotification(true)
    
    // Forçar uma nova verificação
    await forceCheck()
    
    const success = await requestManualApprovalCheck()
    if (success) {
      console.log('[PENDING_PAGE] Verificação manual solicitada')
    }
    setTimeout(() => {
      setIsManualChecking(false)
      setShowNotification(false)
    }, 3000)
  }

  return (
    <>
      {/* 🆕 PLAN-025: Notificação de verificação */}
      <AutoApprovalNotification 
        isVisible={showNotification || isManualChecking} 
        onClose={() => setShowNotification(false)}
      />
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" 
         style={{ backgroundColor: 'var(--night)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold" style={{ color: 'var(--seasalt)' }}>
            ⏳ Aguardando Aprovação
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--periwinkle)' }}>
            Sua conta está sendo analisada por nossa equipe
          </p>
        </div>
        
        {/* 🔄 Indicador de polling para Race Condition */}
        <div className="p-4 rounded-lg border border-l-4 transition-all duration-200" 
             style={{ 
               backgroundColor: 'var(--eerie-black)',
               borderColor: 'rgba(249, 251, 252, 0.1)',
               borderLeftColor: isPolling ? 'var(--sgbus-green)' : 'var(--periwinkle)'
             }}>
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                <strong>
                  {isPolling ? '🔄 Verificando automaticamente...' : '📧 Sistema de Aprovação Automática'}
                </strong>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--periwinkle)' }}>
                {isPolling 
                  ? 'Verificando se você foi pré-aprovado. Se estiver na lista, será redirecionado automaticamente!'
                  : 'Se você foi pré-aprovado, será detectado automaticamente e redirecionado.'}
              </p>
            </div>
          </div>
        </div>

        {/* 🆕 PLAN-025: Botão de verificação manual */}
        <div className="space-y-2">
          <button 
            onClick={handleManualCheck}
            disabled={isManualChecking}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--periwinkle)',
              color: 'var(--night)'
            }}>
            {isManualChecking ? '🔄 Verificando...' : '🔍 Verificar Agora'}
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--periwinkle)' }}>
            Clique para forçar uma nova verificação de aprovação automática
          </p>
        </div>
        
        <div className="space-y-4">
          <SignOutButton redirectUrl="/sign-in">
            <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
                    style={{ 
                      backgroundColor: 'var(--sgbus-green)',
                      color: 'var(--night)'
                    }}>
              🔄 Atualizar Status (Logout + Login)
            </button>
          </SignOutButton>
        </div>
        
        <div className="rounded-lg p-4 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'var(--eerie-black)',
               borderColor: 'rgba(249, 251, 252, 0.1)'
             }}>
          <div className="text-sm">
            <p className="font-semibold" style={{ color: 'var(--sgbus-green)' }}>💡 Como Funciona:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1" style={{ color: 'var(--periwinkle)' }}>
              <li><strong>Aprovação Automática:</strong> Verificamos automaticamente se você está pré-aprovado</li>
              <li><strong>Redirecionamento:</strong> Se aprovado, você será redirecionado em instantes</li>
              <li><strong>Cache Limpo:</strong> Dados antigos do navegador são removidos automaticamente</li>
              <li><strong>Backup Manual:</strong> Equipe revisa contas não pré-aprovadas em até 24h</li>
            </ol>
            {approvalStatus && approvalStatus !== 'UNKNOWN' && (
              <p className="mt-3 text-xs" style={{ color: 'var(--sgbus-green)' }}>
                <strong>Status atual:</strong> {approvalStatus}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}