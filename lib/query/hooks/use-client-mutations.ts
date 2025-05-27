import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { ClientFilters } from './use-clients'

// Tipos para mutations
export interface CreateClientData {
  name: string
  industry?: string
  serviceOrProduct?: string
  initialObjective?: string
}

export interface UpdateClientData {
  id: string
  name?: string
  industry?: string
  serviceOrProduct?: string
  initialObjective?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  address?: string
  businessDetails?: string
  targetAudience?: string
  marketingObjectives?: string
  historyAndStrategies?: string
  challengesOpportunities?: string
  competitors?: string
  resourcesBudget?: string
  toneOfVoice?: string
  preferencesRestrictions?: string
  isViewed?: boolean
}

// Funções de API
async function createClient(data: CreateClientData) {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Erro ao criar cliente')
  }

  return response.json()
}

async function updateClient(data: UpdateClientData) {
  const { id, ...updateData } = data
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  })

  if (!response.ok) {
    throw new Error('Erro ao atualizar cliente')
  }

  return response.json()
}

async function deleteClient(id: string) {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Erro ao deletar cliente')
  }

  return response.json()
}

async function restoreClient(id: string) {
  const response = await fetch(`/api/clients/${id}/restore`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Erro ao restaurar cliente')
  }

  return response.json()
}

// Hooks para mutations com optimistic updates
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClient,
    // Optimistic update para criação
    onMutate: async (newClientData) => {
      // Cancelar queries em andamento para evitar conflitos
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.count() })

      // Snapshot dos dados atuais para rollback
      const previousClients = queryClient.getQueryData(queryKeys.clients.lists())
      const previousCount = queryClient.getQueryData(queryKeys.clients.count())

      // Criar cliente temporário para UI
      const tempClient = {
        id: `temp-${Date.now()}`,
        name: newClientData.name,
        industry: newClientData.industry || null,
        serviceOrProduct: newClientData.serviceOrProduct || null,
        initialObjective: newClientData.initialObjective || null,
        contactEmail: null,
        richnessScore: 25, // Score inicial estimado
        isViewed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: {
          notes: 0,
          attachments: 0,
        },
      }

      // Atualizar cache otimisticamente
      queryClient.setQueryData(queryKeys.clients.count(), (old: number = 0) => old + 1)

      // Retornar contexto para rollback
      return { previousClients, previousCount, tempClient }
    },
    onSuccess: (data, variables, context) => {
      // Invalidar queries para obter dados reais do servidor
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    onError: (error, variables, context) => {
      console.error('Erro ao criar cliente:', error)
      
      // Rollback em caso de erro
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients.lists(), context.previousClients)
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.clients.count(), context.previousCount)
      }
    },
    onSettled: () => {
      // Garantir que os dados estão atualizados
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateClient,
    // Optimistic update para atualização
    onMutate: async (updateData) => {
      const { id, ...updates } = updateData
      
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.detail(id) })

      // Snapshot dos dados atuais
      const previousClientLists = queryClient.getQueryData(queryKeys.clients.lists())
      const previousClientDetail = queryClient.getQueryData(queryKeys.clients.detail(id))

      // Atualizar cache otimisticamente
      queryClient.setQueriesData(
        { queryKey: queryKeys.clients.lists() },
        (old: any) => {
          if (!old?.clients) return old
          
          return {
            ...old,
            clients: old.clients.map((client: any) =>
              client.id === id
                ? { 
                    ...client, 
                    ...updates,
                    updatedAt: new Date().toISOString()
                  }
                : client
            ),
          }
        }
      )

      // Atualizar detalhe do cliente se existir
      queryClient.setQueryData(
        queryKeys.clients.detail(id),
        (old: any) => old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      )

      return { previousClientLists, previousClientDetail, id }
    },
    onSuccess: (data, variables, context) => {
      // Invalidar queries para obter dados reais
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
    },
    onError: (error, variables, context) => {
      console.error('Erro ao atualizar cliente:', error)
      
      // Rollback em caso de erro
      if (context?.previousClientLists) {
        queryClient.setQueriesData({ queryKey: queryKeys.clients.lists() }, context.previousClientLists)
      }
      if (context?.previousClientDetail && context?.id) {
        queryClient.setQueryData(queryKeys.clients.detail(context.id), context.previousClientDetail)
      }
    },
    onSettled: (data, error, variables) => {
      // Garantir sincronização
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClient,
    // Optimistic update para deleção
    onMutate: async (clientId) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.count() })
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.detail(clientId) })

      // Snapshot dos dados atuais
      const previousClientLists = queryClient.getQueryData(queryKeys.clients.lists())
      const previousCount = queryClient.getQueryData(queryKeys.clients.count())
      const previousClientDetail = queryClient.getQueryData(queryKeys.clients.detail(clientId))

      // Remover cliente otimisticamente das listas
      queryClient.setQueriesData(
        { queryKey: queryKeys.clients.lists() },
        (old: any) => {
          if (!old?.clients) return old
          
          return {
            ...old,
            clients: old.clients.filter((client: any) => client.id !== clientId),
            pagination: {
              ...old.pagination,
              totalCount: old.pagination.totalCount ? old.pagination.totalCount - 1 : 0,
            },
          }
        }
      )

      // Atualizar contador
      queryClient.setQueryData(queryKeys.clients.count(), (old: number = 0) => Math.max(0, old - 1))

      // Remover detalhe do cliente
      queryClient.removeQueries({ queryKey: queryKeys.clients.detail(clientId) })

      return { previousClientLists, previousCount, previousClientDetail, clientId }
    },
    onSuccess: (data, variables, context) => {
      // Invalidar queries para sincronizar com servidor
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    onError: (error, variables, context) => {
      console.error('Erro ao deletar cliente:', error)
      
      // Rollback em caso de erro
      if (context?.previousClientLists) {
        queryClient.setQueriesData({ queryKey: queryKeys.clients.lists() }, context.previousClientLists)
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.clients.count(), context.previousCount)
      }
      if (context?.previousClientDetail && context?.clientId) {
        queryClient.setQueryData(queryKeys.clients.detail(context.clientId), context.previousClientDetail)
      }
    },
    onSettled: () => {
      // Garantir sincronização final
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

export function useRestoreClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreClient,
    // Optimistic update para restauração
    onMutate: async (clientId) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.count() })

      // Snapshot dos dados atuais
      const previousClientLists = queryClient.getQueryData(queryKeys.clients.lists())
      const previousCount = queryClient.getQueryData(queryKeys.clients.count())

      // Atualizar contador (cliente restaurado volta para lista ativa)
      queryClient.setQueryData(queryKeys.clients.count(), (old: number = 0) => old + 1)

      // Nota: Para restauração, geralmente invalidamos as queries pois o cliente
      // pode não estar na lista atual (se estivermos vendo apenas ativos)
      // Mas mantemos o optimistic update do contador

      return { previousClientLists, previousCount, clientId }
    },
    onSuccess: (data, variables, context) => {
      // Invalidar todas as queries para refletir a restauração
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    onError: (error, variables, context) => {
      console.error('Erro ao restaurar cliente:', error)
      
      // Rollback do contador em caso de erro
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.clients.count(), context.previousCount)
      }
    },
    onSettled: () => {
      // Garantir sincronização completa
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

// Hook para invalidação manual
export function useInvalidateClients() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    invalidateList: (filters?: ClientFilters) => {
      if (filters) {
        queryClient.invalidateQueries({ queryKey: queryKeys.clients.list(filters) })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
      }
    },
    invalidateCount: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.count() })
    },
    invalidateDetail: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) })
    },
  }
}

