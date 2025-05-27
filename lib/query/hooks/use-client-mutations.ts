import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { ClientFilters } from './use-clients'

// Tipos para mutations
interface CreateClientData {
  name: string
  industry?: string
  serviceOrProduct?: string
  initialObjective?: string
}

interface UpdateClientData {
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

// Hooks para mutations
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    onError: (error) => {
      console.error('Erro ao criar cliente:', error)
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateClient,
    onSuccess: (data, variables) => {
      // Invalidar queries específicas
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
    },
    onError: (error) => {
      console.error('Erro ao atualizar cliente:', error)
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    onError: (error) => {
      console.error('Erro ao deletar cliente:', error)
    },
  })
}

export function useRestoreClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreClient,
    onSuccess: () => {
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    onError: (error) => {
      console.error('Erro ao restaurar cliente:', error)
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