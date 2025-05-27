'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// Configuração do QueryClient
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache por 5 minutos por padrão
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Manter cache por 10 minutos
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Retry automático em caso de erro
        retry: 2,
        // Refetch quando a janela ganha foco
        refetchOnWindowFocus: false,
        // Refetch quando reconecta
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry automático para mutations
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: sempre criar um novo query client
    return makeQueryClient()
  } else {
    // Browser: criar query client se não existir
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Usar useState para garantir que o query client seja criado apenas uma vez
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
} 