// Hook combinado para operações de cliente com estados unificados
export function useClientOperations() {
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()
  const restoreMutation = useRestoreClient()
  const invalidate = useInvalidateClients()

  return {
    // Mutations
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    restore: restoreMutation,
    
    // Estados combinados
    isLoading: createMutation.isPending || updateMutation.isPending || 
               deleteMutation.isPending || restoreMutation.isPending,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    
    // Erros
    error: createMutation.error || updateMutation.error || 
           deleteMutation.error || restoreMutation.error,
    
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    restoreError: restoreMutation.error,
    
    // Sucessos
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess || 
               deleteMutation.isSuccess || restoreMutation.isSuccess,
    
    // Funções de invalidação
    invalidate,
    
    // Reset de estados
    reset: () => {
      createMutation.reset()
      updateMutation.reset()
      deleteMutation.reset()
      restoreMutation.reset()
    },
  }
}

// Hook para operações em lote (futuro)
export function useBulkClientOperations() {
  const queryClient = useQueryClient()
  
  // Função para deletar múltiplos clientes
  const bulkDelete = async (clientIds: string[]) => {
    const promises = clientIds.map(id => deleteClient(id))
    return Promise.all(promises)
  }
  
  // Função para restaurar múltiplos clientes
  const bulkRestore = async (clientIds: string[]) => {
    const promises = clientIds.map(id => restoreClient(id))
    return Promise.all(promises)
  }

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDelete,
    onMutate: async (clientIds) => {
      // Cancelar queries
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.count() })

      // Snapshot
      const previousData = queryClient.getQueryData(queryKeys.clients.lists())
      const previousCount = queryClient.getQueryData(queryKeys.clients.count())

      // Update otimístico
      queryClient.setQueriesData(
        { queryKey: queryKeys.clients.lists() },
        (old: any) => {
          if (!old?.clients) return old
          return {
            ...old,
            clients: old.clients.filter((client: any) => !clientIds.includes(client.id)),
            pagination: {
              ...old.pagination,
              totalCount: old.pagination.totalCount ? old.pagination.totalCount - clientIds.length : 0,
            },
          }
        }
      )

      queryClient.setQueryData(
        queryKeys.clients.count(), 
        (old: number = 0) => Math.max(0, old - clientIds.length)
      )

      return { previousData, previousCount }
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: queryKeys.clients.lists() }, context.previousData)
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.clients.count(), context.previousCount)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })

  const bulkRestoreMutation = useMutation({
    mutationFn: bulkRestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })

  return {
    bulkDelete: bulkDeleteMutation,
    bulkRestore: bulkRestoreMutation,
    isLoading: bulkDeleteMutation.isPending || bulkRestoreMutation.isPending,
  }
} 