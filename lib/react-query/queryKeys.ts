// Query Keys Hierarchy para TanStack Query
// Estrutura hierárquica para cache inteligente

export interface PlanningFilters {
  status?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientFilters {
  search?: string;
  industry?: string[];
  richnessScoreMin?: number;
  richnessScoreMax?: number;
  sortBy?: 'name' | 'richnessScore' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

export const queryKeys = {
  // Planejamentos
  plannings: {
    all: ['plannings'] as const,
    lists: () => [...queryKeys.plannings.all, 'list'] as const,
    list: (filters: PlanningFilters) => [...queryKeys.plannings.lists(), { filters }] as const,
    details: () => [...queryKeys.plannings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.plannings.details(), id] as const,
    stats: () => [...queryKeys.plannings.all, 'stats'] as const,
  },
  
  // Clientes
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: ClientFilters) => [...queryKeys.clients.lists(), { filters }] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    count: () => [...queryKeys.clients.all, 'count'] as const,
    industries: () => [...queryKeys.clients.all, 'industries'] as const,
    stats: () => [...queryKeys.clients.all, 'stats'] as const,
  },
  
  // Notes (relacionadas aos clientes)
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: (clientId: string) => [...queryKeys.notes.lists(), clientId] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
  },
  
  // Attachments (relacionadas aos clientes)
  attachments: {
    all: ['attachments'] as const,
    lists: () => [...queryKeys.attachments.all, 'list'] as const,
    list: (clientId: string) => [...queryKeys.attachments.lists(), clientId] as const,
    details: () => [...queryKeys.attachments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.attachments.details(), id] as const,
  },
  
  // Usuário
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },
  
  // Search (universal)
  search: {
    all: ['search'] as const,
    results: (query: string) => [...queryKeys.search.all, query] as const,
  },
} as const;

// Tipos para TypeScript
export type QueryKeys = typeof queryKeys;
export type PlanningQueryKey = ReturnType<typeof queryKeys.plannings.list>;
export type ClientQueryKey = ReturnType<typeof queryKeys.clients.list>; 