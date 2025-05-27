import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { useUpdateClient, useDeleteClient, useRestoreClient, UpdateClientData } from './use-client-mutations'

// Tipo para cliente detalhado
export interface ClientDetail {
  id: string
  name: string
  industry: string | null
  serviceOrProduct: string | null
  initialObjective: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  address: string | null
  businessDetails: string | null
  targetAudience: string | null
  marketingObjectives: string | null
  historyAndStrategies: string | null
  challengesOpportunities: string | null
  competitors: string | null
  resourcesBudget: string | null
  toneOfVoice: string | null
  preferencesRestrictions: string | null
  richnessScore: number
  isViewed: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  userId: string
  _count: {
    notes: number
    attachments: number
    strategicPlannings: number
    tasks: number
  }
}

// Função para buscar cliente por ID
async function fetchClientDetail(id: string): Promise<ClientDetail> {
  const response = await fetch(`/api/clients/${id}`)
  
  if (!response.ok) {
    throw new Error('Erro ao buscar cliente')
  }
  
  return response.json()
}

// Hook principal para cliente específico
export function useClientDetail(id: string) {
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()
  const restoreMutation = useRestoreClient()

  // Query para buscar dados do cliente
  const query = useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => fetchClientDetail(id),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!id, // Só executa se tiver ID
  })

  // Funções de conveniência
  const updateClient = (data: Omit<UpdateClientData, 'id'>) => {
    return updateMutation.mutate({ id, ...data })
  }

  const deleteClient = () => {
    return deleteMutation.mutate(id)
  }

  const restoreClient = () => {
    return restoreMutation.mutate(id)
  }

  // Função para marcar como visualizado
  const markAsViewed = () => {
    if (query.data && !query.data.isViewed) {
      updateClient({ isViewed: true })
    }
  }

  return {
    // Dados do cliente
    client: query.data,
    
    // Estados da query
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    
    // Estados das mutations
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    
    // Erros das mutations
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    restoreError: restoreMutation.error,
    
    // Funções de ação
    updateClient,
    deleteClient,
    restoreClient,
    markAsViewed,
    
    // Função para refetch manual
    refetch: query.refetch,
    
    // Estado combinado de loading
    isMutating: updateMutation.isPending || deleteMutation.isPending || restoreMutation.isPending,
    
    // Estado geral
    isArchived: query.data?.deletedAt !== null,
  }
}

// Hook para múltiplos clientes (para comparação ou operações em lote)
export function useMultipleClients(ids: string[]) {
  const queries = ids.map(id => 
    useQuery({
      queryKey: queryKeys.clients.detail(id),
      queryFn: () => fetchClientDetail(id),
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      enabled: !!id,
    })
  )

  return {
    clients: queries.map(q => q.data).filter(Boolean) as ClientDetail[],
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    errors: queries.map(q => q.error).filter(Boolean),
    allLoaded: queries.every(q => q.isSuccess),
  }
} 