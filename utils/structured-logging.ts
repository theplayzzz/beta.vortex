export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  event: string
  metadata: Record<string, any>
  environment: string
  region?: string
  userId?: string
  requestId?: string
}

export interface DatabaseLogMetadata {
  operation: string
  duration?: number
  connectionPoolStatus?: {
    open?: number
    busy?: number
    idle?: number
  }
  error?: string
  retryAttempt?: number
  totalRetries?: number
}

export interface ApprovalLogMetadata {
  userId: string
  email?: string
  approvalStatus: string
  previousStatus?: string
  moderatorId?: string
  autoApproval?: boolean
  webhookData?: any
  signupType?: string
  signupProvider?: string
}

export interface WebhookLogMetadata {
  webhookType: string
  url?: string
  statusCode?: number
  duration?: number
  retryAttempt?: number
  error?: string
  payload?: any
  clerkEventType?: string
  clerkUserId?: string
}

export class DatabaseLogger {
  private static createLogEntry(
    level: LogEntry['level'],
    event: string,
    metadata: DatabaseLogMetadata,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event: `database_${event}`,
      metadata: {
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local',
        ...metadata
      },
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      userId
    }
  }

  static logConnectionEvent(
    event: 'open' | 'close' | 'timeout' | 'error' | 'pool_exhausted',
    metadata: Omit<DatabaseLogMetadata, 'operation'>
  ) {
    const level = event === 'error' || event === 'timeout' || event === 'pool_exhausted' ? 'error' : 'info'
    const logEntry = this.createLogEntry(level, `connection_${event}`, {
      operation: 'connection_management',
      ...metadata
    })

    if (level === 'error') {
      console.error('🔴 [DB_CONNECTION]', JSON.stringify(logEntry))
    } else {
      console.log('🟢 [DB_CONNECTION]', JSON.stringify(logEntry))
    }
  }

  static logOperationEvent(
    event: 'start' | 'success' | 'retry' | 'failure',
    operation: string,
    metadata: Omit<DatabaseLogMetadata, 'operation'>,
    userId?: string
  ) {
    const level = event === 'failure' ? 'error' : event === 'retry' ? 'warn' : 'info'
    const logEntry = this.createLogEntry(level, `operation_${event}`, {
      operation,
      ...metadata
    }, userId)

    const icon = {
      start: '🚀',
      success: '✅',
      retry: '🔄',
      failure: '❌'
    }[event]

    if (level === 'error') {
      console.error(`${icon} [DB_OPERATION]`, JSON.stringify(logEntry))
    } else if (level === 'warn') {
      console.warn(`${icon} [DB_OPERATION]`, JSON.stringify(logEntry))
    } else {
      console.log(`${icon} [DB_OPERATION]`, JSON.stringify(logEntry))
    }
  }

  static logPerformanceMetrics(
    operation: string,
    duration: number,
    metadata: Omit<DatabaseLogMetadata, 'operation' | 'duration'> = {}
  ) {
    const level = duration > 3000 ? 'warn' : duration > 1000 ? 'info' : 'debug'
    const logEntry = this.createLogEntry(level, 'performance_metrics', {
      operation,
      duration,
      ...metadata
    })

    const icon = duration > 3000 ? '🐌' : duration > 1000 ? '⏱️' : '⚡'
    
    if (level === 'warn') {
      console.warn(`${icon} [DB_PERFORMANCE]`, JSON.stringify(logEntry))
    } else if (level === 'info') {
      console.log(`${icon} [DB_PERFORMANCE]`, JSON.stringify(logEntry))
    } else if (process.env.NODE_ENV === 'development') {
      console.debug(`${icon} [DB_PERFORMANCE]`, JSON.stringify(logEntry))
    }
  }
}

export class ApprovalLogger {
  private static createLogEntry(
    level: LogEntry['level'],
    event: string,
    metadata: ApprovalLogMetadata
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event: `approval_${event}`,
      metadata: {
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local',
        ...metadata
      },
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      userId: metadata.userId
    }
  }

  static logApprovalEvent(
    event: 'user_created' | 'auto_approved' | 'manual_approved' | 'rejected' | 'suspended' | 'status_synced',
    metadata: ApprovalLogMetadata
  ) {
    const level = event === 'rejected' || event === 'suspended' ? 'warn' : 'info'
    const logEntry = this.createLogEntry(level, event, metadata)

    const icon = {
      user_created: '👤',
      auto_approved: '🤖',
      manual_approved: '👨‍💼',
      rejected: '❌',
      suspended: '⏸️',
      status_synced: '🔄'
    }[event]

    if (level === 'warn') {
      console.warn(`${icon} [APPROVAL]`, JSON.stringify(logEntry))
    } else {
      console.log(`${icon} [APPROVAL]`, JSON.stringify(logEntry))
    }
  }

  static logWebhookApprovalEvent(
    event: 'webhook_check_start' | 'webhook_check_success' | 'webhook_check_failure' | 'webhook_auto_approved',
    metadata: ApprovalLogMetadata & { webhookDuration?: number; webhookError?: string }
  ) {
    const level = event === 'webhook_check_failure' ? 'error' : 'info'
    const logEntry = this.createLogEntry(level, event, metadata)

    const icon = {
      webhook_check_start: '🔍',
      webhook_check_success: '✅',
      webhook_check_failure: '❌',
      webhook_auto_approved: '🎉'
    }[event]

    if (level === 'error') {
      console.error(`${icon} [WEBHOOK_APPROVAL]`, JSON.stringify(logEntry))
    } else {
      console.log(`${icon} [WEBHOOK_APPROVAL]`, JSON.stringify(logEntry))
    }
  }
}

