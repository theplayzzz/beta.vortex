import { prisma } from '@/lib/prisma/client'

export interface DatabaseHealthResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  latency: number
  timestamp: string
  error?: string
  connectionPool?: {
    open?: number
    busy?: number
    idle?: number
  }
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const start = Date.now()
  
  try {
    // Teste básico de conectividade
    await prisma.$queryRaw`SELECT 1 as health_check`
    const latency = Date.now() - start
    
    // Connection pool básico (sem métricas detalhadas)
    const connectionPool = {
      open: 1, // Assumir pelo menos 1 conexão ativa se o teste passou
      busy: 0,
      idle: 0
    }
    
    // Determinar status baseado na latência
    let status: 'healthy' | 'degraded' = 'healthy'
    if (latency > 3000) {
      status = 'degraded'
    }
    
    return {
      status,
      latency,
      timestamp: new Date().toISOString(),
      connectionPool
    }
    
  } catch (error: any) {
    const latency = Date.now() - start
    
    return {
      status: 'unhealthy',
      error: error.message,
      latency,
      timestamp: new Date().toISOString()
    }
  }
}

export async function logDatabaseHealth(): Promise<void> {
  const health = await checkDatabaseHealth()
  
  const logData = {
    timestamp: health.timestamp,
    status: health.status,
    latency: `${health.latency}ms`,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION || 'local',
    ...(health.connectionPool && { connectionPool: health.connectionPool }),
    ...(health.error && { error: health.error })
  }
  
  if (health.status === 'healthy') {
    console.log('🟢 [DB_HEALTH]', JSON.stringify(logData))
  } else if (health.status === 'degraded') {
    console.warn('🟡 [DB_HEALTH]', JSON.stringify(logData))
  } else {
    console.error('🔴 [DB_HEALTH]', JSON.stringify(logData))
  }
}

// Função para verificar se o banco está responsivo antes de operações críticas
export async function ensureDatabaseReady(timeoutMs: number = 5000): Promise<boolean> {
  const start = Date.now()
  
  while (Date.now() - start < timeoutMs) {
    try {
      const health = await checkDatabaseHealth()
      if (health.status === 'healthy' || health.status === 'degraded') {
        return true
      }
    } catch (error) {
      // Continuar tentando
    }
    
    // Aguardar 500ms antes da próxima tentativa
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return false
} 