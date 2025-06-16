import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { prisma } from '@/lib/prisma/client'
import { withRetry, withDatabaseRetry, withWebhookRetry } from '@/utils/retry-mechanism'
import { checkDatabaseHealth } from '@/utils/database-health'

describe('Connection Pool Tests', () => {
  beforeAll(async () => {
    // Garantir que o banco está acessível antes dos testes
    const health = await checkDatabaseHealth()
    if (health.status === 'unhealthy') {
      throw new Error(`Database unhealthy: ${health.error}`)
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('should handle concurrent requests without timeout', async () => {
    const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
      prisma.user.findFirst({ 
        where: { email: `test-concurrent-${i}@example.com` },
        select: { id: true, email: true }
      })
    )

    const start = Date.now()
    const results = await Promise.allSettled(concurrentRequests)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(5000) // Menos de 5 segundos
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(0)
    
    console.log(`✅ Concurrent requests completed in ${duration}ms`)
  }, 10000)

  test('should recover from connection timeout with retry', async () => {
    const result = await withDatabaseRetry(async () => {
      return await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`
    }, 'test query')

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect((result as any)[0]).toHaveProperty('test', 1)
  })

  test('should handle database health check', async () => {
    const health = await checkDatabaseHealth()
    
    expect(health).toHaveProperty('status')
    expect(health).toHaveProperty('latency')
    expect(health).toHaveProperty('timestamp')
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    expect(typeof health.latency).toBe('number')
    expect(health.latency).toBeGreaterThan(0)
  })

  test('should handle multiple database operations in sequence', async () => {
    const operations = [
      () => prisma.user.count(),
      () => prisma.client.count(),
      () => prisma.creditTransaction.count()
    ]

    for (const operation of operations) {
      const start = Date.now()
      const result = await withDatabaseRetry(operation, 'count operation')
      const duration = Date.now() - start
      
      expect(typeof result).toBe('number')
      expect(duration).toBeLessThan(3000) // Menos de 3 segundos
    }
  })

  test('should handle connection pool metrics if available', async () => {
    try {
      const metrics = await prisma.$metrics.json()
      
      if (metrics && metrics.gauges) {
        const poolMetrics = metrics.gauges.filter(g => 
          g.key.includes('prisma_pool_connections')
        )
        
        expect(poolMetrics.length).toBeGreaterThan(0)
        
        poolMetrics.forEach(metric => {
          expect(metric).toHaveProperty('key')
          expect(metric).toHaveProperty('value')
          expect(typeof metric.value).toBe('number')
        })
      }
    } catch (error) {
      // Métricas podem não estar disponíveis em todos os ambientes
      console.log('Metrics not available:', error)
    }
  })
})

describe('Retry Mechanism Tests', () => {
  test('should retry on retryable errors', async () => {
    let attempts = 0
    
    const result = await withRetry(async () => {
      attempts++
      if (attempts < 3) {
        const error = new Error('Connection timeout')
        ;(error as any).code = 'P2024'
        throw error
      }
      return 'success'
    }, {
      maxRetries: 3,
      baseDelay: 100
    })

    expect(result).toBe('success')
    expect(attempts).toBe(3)
  })

  test('should not retry on non-retryable errors', async () => {
    let attempts = 0
    
    await expect(withRetry(async () => {
      attempts++
      const error = new Error('Validation error')
      ;(error as any).code = 'P2002' // Unique constraint violation
      throw error
    }, {
      maxRetries: 3,
      baseDelay: 100
    })).rejects.toThrow('Validation error')

    expect(attempts).toBe(1)
  })

  test('should respect max retries limit', async () => {
    let attempts = 0
    
    await expect(withRetry(async () => {
      attempts++
      const error = new Error('Persistent timeout')
      ;(error as any).code = 'P2024'
      throw error
    }, {
      maxRetries: 2,
      baseDelay: 50
    })).rejects.toThrow('Persistent timeout')

    expect(attempts).toBe(3) // Initial attempt + 2 retries
  })

  test('should use exponential backoff', async () => {
    const delays: number[] = []
    let attempts = 0
    
    await expect(withRetry(async () => {
      attempts++
      const error = new Error('Timeout')
      ;(error as any).code = 'P2024'
      throw error
    }, {
      maxRetries: 3,
      baseDelay: 100,
      backoffFactor: 2,
      onRetry: (error, attempt) => {
        delays.push(Date.now())
      }
    })).rejects.toThrow('Timeout')

    expect(attempts).toBe(4) // Initial + 3 retries
    expect(delays.length).toBe(3) // 3 retry delays
    
    // Verificar que os delays aumentam (com tolerância para timing)
    if (delays.length >= 2) {
      const firstDelay = delays[1] - delays[0]
      const secondDelay = delays[2] - delays[1]
      expect(secondDelay).toBeGreaterThan(firstDelay * 1.5)
    }
  })
})

describe('Database Retry Tests', () => {
  test('should handle database-specific retry conditions', async () => {
    let attempts = 0
    
    const result = await withDatabaseRetry(async () => {
      attempts++
      if (attempts === 1) {
        const error = new Error('Timed out fetching a new connection from the connection pool')
        ;(error as any).code = 'P2024'
        throw error
      }
      return { success: true, attempts }
    }, 'test database operation')

    expect(result).toEqual({ success: true, attempts: 2 })
    expect(attempts).toBe(2)
  })

  test('should handle connection pool timeout specifically', async () => {
    const mockError = new Error('Timed out fetching a new connection from the connection pool')
    ;(mockError as any).code = 'P2024'
    
    let attempts = 0
    const result = await withDatabaseRetry(async () => {
      attempts++
      if (attempts === 1) {
        throw mockError
      }
      return 'recovered'
    }, 'pool timeout test')

    expect(result).toBe('recovered')
    expect(attempts).toBe(2)
  })
})

describe('Webhook Retry Tests', () => {
  test('should handle webhook timeout errors', async () => {
    let attempts = 0
    
    const result = await withWebhookRetry(async () => {
      attempts++
      if (attempts === 1) {
        const error = new Error('Request timeout')
        ;(error as any).name = 'AbortError'
        throw error
      }
      return { status: 200, data: 'success' }
    }, 'test webhook')

    expect(result).toEqual({ status: 200, data: 'success' })
    expect(attempts).toBe(2)
  })

  test('should handle server errors (5xx)', async () => {
    let attempts = 0
    
    const result = await withWebhookRetry(async () => {
      attempts++
      if (attempts === 1) {
        const error = new Error('Internal Server Error')
        ;(error as any).status = 500
        throw error
      }
      return { status: 200, data: 'recovered' }
    }, 'server error test')

    expect(result).toEqual({ status: 200, data: 'recovered' })
    expect(attempts).toBe(2)
  })

  test('should not retry client errors (4xx)', async () => {
    let attempts = 0
    
    await expect(withWebhookRetry(async () => {
      attempts++
      const error = new Error('Bad Request')
      ;(error as any).status = 400
      throw error
    }, 'client error test')).rejects.toThrow('Bad Request')

    expect(attempts).toBe(1)
  })
})

describe('Integration Tests', () => {
  test('should handle real database operations with retry', async () => {
    // Teste com operação real que pode falhar
    const result = await withDatabaseRetry(async () => {
      return await prisma.$queryRaw`
        SELECT 
          COUNT(*) as user_count,
          NOW() as query_time,
          'connection_test' as test_type
      `
    }, 'integration test query')

    expect(Array.isArray(result)).toBe(true)
    expect((result as any)[0]).toHaveProperty('user_count')
    expect((result as any)[0]).toHaveProperty('query_time')
    expect((result as any)[0]).toHaveProperty('test_type', 'connection_test')
  })

  test('should maintain data consistency during retries', async () => {
    const testEmail = `test-consistency-${Date.now()}@example.com`
    
    try {
      // Tentar criar usuário com retry
      const user = await withDatabaseRetry(async () => {
        return await prisma.user.create({
          data: {
            clerkId: `test_${Date.now()}`,
            email: testEmail,
            firstName: 'Test',
            lastName: 'User',
            approvalStatus: 'PENDING',
            creditBalance: 0,
            version: 0,
            updatedAt: new Date()
          }
        })
      }, 'test user creation')

      expect(user).toHaveProperty('id')
      expect(user.email).toBe(testEmail)
      
      // Verificar que usuário foi criado corretamente
      const foundUser = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      
      expect(foundUser).not.toBeNull()
      expect(foundUser?.email).toBe(testEmail)
      
      // Limpar dados de teste
      await prisma.user.delete({
        where: { id: user.id }
      })
      
    } catch (error) {
      // Se falhar, garantir que não há dados órfãos
      const orphanUser = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      
      if (orphanUser) {
        await prisma.user.delete({
          where: { id: orphanUser.id }
        })
      }
      
      throw error
    }
  })
}) 