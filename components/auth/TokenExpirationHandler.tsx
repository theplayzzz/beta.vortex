'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'

interface TokenExpirationHandlerProps {
  children: React.ReactNode
}

export function TokenExpirationHandler({ children }: TokenExpirationHandlerProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Interceptar erros 401 globalmente
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.status === 401) {
        console.log('🔒 Token expirado detectado, redirecionando para login...')
        
        toast.error(
          'Sessão expirada',
          'Sua sessão expirou. Você será redirecionado para fazer login novamente.'
        )
        
        // Aguardar um pouco para o toast aparecer, depois redirecionar
        setTimeout(() => {
          router.push('/session-expired?redirect_url=' + encodeURIComponent(window.location.pathname))
        }, 2000)
      }
    }

    // Interceptar fetch requests para detectar 401
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        if (response.status === 401) {
          // Verificar se é um erro de token expirado
          const cloneResponse = response.clone()
          try {
            const errorData = await cloneResponse.json()
            if (errorData.error?.includes('Login necessário') || 
                errorData.error?.includes('Não autorizado')) {
              
              // Disparar evento customizado
              window.dispatchEvent(new CustomEvent('auth:unauthorized', {
                detail: { status: 401, error: errorData.error }
              }))
            }
          } catch (e) {
            // Se não conseguir parsear JSON, ainda assim tratar como 401
            window.dispatchEvent(new CustomEvent('auth:unauthorized', {
              detail: { status: 401, error: 'Token expirado' }
            }))
          }
        }
        
        return response
      } catch (error) {
        throw error
      }
    }

    // Adicionar listener para eventos de não autorização
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    // Cleanup
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
      window.fetch = originalFetch
    }
  }, [router])

  // Verificar se o usuário está autenticado quando o componente carrega
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Se não está logado e não estamos em uma página pública
      const publicPaths = ['/sign-in', '/sign-up', '/pending-approval', '/account-rejected']
      const currentPath = window.location.pathname
      
      if (!publicPaths.some(path => currentPath.startsWith(path))) {
        console.log('🔒 Usuário não autenticado, redirecionando para login...')
        router.push('/sign-in?redirect_url=' + encodeURIComponent(currentPath))
      }
    }
  }, [isLoaded, isSignedIn, router])

  return <>{children}</>
} 