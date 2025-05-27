import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

// Tipos para diferentes tipos de erro
export interface ErrorInfo {
  type: 'network' | 'validation' | 'authorization' | 'server' | 'unknown'
  message: string
  code?: string | number
  details?: any
  timestamp: Date
}

// Hook para gerenciamento de erros
export function useErrorHandling() {
  const [errors, setErrors] = useState<ErrorInfo[]>([])
  const queryClient = useQueryClient()

  // Função para processar erros
  const processError = useCallback((error: any): ErrorInfo => {
    const timestamp = new Date()
    
    // Erro de rede
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Erro de conexão. Verifique sua internet.',
        timestamp,
      }
    }
    
    // Erro de resposta HTTP
    if (error.status) {
      switch (error.status) {
        case 401:
          return {
            type: 'authorization',
            message: 'Sessão expirada. Faça login novamente.',
            code: 401,
            timestamp,
          }
        case 403:
          return {
            type: 'authorization',
            message: 'Você não tem permissão para esta ação.',
            code: 403,
            timestamp,
          }
        case 422:
          return {
            type: 'validation',
            message: 'Dados inválidos. Verifique os campos.',
            code: 422,
            details: error.details,
            timestamp,
          }
        case 500:
          return {
            type: 'server',
            message: 'Erro interno do servidor. Tente novamente.',
            code: 500,
            timestamp,
          }
        default:
          return {
            type: 'unknown',
            message: error.message || 'Erro desconhecido',
            code: error.status,
            timestamp,
          }
      }
    }
    
    // Erro genérico
    return {
      type: 'unknown',
      message: error.message || 'Erro inesperado',
      timestamp,
    }
  }, [])

  // Adicionar erro
  const addError = useCallback((error: any) => {
    const errorInfo = processError(error)
    setErrors(prev => [errorInfo, ...prev.slice(0, 4)]) // Manter apenas 5 erros
  }, [processError])

  // Remover erro
  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Limpar todos os erros
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Retry de queries falhadas
  const retryFailedQueries = useCallback(() => {
    queryClient.refetchQueries({
      type: 'all',
      stale: true,
    })
  }, [queryClient])

  // Verificar se há erros de um tipo específico
  const hasErrorType = useCallback((type: ErrorInfo['type']) => {
    return errors.some(error => error.type === type)
  }, [errors])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    retryFailedQueries,
    hasErrorType,
    hasErrors: errors.length > 0,
    latestError: errors[0] || null,
  }
}

// Hook para loading states avançados
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean)
  }, [loadingStates])

  const clearLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const { [key]: _, ...rest } = prev
        return rest
      })
    } else {
      setLoadingStates({})
    }
  }, [])

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    loadingStates,
  }
}

// Hook para toast notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
    timestamp: Date
  }>>([])

  const addNotification = useCallback((notification: {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
  }) => {
    const id = `notification-${Date.now()}-${Math.random()}`
    const newNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || 5000,
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)])

    // Auto-remove após duração especificada
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Helpers para tipos específicos
  const success = useCallback((title: string, message?: string) => {
    return addNotification({ type: 'success', title, message })
  }, [addNotification])

  const error = useCallback((title: string, message?: string) => {
    return addNotification({ type: 'error', title, message, duration: 8000 })
  }, [addNotification])

  const warning = useCallback((title: string, message?: string) => {
    return addNotification({ type: 'warning', title, message })
  }, [addNotification])

  const info = useCallback((title: string, message?: string) => {
    return addNotification({ type: 'info', title, message })
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info,
  }
}

// Hook combinado para UX completa
export function useClientUX() {
  const errorHandling = useErrorHandling()
  const loadingStates = useLoadingStates()
  const notifications = useNotifications()

  return {
    ...errorHandling,
    ...loadingStates,
    ...notifications,
    
    // Função helper para operações completas
    handleOperation: async <T>(
      operation: () => Promise<T>,
      options: {
        loadingKey?: string
        successMessage?: string
        errorMessage?: string
      } = {}
    ): Promise<T | null> => {
      const { loadingKey = 'default', successMessage, errorMessage } = options
      
      try {
        loadingStates.setLoading(loadingKey, true)
        const result = await operation()
        
        if (successMessage) {
          notifications.success(successMessage)
        }
        
        return result
      } catch (error) {
        errorHandling.addError(error)
        
        if (errorMessage) {
          notifications.error(errorMessage)
        }
        
        return null
      } finally {
        loadingStates.setLoading(loadingKey, false)
      }
    },
  }
} 