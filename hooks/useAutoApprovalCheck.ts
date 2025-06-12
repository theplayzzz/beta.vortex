/**
 * 🆕 PLAN-025: Hook para Verificação Automática de Aprovação
 * Detecta quando usuário foi aprovado automaticamente e limpa cache/localStorage
 */

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface UseAutoApprovalCheckOptions {
  /** Intervalo de verificação em ms (padrão: 3000ms) */
  interval?: number
  /** Se deve redirecionar automaticamente quando aprovado */
  autoRedirect?: boolean
  /** URL para redirecionar quando aprovado */
  redirectTo?: string
  /** Callback quando status mudar */
  onStatusChange?: (newStatus: string) => void
}

/**
 * Hook que verifica automaticamente se usuário PENDING foi aprovado
 * e limpa cache/localStorage quando necessário
 */
export function useAutoApprovalCheck(options: UseAutoApprovalCheckOptions = {}) {
  const {
    interval = 3000, // 3 segundos
    autoRedirect = true,
    redirectTo = '/',
    onStatusChange
  } = options

  const { user, isLoaded } = useUser()
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) return

    const currentStatus = user.publicMetadata?.approvalStatus as string
    
    // Se não é PENDING, não precisa verificar
    if (currentStatus !== 'PENDING') {
      return
    }

    console.log('[AUTO_APPROVAL_HOOK] Iniciando verificação automática para usuário PENDING')

    // Função para verificar status
    const checkStatus = async () => {
      try {
        // Recarregar dados do usuário
        await user.reload()
        
        const newStatus = user.publicMetadata?.approvalStatus as string
        
        // Se status mudou
        if (newStatus !== lastStatusRef.current) {
          console.log(`[AUTO_APPROVAL_HOOK] Status mudou: ${lastStatusRef.current} -> ${newStatus}`)
          
          lastStatusRef.current = newStatus
          
          // Chamar callback se fornecido
          if (onStatusChange) {
            onStatusChange(newStatus)
          }
          
          // Se foi aprovado
          if (newStatus === 'APPROVED') {
            console.log('[AUTO_APPROVAL_HOOK] Usuário aprovado! Limpando cache e redirecionando...')
            
            // 🧹 LIMPAR CACHE E LOCALSTORAGE
            clearBrowserCache()
            
            // Parar verificação
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            
            // Redirecionar se habilitado
            if (autoRedirect) {
              // Aguardar um pouco para garantir que limpeza foi aplicada
              setTimeout(() => {
                router.push(redirectTo)
                router.refresh() // Forçar reload da página
              }, 500)
            }
          }
        }
        
      } catch (error) {
        console.error('[AUTO_APPROVAL_HOOK] Erro verificando status:', error)
      }
    }

    // Inicializar status atual
    lastStatusRef.current = currentStatus

    // Verificar imediatamente
    checkStatus()

    // Configurar intervalo de verificação
    intervalRef.current = setInterval(checkStatus, interval)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isLoaded, user, interval, autoRedirect, redirectTo, onStatusChange, router])

  return {
    isChecking: intervalRef.current !== null,
    currentStatus: user?.publicMetadata?.approvalStatus as string
  }
}

/**
 * Função para limpar cache do navegador e localStorage
 */
function clearBrowserCache() {
  try {
    console.log('[AUTO_APPROVAL_HOOK] Limpando cache do navegador...')
    
    // 1. Limpar localStorage
    localStorage.clear()
    
    // 2. Limpar sessionStorage
    sessionStorage.clear()
    
    // 3. Limpar cache específico do Clerk (se existir)
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
        console.warn(`[AUTO_APPROVAL_HOOK] Não foi possível remover key: ${key}`)
      }
    })
    
    // 4. Tentar limpar cache do Service Worker (se disponível)
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log(`[AUTO_APPROVAL_HOOK] Limpando cache: ${cacheName}`)
            return caches.delete(cacheName)
          })
        )
      }).catch(error => {
        console.warn('[AUTO_APPROVAL_HOOK] Erro limpando service worker cache:', error)
      })
    }
    
    console.log('[AUTO_APPROVAL_HOOK] Cache limpo com sucesso!')
    
  } catch (error) {
    console.error('[AUTO_APPROVAL_HOOK] Erro limpando cache:', error)
  }
}

/**
 * Função auxiliar para solicitar verificação manual
 */
export async function requestManualApprovalCheck(): Promise<boolean> {
  try {
    const response = await fetch('/api/check-auto-approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('[AUTO_APPROVAL_HOOK] Verificação manual solicitada com sucesso')
      return true
    } else {
      console.error('[AUTO_APPROVAL_HOOK] Erro na verificação manual:', result.error)
      return false
    }
    
  } catch (error) {
    console.error('[AUTO_APPROVAL_HOOK] Erro solicitando verificação manual:', error)
    return false
  }
} 