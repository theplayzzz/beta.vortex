// Query Client e configuração
export { queryClient, clearQueryCache, invalidateQueries } from './queryClient';

// Query Keys
export { queryKeys } from './queryKeys';
export type { PlanningFilters, ClientFilters } from './queryKeys';

// Hooks de Planejamentos
export { usePlannings, usePlanning } from './hooks/usePlannings';
export type { PlanningWithClient, PlanningsResponse } from './hooks/usePlannings';

export { 
  useCreatePlanning, 
  useUpdatePlanning, 
  useDeletePlanning 
} from './hooks/usePlanningMutations';
export type { 
  CreatePlanningData, 
  UpdatePlanningData 
} from './hooks/usePlanningMutations';

// Hooks de Clientes
export { 
  useClients, 
  useClient, 
  useClientsCount, 
  useClientIndustries 
} from './hooks/useClients';
export type { Client, ClientsResponse } from './hooks/useClients';

export { 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient, 
  useRestoreClient, 
  useInvalidateClients 
} from './hooks/useClientMutations';
export type { 
  CreateClientData, 
  UpdateClientData 
} from './hooks/useClientMutations'; 