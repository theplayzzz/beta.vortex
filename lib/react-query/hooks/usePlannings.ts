import { useQuery } from '@tanstack/react-query';
import { queryKeys, type PlanningFilters } from '../queryKeys';

// Tipos para o retorno da API
export interface PlanningWithClient {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  Client: {
    id: string;
    name: string;
    industry?: string;
    richnessScore: number;
  };
}

export interface PlanningsResponse {
  plannings: PlanningWithClient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Função para buscar planejamentos
async function fetchPlannings(filters: PlanningFilters): Promise<PlanningsResponse> {
  const searchParams = new URLSearchParams();
  
  // Adicionar filtros aos query params
  if (filters.status) searchParams.set('status', filters.status);
  if (filters.clientId) searchParams.set('clientId', filters.clientId);
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.page) searchParams.set('page', filters.page.toString());
  if (filters.limit) searchParams.set('limit', filters.limit.toString());

  const response = await fetch(`/api/plannings?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch plannings');
  }
  
  return response.json();
}

// Hook principal para buscar planejamentos
export function usePlannings(filters: PlanningFilters = {}) {
  return useQuery({
    queryKey: queryKeys.plannings.list(filters),
    queryFn: () => fetchPlannings(filters),
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  });
}

// Hook para buscar planejamento específico
export function usePlanning(id: string) {
  return useQuery({
    queryKey: queryKeys.plannings.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/plannings/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch planning');
      }
      
      return response.json();
    },
    enabled: !!id, // Só executa se tiver ID
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
} 