import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../keys'

// Tipos para filtros de clientes
export interface ClientFilters {
  search?: string
  industry?: string[]
  richnessScoreMin?: number
  richnessScoreMax?: number
  sortBy?: 'name' | 'richnessScore' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  includeArchived?: boolean
}

// Tipo para resposta da API
export interface ClientsResponse {
  clients: Array<{
    id: string
    name: string
    industry: string | null
    serviceOrProduct: string | null
    initialObjective: string | null
    contactEmail: string | null
    richnessScore: number
    isViewed: boolean
    createdAt: string
    updatedAt: string
    _count: {
      notes: number
      attachments: number
    }
  }>
  pagination: {
    page: number
    limit: number
    totalCount: number | null
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters: {
    industries: string[]
    appliedFilters: ClientFilters
  }
}

// Função para buscar clientes
async function fetchClients(filters: ClientFilters): Promise<ClientsResponse> {
  const searchParams = new URLSearchParams()
  
  // Adicionar filtros aos parâmetros
  if (filters.search) searchParams.set('search', filters.search)
  if (filters.industry?.length) {
    filters.industry.forEach(industry => searchParams.append('industry', industry))
  }
  if (filters.richnessScoreMin !== undefined) {
    searchParams.set('richnessScoreMin', filters.richnessScoreMin.toString())
  }
  if (filters.richnessScoreMax !== undefined) {
    searchParams.set('richnessScoreMax', filters.richnessScoreMax.toString())
  }
  if (filters.sortBy) searchParams.set('sortBy', filters.sortBy)
  if (filters.sortOrder) searchParams.set('sortOrder', filters.sortOrder)
  if (filters.page) searchParams.set('page', filters.page.toString())
  if (filters.limit) searchParams.set('limit', filters.limit.toString())
  if (filters.includeArchived) searchParams.set('includeArchived', 'true')
  
  const response = await fetch(`/api/clients?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Erro ao buscar clientes')
  }
  
  return response.json()
}

// Hook para usar listagem de clientes
export function useClients(filters: ClientFilters = {}) {
  // Normalizar filtros para garantir consistência na query key
  const normalizedFilters = {
    search: filters.search || undefined,
    industry: filters.industry?.length ? filters.industry.sort() : undefined,
    richnessScoreMin: filters.richnessScoreMin,
    richnessScoreMax: filters.richnessScoreMax,
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
    page: filters.page || 1,
    limit: filters.limit || 12,
    includeArchived: filters.includeArchived || false,
  }
  
  return useQuery({
    queryKey: queryKeys.clients.list(normalizedFilters),
    queryFn: () => fetchClients(normalizedFilters),
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    refetchOnWindowFocus: false,
    // Manter dados anteriores durante refetch para melhor UX
    placeholderData: (previousData) => previousData,
  })
} 