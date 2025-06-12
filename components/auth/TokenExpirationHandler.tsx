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
    // Só interceptar erros 401 se o usuário ESTAVA logado
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.status === 401) {
        // ⚡ VERIFICAÇÃO CRÍTICA: Só redirecionar se o usuário estava logado
        if (isSignedIn) {
          console.log('🔒 Token expirado detectado para usuário logado, redirecionando...')
          
          toast.error(
            'Sessão expirada',
            'Sua sessão expirou. Você será redirecionado para fazer login novamente.'
          )
          
          // Aguardar um pouco para o toast aparecer, depois redirecionar
          setTimeout(() => {
            router.push('/session-expired?redirect_url=' + encodeURIComponent(window.location.pathname))
          }, 2000)
        } else {
          console.log('🔓 Erro 401 detectado mas usuário não estava logado - ignorando')
        }
      }
    }

    // Interceptar fetch requests para detectar 401
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        if (response.status === 401) {
          // ⚡ VERIFICAÇÃO CRÍTICA: Só processar se o usuário estava logado
          if (isSignedIn) {
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
          } else {
            console.log('🔓 Erro 401 em fetch mas usuário não estava logado - ignorando')
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
  }, [router, isSignedIn]) // ⚡ DEPENDÊNCIA CRÍTICA: isSignedIn

  // Verificar se o usuário está autenticado quando o componente carrega
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Se não está logado e não estamos em uma página pública
      const publicPaths = ['/sign-in', '/sign-up', '/pending-approval', '/account-rejected', '/session-expired']
      const currentPath = window.location.pathname
      
      // ⚡ VERIFICAÇÃO MELHORADA: Não redirecionar se já estamos em uma página pública
      if (!publicPaths.some(path => currentPath.startsWith(path))) {
        console.log('🔒 Usuário não autenticado, redirecionando para login...')
        router.push('/sign-in?redirect_url=' + encodeURIComponent(currentPath))
      }
    }
  }, [isLoaded, isSignedIn, router])

  return <>{children}</>
} 