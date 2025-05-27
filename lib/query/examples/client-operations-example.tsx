// Exemplo de uso dos hooks implementados na Fase 3
// Este arquivo serve como documentação e referência

import React from 'react'
import {
  useClients,
  useClientOperations,
  useClientDetail,
  useClientUX,
  useBulkClientOperations,
  type ClientFilters,
} from '../hooks'

// Exemplo 1: Listagem de clientes com filtros
export function ClientListExample() {
  const [filters, setFilters] = React.useState<ClientFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const {
    data: clientsData,
    isLoading,
    isError,
    error,
  } = useClients(filters)

  if (isLoading) return <div>Carregando clientes...</div>
  if (isError) return <div>Erro: {error?.message}</div>

  return (
    <div>
      <h2>Clientes ({clientsData?.pagination.totalCount || 0})</h2>
      {clientsData?.clients.map(client => (
        <div key={client.id}>
          <h3>{client.name}</h3>
          <p>Setor: {client.industry || 'Não informado'}</p>
          <p>Score: {client.richnessScore}%</p>
        </div>
      ))}
    </div>
  )
}

// Exemplo 2: Operações CRUD com optimistic updates
export function ClientOperationsExample() {
  const {
    create,
    update,
    delete: deleteClient,
    restore,
    isLoading,
    error,
    reset,
  } = useClientOperations()

  const handleCreateClient = async () => {
    try {
      await create.mutateAsync({
        name: 'Novo Cliente',
        industry: 'Tecnologia',
        serviceOrProduct: 'Software',
      })
      console.log('Cliente criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
    }
  }

  const handleUpdateClient = async (id: string) => {
    try {
      await update.mutateAsync({
        id,
        name: 'Cliente Atualizado',
        industry: 'Tecnologia Avançada',
      })
      console.log('Cliente atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
    }
  }

  return (
    <div>
      <h2>Operações de Cliente</h2>
      
      <button 
        onClick={handleCreateClient}
        disabled={isLoading}
      >
        {create.isPending ? 'Criando...' : 'Criar Cliente'}
      </button>

      <button 
        onClick={() => handleUpdateClient('client-id')}
        disabled={isLoading}
      >
        {update.isPending ? 'Atualizando...' : 'Atualizar Cliente'}
      </button>

      {error && (
        <div style={{ color: 'red' }}>
          Erro: {error.message}
          <button onClick={reset}>Limpar Erro</button>
        </div>
      )}
    </div>
  )
}

// Exemplo 3: Detalhes de cliente específico
export function ClientDetailExample({ clientId }: { clientId: string }) {
  const {
    client,
    isLoading,
    isError,
    error,
    updateClient,
    deleteClient,
    markAsViewed,
    isUpdating,
    isDeleting,
    isArchived,
  } = useClientDetail(clientId)

  React.useEffect(() => {
    // Marcar como visualizado quando carregar
    if (client && !client.isViewed) {
      markAsViewed()
    }
  }, [client, markAsViewed])

  if (isLoading) return <div>Carregando cliente...</div>
  if (isError) return <div>Erro: {error?.message}</div>
  if (!client) return <div>Cliente não encontrado</div>

  return (
    <div>
      <h2>{client.name}</h2>
      <p>Setor: {client.industry || 'Não informado'}</p>
      <p>Score de Riqueza: {client.richnessScore}%</p>
      <p>Status: {isArchived ? 'Arquivado' : 'Ativo'}</p>
      
      <div>
        <button 
          onClick={() => updateClient({ name: 'Nome Atualizado' })}
          disabled={isUpdating}
        >
          {isUpdating ? 'Atualizando...' : 'Atualizar Nome'}
        </button>

        <button 
          onClick={deleteClient}
          disabled={isDeleting}
          style={{ marginLeft: '10px' }}
        >
          {isDeleting ? 'Deletando...' : 'Deletar Cliente'}
        </button>
      </div>
    </div>
  )
}

// Exemplo 4: UX completa com error handling e notifications
export function ClientUXExample() {
  const {
    handleOperation,
    notifications,
    errors,
    isLoading,
    clearErrors,
    removeNotification,
  } = useClientUX()

  const createClientWithUX = async () => {
    await handleOperation(
      async () => {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Cliente com UX',
            industry: 'Exemplo',
          }),
        })
        
        if (!response.ok) {
          throw new Error('Falha ao criar cliente')
        }
        
        return response.json()
      },
      {
        loadingKey: 'create-client',
        successMessage: 'Cliente criado com sucesso!',
        errorMessage: 'Erro ao criar cliente',
      }
    )
  }

  return (
    <div>
      <h2>UX Completa</h2>
      
      <button 
        onClick={createClientWithUX}
        disabled={isLoading('create-client')}
      >
        {isLoading('create-client') ? 'Criando...' : 'Criar Cliente'}
      </button>

      {/* Exibir notificações */}
      <div style={{ position: 'fixed', top: '20px', right: '20px' }}>
        {notifications.map(notification => (
          <div 
            key={notification.id}
            style={{
              padding: '10px',
              margin: '5px 0',
              backgroundColor: notification.type === 'success' ? 'green' : 'red',
              color: 'white',
              borderRadius: '4px',
            }}
          >
            <strong>{notification.title}</strong>
            {notification.message && <p>{notification.message}</p>}
            <button onClick={() => removeNotification(notification.id)}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Exibir erros */}
      {errors.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Erros:</h3>
          {errors.map((error, index) => (
            <div key={index} style={{ color: 'red', margin: '5px 0' }}>
              {error.message} ({error.type})
            </div>
          ))}
          <button onClick={clearErrors}>Limpar Erros</button>
        </div>
      )}
    </div>
  )
}

// Exemplo 5: Operações em lote
export function BulkOperationsExample() {
  const { bulkDelete, bulkRestore, isLoading } = useBulkClientOperations()
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    try {
      await bulkDelete.mutateAsync(selectedIds)
      setSelectedIds([])
      console.log('Clientes deletados em lote!')
    } catch (error) {
      console.error('Erro ao deletar clientes:', error)
    }
  }

  return (
    <div>
      <h2>Operações em Lote</h2>
      
      <p>Clientes selecionados: {selectedIds.length}</p>
      
      <button 
        onClick={handleBulkDelete}
        disabled={isLoading || selectedIds.length === 0}
      >
        {bulkDelete.isPending ? 'Deletando...' : 'Deletar Selecionados'}
      </button>
    </div>
  )
}

// Hook personalizado combinando múltiplas funcionalidades
export function useClientManagement() {
  const operations = useClientOperations()
  const ux = useClientUX()
  
  const createClientWithFeedback = async (data: any) => {
    return ux.handleOperation(
      () => operations.create.mutateAsync(data),
      {
        loadingKey: 'create-client',
        successMessage: 'Cliente criado com sucesso!',
        errorMessage: 'Erro ao criar cliente',
      }
    )
  }

  const updateClientWithFeedback = async (data: any) => {
    return ux.handleOperation(
      () => operations.update.mutateAsync(data),
      {
        loadingKey: 'update-client',
        successMessage: 'Cliente atualizado com sucesso!',
        errorMessage: 'Erro ao atualizar cliente',
      }
    )
  }

  return {
    ...operations,
    ...ux,
    createClientWithFeedback,
    updateClientWithFeedback,
  }
} 