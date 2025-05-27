// Query keys padronizadas para TanStack Query
// Seguindo o padrão hierárquico recomendado

export const queryKeys = {
  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    count: () => [...queryKeys.clients.all, 'count'] as const,
    industries: () => [...queryKeys.clients.all, 'industries'] as const,
  },
  
  // Notes
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: (clientId: string) => [...queryKeys.notes.lists(), clientId] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
  },
  
  // Attachments
  attachments: {
    all: ['attachments'] as const,
    lists: () => [...queryKeys.attachments.all, 'list'] as const,
    list: (clientId: string) => [...queryKeys.attachments.lists(), clientId] as const,
    details: () => [...queryKeys.attachments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.attachments.details(), id] as const,
  },
  
  // Search
  search: {
    all: ['search'] as const,
    results: (query: string) => [...queryKeys.search.all, query] as const,
  },
} as const

// Tipos para TypeScript
export type QueryKeys = typeof queryKeys 