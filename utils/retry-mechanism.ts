export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: any) => boolean
  onRetry?: (error: any, attempt: number) => void
}

export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: any
  attempts: number
  totalTime: number
}

/**
 * Executa uma operação com retry automático usando exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => 
      error.code === 'P2024' || // Connection timeout
      error.code === 'P1001' || // Database unreachable
      error.code === 'P2034' || // Transaction conflict
      error.message?.includes('timeout') ||
      error.message?.includes('connection') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ENOTFOUND'),
    onRetry
  } = options

  let lastError: any
  const startTime = Date.now()
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      
      // Log sucesso se houve tentativas anteriores
      if (attempt > 0) {
        console.log(`✅ [RETRY] Operação bem-sucedida na tentativa ${attempt + 1}/${maxRetries + 1}`)
      }
      
      return result
      
    } catch (error: any) {
      lastError = error
      
      // Se é a última tentativa ou erro não é retryable, falhar
      if (attempt === maxRetries || !retryCondition(error)) {
        if (attempt === maxRetries) {
          console.error(`❌ [RETRY] Todas as ${maxRetries + 1} tentativas falharam. Último erro:`, error.message)
        }
        throw error
      }
      
      // Calcular delay com exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
      
      console.log(`🔄 [RETRY] Tentativa ${attempt + 1}/${maxRetries + 1} falhou, tentando novamente em ${delay}ms:`, error.message)
      
      // Callback opcional para cada retry
      if (onRetry) {
        onRetry(error, attempt + 1)
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Versão do withRetry que retorna resultado detalhado ao invés de throw
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now()
  let attempts = 0
  
  try {
    const result = await withRetry(async () => {
      attempts++
      return await operation()
    }, {
      ...options,
      onRetry: (error, attempt) => {
        attempts = attempt
        options.onRetry?.(error, attempt)
      }
    })
    
    return {
      success: true,
      result,
      attempts,
      totalTime: Date.now() - startTime
    }
    
  } catch (error) {
    return {
      success: false,
      error,
      attempts,
      totalTime: Date.now() - startTime
    }
  }
}

/**
 * Retry específico para operações de banco de dados
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  return withRetry(operation, {
    maxRetries: 3,
    baseDelay: 1500,
    maxDelay: 8000,
    backoffFactor: 2,
    retryCondition: (error) => {
      // Condições específicas para erros de banco
      const retryableCodes = ['P2024', 'P1001', 'P2034', 'P1017']
      const retryableMessages = [
        'timeout',
        'connection',
        'ECONNRESET',
        'ENOTFOUND',
        'pool',
        'database',
        'server'
      ]
      
      return retryableCodes.includes(error.code) ||
             retryableMessages.some(msg => error.message?.toLowerCase().includes(msg.toLowerCase()))
    },
    onRetry: (error, attempt) => {
      console.warn(`🔄 [DB_RETRY] ${operationName} - Tentativa ${attempt} falhou:`, {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      })
    }
  })
}

/**
 * Retry específico para webhooks externos
 */
export async function withWebhookRetry<T>(
  operation: () => Promise<T>,
  webhookName: string = 'webhook'
): Promise<T> {
  return withRetry(operation, {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 6000,
    backoffFactor: 1.5,
    retryCondition: (error) => {
      // Condições específicas para webhooks
      return error.name === 'AbortError' ||
             error.message?.includes('timeout') ||
             error.message?.includes('fetch') ||
             error.message?.includes('network') ||
             (error.status >= 500 && error.status < 600) // Server errors
    },
    onRetry: (error, attempt) => {
      console.warn(`🔄 [WEBHOOK_RETRY] ${webhookName} - Tentativa ${attempt} falhou:`, {
        error: error.message,
        status: error.status,
        timestamp: new Date().toISOString()
      })
    }
  })
} 