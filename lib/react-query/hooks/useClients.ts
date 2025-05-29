import { useQuery } from '@tanstack/react-query';
import { queryKeys, type ClientFilters } from '../queryKeys';

// Tipos para clientes
export interface Client {
  id: string;
  name: string;
  industry: string | null;
  serviceOrProduct: string | null;
  initialObjective: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  address: string | null;
  businessDetails: string | null;
  targetAudience: string | null;
  marketingObjectives: string | null;
  historyAndStrategies: string | null;
  challengesOpportunities: string | null;
  competitors: string | null;
  resourcesBudget: string | null;
  toneOfVoice: string | null;
  preferencesRestrictions: string | null;
  richnessScore: number;
  isViewed: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count?: {
    notes: number;
    attachments: number;
    strategicPlannings: number;
    tasks: number;
  };
}

export interface ClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number | null;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    industries: string[];
    appliedFilters: ClientFilters;
  };
}

// Função para buscar clientes
async function fetchClients(filters: ClientFilters): Promise<ClientsResponse> {
  const searchParams = new URLSearchParams();
  
  // Adicionar filtros aos query params
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.industry && filters.industry.length > 0) {
    filters.industry.forEach(ind => searchParams.append('industry', ind));
  }
  if (filters.richnessScoreMin !== undefined) {
    searchParams.set('richnessScoreMin', filters.richnessScoreMin.toString());
  }
  if (filters.richnessScoreMax !== undefined) {
    searchParams.set('richnessScoreMax', filters.richnessScoreMax.toString());
  }
  if (filters.sortBy) searchParams.set('sortBy', filters.sortBy);
  if (filters.sortOrder) searchParams.set('sortOrder', filters.sortOrder);
  if (filters.page) searchParams.set('page', filters.page.toString());
  if (filters.limit) searchParams.set('limit', filters.limit.toString());
  if (filters.includeArchived) searchParams.set('includeArchived', 'true');

  const response = await fetch(`/api/clients?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  
  return response.json();
}

// Hook principal para buscar clientes
export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => fetchClients(filters),
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  });
}

// Hook para buscar cliente específico
export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      
      return response.json();
    },
    enabled: !!id, // Só executa se tiver ID
    staleTime: 2 * 60 * 1000,  // 2 minutos para detalhes
    gcTime: 10 * 60 * 1000,
  });
}

// Hook para contagem de clientes
export function useClientsCount() {
  return useQuery({
    queryKey: queryKeys.clients.count(),
    queryFn: async () => {
      const response = await fetch('/api/clients?limit=1');
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients count');
      }
      
      const data = await response.json();
      return data.pagination?.totalCount || 0;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook para listar indústrias disponíveis
export function useClientIndustries() {
  return useQuery({
    queryKey: queryKeys.clients.industries(),
    queryFn: async () => {
      const response = await fetch('/api/clients?limit=1'); // Só para pegar as indústrias
      
      if (!response.ok) {
        throw new Error('Failed to fetch industries');
      }
      
      const data = await response.json();
      return data.filters?.industries || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - indústrias mudam pouco
    gcTime: 30 * 60 * 1000,
  });
} 