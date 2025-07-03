/**
 * Hook otimizado para polling de status de aprovação
 * Usa React Query para gerenciamento eficiente de estado e cache
 */

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

interface ApprovalStatusResponse {
  authenticated: boolean
  approvalStatus: string
  role: string
  isAdmin: boolean
  timestamp: string
  canAccessDashboard: boolean
  needsApproval: boolean
  isRejected: boolean
  isSuspended: boolean
}

interface UseApprovalStatusPollingOptions {
  /** Intervalo de polling em ms (padrão: 2000ms) */
  pollingInterval?: number
  /** Se deve redirecionar automaticamente quando aprovado */
  autoRedirect?: boolean
  /** URL para redirecionar quando aprovado */
  redirectTo?: string
  /** Callback quando status mudar */
  onStatusChange?: (status: ApprovalStatusResponse) => void
  /** Se deve fazer polling apenas quando status é PENDING */
  onlyWhenPending?: boolean
}

/**
 * Hook para polling eficiente de status de aprovação
 * Usa React Query para otimizar requisições e cache
 */
export function useApprovalStatusPolling(options: UseApprovalStatusPollingOptions = {}) {
  const {
    pollingInterval = 2000, // 2 segundos
    autoRedirect = true,
    redirectTo = '/',
    onStatusChange,
    onlyWhenPending = true
  } = options

  const router = useRouter()
  const lastStatusRef = useRef<string | null>(null)

  // Fetch function para a API
  const fetchApprovalStatus = async (): Promise<ApprovalStatusResponse> => {
    const response = await fetch('/api/user/approval-status', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Query com React Query
  const {
    data: statusData,
    error,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['approvalStatus'],
    queryFn: fetchApprovalStatus,
         refetchInterval: (query) => {
       const data = query?.state?.data
       // Só continuar polling se:
       // 1. Não há erro
       // 2. Usuário está autenticado
       // 3. Se onlyWhenPending=true, só quando status é PENDING
       if (!data || isError || !data.authenticated) {
         return false // Para o polling
       }
       
       if (onlyWhenPending && data.approvalStatus !== 'PENDING') {
         return false // Para o polling quando não é mais PENDING
       }
       
       return pollingInterval
     },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0, // Sempre considerar dados como stale para polling
    gcTime: 0, // Não manter cache por muito tempo
  })

  // Effect para detectar mudanças de status
  useEffect(() => {
    if (!statusData || !statusData.authenticated) return

    const currentStatus = statusData.approvalStatus

    // Detectar mudança de status
    if (lastStatusRef.current && lastStatusRef.current !== currentStatus) {
      console.log(`[APPROVAL_POLLING] Status mudou: ${lastStatusRef.current} -> ${currentStatus}`)
      
      // Chamar callback se fornecido
      if (onStatusChange) {
        onStatusChange(statusData)
      }

      // Redirecionamento automático se aprovado
      if (currentStatus === 'APPROVED' && autoRedirect) {
        console.log('[APPROVAL_POLLING] Usuário aprovado! Redirecionando...')
        
        // Limpeza de cache
        clearBrowserCache()
        
        // Redirecionar após um breve delay
        setTimeout(() => {
          router.push(redirectTo)
          router.refresh()
        }, 500)
      }
    }

    lastStatusRef.current = currentStatus
  }, [statusData, onStatusChange, autoRedirect, redirectTo, router])

  // Log de debug para desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && statusData) {
      console.log('[APPROVAL_POLLING] Status atual:', {
        status: statusData.approvalStatus,
        canAccess: statusData.canAccessDashboard,
        timestamp: statusData.timestamp
      })
    }
  }, [statusData])

  return {
    // Dados do status
    statusData,
    approvalStatus: statusData?.approvalStatus || 'UNKNOWN',
    canAccessDashboard: statusData?.canAccessDashboard || false,
    needsApproval: statusData?.needsApproval || false,
    isRejected: statusData?.isRejected || false,
    isSuspended: statusData?.isSuspended || false,
    
    // Estados do polling
    isPolling: !isError && statusData?.authenticated && (!onlyWhenPending || statusData?.approvalStatus === 'PENDING'),
    isLoading,
    isError,
    error,
    
    // Controles
    refetch,
    forceCheck: () => refetch()
  }
}

/**
 * Função para limpar cache do navegador
 */
function clearBrowserCache() {
  try {
    console.log('[APPROVAL_POLLING] Limpando cache do navegador...')
    
    // Limpar localStorage e sessionStorage
    localStorage.clear()
    sessionStorage.clear()
    
    // Limpar cache específico do Clerk
    const clerkKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('clerk-') || 
      key.startsWith('__clerk') ||
      key.includes('clerk')
    )
    
    clerkKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch (e) {
        console.warn(`[APPROVAL_POLLING] Não foi possível remover key: ${key}`)
      }
    })
    
    console.log('[APPROVAL_POLLING] Cache limpo com sucesso!')
    
  } catch (error) {
    console.error('[APPROVAL_POLLING] Erro limpando cache:', error)
  }
} 