export class WebhookLogger {
  private static createLogEntry(
    level: LogEntry['level'],
    event: string,
    metadata: WebhookLogMetadata,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event: `webhook_${event}`,
      metadata: {
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local',
        ...metadata
      },
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      userId
    }
  }

  static logWebhookEvent(
    event: 'request_start' | 'request_success' | 'request_retry' | 'request_failure' | 'timeout',
    metadata: WebhookLogMetadata,
    userId?: string
  ) {
    const level = event === 'request_failure' || event === 'timeout' ? 'error' : 
                  event === 'request_retry' ? 'warn' : 'info'
    
    const logEntry = this.createLogEntry(level, event, metadata, userId)

    const icon = {
      request_start: '📤',
      request_success: '✅',
      request_retry: '🔄',
      request_failure: '❌',
      timeout: '⏰'
    }[event]

    if (level === 'error') {
      console.error(`${icon} [WEBHOOK]`, JSON.stringify(logEntry))
    } else if (level === 'warn') {
      console.warn(`${icon} [WEBHOOK]`, JSON.stringify(logEntry))
    } else {
      console.log(`${icon} [WEBHOOK]`, JSON.stringify(logEntry))
    }
  }

  static logClerkWebhookEvent(
    event: 'received' | 'processed' | 'failed',
    clerkEventType: string,
    metadata: Omit<WebhookLogMetadata, 'webhookType'> & { clerkUserId?: string; clerkEventType?: string },
    userId?: string
  ) {
    const level = event === 'failed' ? 'error' : 'info'
    const logEntry = this.createLogEntry(level, `clerk_${event}`, {
      webhookType: 'clerk',
      ...metadata,
      clerkEventType
    }, userId)

    const icon = {
      received: '📨',
      processed: '✅',
      failed: '❌'
    }[event]

    if (level === 'error') {
      console.error(`${icon} [CLERK_WEBHOOK]`, JSON.stringify(logEntry))
    } else {
      console.log(`${icon} [CLERK_WEBHOOK]`, JSON.stringify(logEntry))
    }
  }
}

export class PerformanceLogger {
  private static performanceMetrics = new Map<string, {
    count: number
    totalDuration: number
    maxDuration: number
    minDuration: number
    errors: number
  }>()

  static startTimer(operationId: string): () => number {
    const startTime = Date.now()
    
    return () => {
      const duration = Date.now() - startTime
      this.recordMetric(operationId, duration)
      return duration
    }
  }

  private static recordMetric(operationId: string, duration: number, isError: boolean = false) {
    const existing = this.performanceMetrics.get(operationId) || {
      count: 0,
      totalDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      errors: 0
    }

    existing.count++
    existing.totalDuration += duration
    existing.maxDuration = Math.max(existing.maxDuration, duration)
    existing.minDuration = Math.min(existing.minDuration, duration)
    if (isError) existing.errors++

    this.performanceMetrics.set(operationId, existing)
  }

  static recordError(operationId: string, duration: number) {
    this.recordMetric(operationId, duration, true)
  }

  static getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {}
    
    this.performanceMetrics.forEach((data, operationId) => {
      metrics[operationId] = {
        count: data.count,
        averageDuration: Math.round(data.totalDuration / data.count),
        maxDuration: data.maxDuration,
        minDuration: data.minDuration === Infinity ? 0 : data.minDuration,
        errorRate: data.errors / data.count,
        totalErrors: data.errors
      }
    })
    
    return metrics
  }

  static resetMetrics() {
    this.performanceMetrics.clear()
  }

  static logPerformanceSummary() {
    const metrics = this.getMetrics()
    
    console.log('📊 [PERFORMANCE_SUMMARY]', JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'performance_summary',
      metadata: {
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local',
        metrics
      }
    }))
  }
}

// Função utilitária para criar logs estruturados customizados
export function createStructuredLog(
  level: LogEntry['level'],
  event: string,
  metadata: Record<string, any> = {},
  userId?: string
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    metadata: {
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      ...metadata
    },
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION || 'local',
    userId
  }
}

// Middleware para logging automático de requests
export function withRequestLogging<T>(
  operation: () => Promise<T>,
  operationName: string,
  userId?: string
): Promise<T> {
  const timer = PerformanceLogger.startTimer(operationName)
  
  DatabaseLogger.logOperationEvent('start', operationName, {}, userId)
  
  return operation()
    .then(result => {
      const duration = timer()
      DatabaseLogger.logOperationEvent('success', operationName, { duration }, userId)
      DatabaseLogger.logPerformanceMetrics(operationName, duration)
      return result
    })
    .catch(error => {
      const duration = timer()
      PerformanceLogger.recordError(operationName, duration)
      DatabaseLogger.logOperationEvent('failure', operationName, { 
        duration, 
        error: error.message 
      }, userId)
      throw error
    })
} 