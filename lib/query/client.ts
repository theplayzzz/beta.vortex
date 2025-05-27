import { QueryClient } from '@tanstack/react-query'

// Configuração do QueryClient com configurações otimizadas
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Manter cache por 10 minutos
      gcTime: 10 * 60 * 1000, // 10 minutes (anteriormente cacheTime)
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

// Função para criar um novo QueryClient (útil para SSR)
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  })
} 