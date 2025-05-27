// Hooks principais de clientes
export {
  useClients,
  type ClientFilters,
  type ClientsResponse,
} from './use-clients'

export {
  useClientsCount,
} from './use-clients-count'

// Hooks de mutations
export {
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useRestoreClient,
  useInvalidateClients,
  useClientOperations,
  useBulkClientOperations,
  type CreateClientData,
  type UpdateClientData,
} from './use-client-mutations'

// Hooks de detalhes
export {
  useClientDetail,
  useMultipleClients,
  type ClientDetail,
} from './use-client-detail'

// Hooks de UX e error handling
export {
  useErrorHandling,
  useLoadingStates,
  useNotifications,
  useClientUX,
  type ErrorInfo,
} from './use-error-handling'

// Re-export query keys e client
export { queryKeys } from '../keys'
export { queryClient, createQueryClient } from '../client' 