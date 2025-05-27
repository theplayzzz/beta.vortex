import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../keys'

// Função para buscar contagem de clientes
async function fetchClientsCount(): Promise<number> {
  const response = await fetch('/api/clients?limit=1')
  
  if (!response.ok) {
    throw new Error('Erro ao buscar contagem de clientes')
  }
  
  const data = await response.json()
  return data.pagination?.totalCount || 0
}

// Hook para usar contagem de clientes
export function useClientsCount() {
  return useQuery({
    queryKey: queryKeys.clients.count(),
    queryFn: fetchClientsCount,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados de contagem podem ser um pouco mais frescos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  })
} 