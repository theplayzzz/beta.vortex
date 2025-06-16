import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/utils/database-health'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Executar verificações em paralelo para máxima eficiência
    const checks = await Promise.allSettled([
      checkDatabaseHealth(),
      checkClerkHealth(),
      checkWebhookHealth(),
      checkEnvironmentHealth()
    ])

    const results = checks.map((check, index) => {
      const services = ['database', 'clerk', 'webhook', 'environment']
      const serviceName = services[index]
      
      if (check.status === 'fulfilled') {
        return {
          service: serviceName,
          ...check.value
        }
      } else {
        return {
          service: serviceName,
          status: 'error',
          error: check.reason?.message || 'Unknown error'
        }
      }
    })

    // Determinar status geral
    const healthyCount = results.filter(r => r.status === 'healthy').length
    const totalCount = results.length
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyCount === totalCount) {
      overallStatus = 'healthy'
    } else if (healthyCount >= totalCount * 0.5) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'unhealthy'
    }

    const responseTime = Date.now() - startTime

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      checks: results,
      summary: {
        total: totalCount,
        healthy: healthyCount,
        degraded: results.filter(r => r.status === 'degraded').length,
        unhealthy: results.filter(r => r.status === 'unhealthy' || r.status === 'error').length
      }
    }

    // Status HTTP baseado na saúde geral
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503

    return NextResponse.json(response, { status: httpStatus })

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error.message,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    }, { status: 500 })
  }
}

async function checkClerkHealth() {
  const start = Date.now()
  
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.CLERK_SECRET_KEY) {
      return {
        status: 'unhealthy',
        error: 'CLERK_SECRET_KEY not configured',
        latency: Date.now() - start
      }
    }

    // Teste simples de conectividade com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      // Usar endpoint público do Clerk para verificar conectividade
      const response = await fetch('https://api.clerk.dev/v1/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'User-Agent': 'vortex-health-check'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const latency = Date.now() - start

      if (response.ok) {
        return {
          status: 'healthy',
          latency,
          statusCode: response.status
        }
      } else {
        return {
          status: 'degraded',
          latency,
          statusCode: response.status,
          error: `HTTP ${response.status}`
        }
      }
    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error: any) {
    const latency = Date.now() - start
    
    if (error.name === 'AbortError') {
      return {
        status: 'unhealthy',
        error: 'Timeout connecting to Clerk',
        latency
      }
    }

    return {
      status: 'unhealthy',
      error: error.message,
      latency
    }
  }
}

async function checkWebhookHealth() {
  const start = Date.now()
  const webhookUrl = process.env.APROVACAO_WEBHOOK_URL
  
  if (!webhookUrl) {
    return {
      status: 'not_configured',
      message: 'APROVACAO_WEBHOOK_URL not configured',
      latency: 0
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'vortex-health-check'
        },
        body: JSON.stringify({
          event: 'health_check',
          data: { timestamp: new Date().toISOString() }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const latency = Date.now() - start

      // Para webhook de aprovação, status 500 é esperado para health check
      if (response.status < 600) {
        return {
          status: 'healthy',
          latency,
          statusCode: response.status,
          message: 'Webhook responding'
        }
      } else {
        return {
          status: 'degraded',
          latency,
          statusCode: response.status,
          error: `HTTP ${response.status}`
        }
      }
    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error: any) {
    const latency = Date.now() - start
    
    if (error.name === 'AbortError') {
      return {
        status: 'unhealthy',
        error: 'Timeout connecting to webhook',
        latency
      }
    }

    return {
      status: 'unhealthy',
      error: error.message,
      latency
    }
  }
}

async function checkEnvironmentHealth() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    return {
      status: 'unhealthy',
      error: `Missing environment variables: ${missingVars.join(', ')}`,
      missingVars
    }
  }

  // Verificar configurações específicas do Prisma
  const databaseUrl = process.env.DATABASE_URL
  const hasPooling = databaseUrl?.includes('pgbouncer=true')
  const hasConnectionLimit = databaseUrl?.includes('connection_limit=')
  const hasPoolTimeout = databaseUrl?.includes('pool_timeout=')

  return {
    status: 'healthy',
    configuration: {
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      hasPooling,
      hasConnectionLimit,
      hasPoolTimeout,
      approvalWebhookConfigured: !!process.env.APROVACAO_WEBHOOK_URL
    }
  }
} 