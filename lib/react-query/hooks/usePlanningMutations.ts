import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import type { PlanningWithClient } from './usePlannings';

// Tipos para as mutations
export interface CreatePlanningData {
  title: string;
  description?: string;
  clientId: string;
  formDataJSON?: any;
  clientSnapshot?: any;
}

export interface UpdatePlanningData {
  title?: string;
  description?: string;
  specificObjectives?: string;
  scope?: string;
  successMetrics?: string;
  budget?: string;
  toneOfVoice?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  formDataJSON?: any;
  clientSnapshot?: any;
}

// Hook para criar planejamento
export function useCreatePlanning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlanningData): Promise<PlanningWithClient> => {
      const response = await fetch('/api/plannings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create planning');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries de listagem de planejamentos
      queryClient.invalidateQueries({
        queryKey: queryKeys.plannings.lists(),
      });
    },
  });
}

// Hook para atualizar planejamento
export function useUpdatePlanning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: UpdatePlanningData 
    }): Promise<PlanningWithClient> => {
      const response = await fetch(`/api/plannings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update planning');
      }

      return response.json();
    },
    onSuccess: (updatedPlanning) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.plannings.lists(),
      });
      
      // Atualizar cache do planejamento específico
      queryClient.setQueryData(
        queryKeys.plannings.detail(updatedPlanning.id),
        updatedPlanning
      );
    },
  });
}

// Hook para deletar planejamento
export function useDeletePlanning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/plannings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete planning');
      }
    },
    onSuccess: (_, deletedId) => {
      // Invalidar queries de listagem
      queryClient.invalidateQueries({
        queryKey: queryKeys.plannings.lists(),
      });
      
      // Remover do cache o planejamento deletado
      queryClient.removeQueries({
        queryKey: queryKeys.plannings.detail(deletedId),
      });
    },
  });
} 