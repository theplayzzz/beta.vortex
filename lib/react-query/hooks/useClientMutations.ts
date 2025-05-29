import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import type { Client } from './useClients';

// Tipos para mutations
export interface CreateClientData {
  name: string;
  industry?: string;
  serviceOrProduct?: string;
  initialObjective?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  businessDetails?: string;
  targetAudience?: string;
  marketingObjectives?: string;
  historyAndStrategies?: string;
  challengesOpportunities?: string;
  competitors?: string;
  resourcesBudget?: string;
  toneOfVoice?: string;
  preferencesRestrictions?: string;
}

export interface UpdateClientData {
  id: string;
  name?: string;
  industry?: string;
  serviceOrProduct?: string;
  initialObjective?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  businessDetails?: string;
  targetAudience?: string;
  marketingObjectives?: string;
  historyAndStrategies?: string;
  challengesOpportunities?: string;
  competitors?: string;
  resourcesBudget?: string;
  toneOfVoice?: string;
  preferencesRestrictions?: string;
  isViewed?: boolean;
}

// Hook para criar cliente
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientData): Promise<{ client: Client }> => {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create client');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries de listagem de clientes
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.lists(),
      });
      
      // Invalidar contagem e indústrias
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.count(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.industries(),
      });
    },
  });
}

// Hook para atualizar cliente
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateClientData): Promise<{ client: Client }> => {
      const { id, ...updateData } = data;
      
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update client');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.lists(),
      });
      
      // Atualizar cache do cliente específico
      queryClient.setQueryData(
        queryKeys.clients.detail(data.client.id),
        data
      );
      
      // Se a indústria mudou, invalidar lista de indústrias
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.industries(),
      });
    },
  });
}

// Hook para deletar (arquivar) cliente
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete client');
      }
    },
    onSuccess: (_, deletedId) => {
      // Invalidar queries de listagem
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.lists(),
      });
      
      // Invalidar contagem
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.count(),
      });
      
      // Remover do cache o cliente deletado
      queryClient.removeQueries({
        queryKey: queryKeys.clients.detail(deletedId),
      });
    },
  });
}

// Hook para restaurar cliente
export function useRestoreClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ client: Client }> => {
      const response = await fetch(`/api/clients/${id}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore client');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar queries de listagem
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.lists(),
      });
      
      // Invalidar contagem
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.count(),
      });
      
      // Atualizar cache do cliente específico
      queryClient.setQueryData(
        queryKeys.clients.detail(data.client.id),
        data
      );
    },
  });
}

// Hook para invalidação manual (útil para refetch após operações externas)
export function useInvalidateClients() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
    invalidateList: (filters?: any) => {
      if (filters) {
        queryClient.invalidateQueries({ queryKey: queryKeys.clients.list(filters) });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
      }
    },
    invalidateCount: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.count() });
    },
    invalidateDetail: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) });
    },
    invalidateIndustries: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.industries() });
    },
  };
} 