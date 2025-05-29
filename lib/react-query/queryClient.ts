import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutos default
      gcTime: 10 * 60 * 1000,       // 10 minutos GC
      retry: (failureCount, error: any) => {
        // Custom retry logic
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,   // Evitar refetch desnecessário
      refetchOnReconnect: true,      // Refetch quando reconectar
    },
    mutations: {
      retry: 1,
      gcTime: 5 * 60 * 1000,        // 5 minutos para mutations
    },
  },
});

// Função para limpar cache quando necessário
export const clearQueryCache = () => {
  queryClient.clear();
};

// Função para invalidar queries específicas
export const invalidateQueries = (queryKey: string[]) => {
  queryClient.invalidateQueries({ queryKey });
}; 